"""Loop wptrunner's daemon-startup burst, and nothing else (Future work 3.5g).

THROWAWAY -- DO NOT MERGE.

Why this exists
---------------
Every observed WinError 997 lands in the daemon-startup burst: `age_s` 0.34-0.57s
and `select_index` 1-2, i.e. within the first second of a socketpair's life,
before a single test has run.  The existing loop nonetheless pays ~214s per trial
for a full `infrastructure/` pass -- roughly 1.5% of the wall clock is spent
inside the window that can actually fail.

This driver keeps the exposure and drops the rest.  It calls
`serve.start(...)` with the *same arguments* `TestEnvironment.__enter__`
(environment.py:154) passes, waits for the daemons to answer, then shuts them
down -- one cycle.  What is byte-identical to production: `ServerProc.start()`,
the spawn bootstrap, `create_daemon`, `WebTestServer.__init__`, and
`serve_forever`'s socketpair.  That is the entire failure surface.

It is a bisection, not merely a speedup.  The campaign's central unknown is the
>=750x gap between 6.5M clean synthetic trials and 2 hits in 268 real runs.  If
the rate survives here, everything after daemon startup is excluded and we have a
cheap reproducer.  If it collapses, the missing ingredient is in what this skips
(the browser, wptrunner's worker processes, sustained traffic) -- which is itself
the answer.

Why not `./wpt serve --exit-after-start`
----------------------------------------
It looked like the obvious vehicle, and it is not:

  * `serve.run()` builds its config from `ConfigBuilder`'s defaults, where most
    ports are `"auto"` (serve.py:1425-1436).  wptrunner hard-codes all of them
    (environment.py:196-208).  H6 is rejected partly *because* `get_port()`'s
    bind/close/rebind never runs under wptrunner; using `wpt serve` would
    reintroduce exactly that, changing the population under test.
  * `check_subdomains` defaults true (serve.py:1437) and starts an extra
    throwaway daemon plus ten seconds of HTTP polling; wptrunner sets it false.
  * It starts no `webtransport-h3` daemon unless asked, and `serve.run()` exits
    the process after one pass, so looping it means paying venv setup and
    `ConfigBuilder` teardown per cycle.

Fidelity is the whole point of this arm, so it reproduces wptrunner's
`build_config()` rather than `serve`'s.

What it deliberately still skips, and why that is the hypothesis
----------------------------------------------------------------
No browser, no msedgedriver, no `TestRunnerManager` workers, no test traffic.
That is not an oversight: those are strictly later than `ensure_started()`
(environment.py:297) and cannot be concurrent with a 997 landing in a daemon's
first second.  If the rate collapses anyway, that assumption is wrong, and
learning so is worth more than another bundle.

Reading the output
------------------
Cycle 1 of each process is the only fully faithful cycle -- everything after it
inherits TIME_WAIT and whatever else the previous cycle left behind, which is how
H7 (ephemeral-port pressure) came to look like a lead when it was harness state.
Every record carries `cycle`, and `--restart-every` bounds how warm a process is
allowed to get.  Analyse cycle 1 separately before pooling.

Quote every clean result against its cycle count.  The anchor is 5.9e-3 per
10-daemon run; below that, find out whether the cycles are less *exposed* before
concluding anything about the mechanism.

How to run it
-------------
`python wpt winsock-serve-loop ...`, never `python tools/ci/winsock_serve_loop.py`.
mozlog and the rest of wptrunner's requirements only exist inside the virtualenv
the wpt dispatcher builds, so a bare invocation dies at import.  Build 158830 --
3.5g's first run -- lost all 20 legs to precisely that, in under a second each,
and `continueOnError: true` reported every one of them SUCCESS.
"""

import argparse
import json
import os
import subprocess
import sys
import time
import traceback

here = os.path.dirname(os.path.abspath(__file__))
wpt_root = os.path.abspath(os.path.join(here, os.pardir, os.pardir))

sys.path.insert(0, wpt_root)

from tools import localpaths  # noqa: F401,E402  (side effect: sys.path)

# mozlog and the rest of wptrunner's requirements are NOT on the bare agent
# interpreter's path -- localpaths only adds in-tree directories. They arrive
# via the virtualenv `wpt` builds from tools/wptrunner/requirements.txt, which
# is why this script must be entered as `python wpt winsock-serve-loop` and not
# `python tools/ci/winsock_serve_loop.py`. Build 158830 lost all 20 legs to
# exactly this: ModuleNotFoundError at import, 0 cycles run, and
# continueOnError reported the job SUCCESS.
from mozlog import commandline  # noqa: E402

from tools.serve import serve  # noqa: E402
# Not tools.wptrunner.wptrunner: tools/wptrunner/ has no __init__.py, so the
# only importable name is the inner package, which localpaths has just put on
# sys.path. This is the same path wptrunner's own entry points take.
from wptrunner import environment as env  # noqa: E402
from wptrunner import mpcontext  # noqa: E402


# The name this is registered under in tools/ci/commands.json, used to build a
# child generation's argv.
COMMAND_NAME = "winsock-serve-loop"

# Distinct from 0/1 so a supervisor can tell "a hit stopped this" from "the
# generation finished its cycles" and from a crash.
HIT_EXIT_CODE = 3


# environment.py:196-208, verbatim.  Hard-coded rather than "auto" -- see the
# module docstring: get_port()'s bind/close/rebind is precisely what production
# does not do, and reintroducing it would change the population under test.
PORTS = {
    "http": [8000, 8001],
    "http-local": [8002],
    "http-public": [8003],
    "https": [8443, 8444],
    "https-local": [8445],
    "https-public": [8446],
    "ws": [8888],
    "wss": [8889],
    "h2": [9000],
    "webtransport-h3": [11000],
    "dns": [8053],
}

CERT_ROOT = os.path.join(wpt_root, "tools", "certs")


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycles", type=int, default=0,
                        help="Number of start/stop cycles; 0 means unlimited "
                             "(bounded by --deadline)")
    parser.add_argument("--deadline", type=float, default=0,
                        help="Stop after this many seconds; 0 means no deadline")
    parser.add_argument("--restart-every", type=int, default=0,
                        help="Start a fresh child process every N cycles, so no "
                             "process gets arbitrarily warm. 0 disables.")
    parser.add_argument("--out", default=None,
                        help="Append newline-delimited JSON records here as well "
                             "as to stdout")
    parser.add_argument("--webtransport-h3", action="store_true",
                        help="Start the webtransport-h3 daemon (10th socketpair). "
                             "Matches `wpt run edge`, which forces it on.")
    parser.add_argument("--no-webtransport-h3", action="store_false",
                        dest="webtransport_h3")
    parser.set_defaults(webtransport_h3=True)
    parser.add_argument("--dns", action="store_true", default=False,
                        help="Start the DNS daemon (off in production)")
    parser.add_argument("--startup-timeout", type=float, default=60,
                        help="Seconds to wait for all daemons to answer")
    parser.add_argument("--cycle-index-base", type=int, default=0,
                        help=argparse.SUPPRESS)  # set by the supervisor
    parser.add_argument("--generation", type=int, default=0,
                        help=argparse.SUPPRESS)  # set by the supervisor
    parser.add_argument("--child", action="store_true",
                        help=argparse.SUPPRESS)  # run cycles, don't supervise
    return parser


class Recorder:
    """Newline-delimited JSON to stdout, and optionally to a file.

    Flushed per record: this process is expected to be killed by a deadline
    watchdog mid-cycle, and a buffered tail would lose exactly the cycle that
    matters.
    """

    def __init__(self, path):
        self.path = path

    def __call__(self, **record):
        record.setdefault("ts", time.time())
        record.setdefault("pid", os.getpid())
        line = json.dumps(record, default=repr)
        print(line, flush=True)
        if self.path:
            try:
                with open(self.path, "a", encoding="utf-8") as fh:
                    fh.write(line + "\n")
            except OSError:
                pass


def build_config(logger):
    """wptrunner's TestEnvironment.build_config(), reduced to what matters here.

    Mirrors environment.py:191-235 for the fields that reach a daemon: the
    hard-coded ports, check_subdomains off, server_host 127.0.0.1 (edge.py:57's
    env_options), and pregenerated certs from tools/certs (run.py:87-96's
    defaults, which is what CI uses).  The parts left out -- inject_script,
    suppress_handler_traceback, doc_root overrides -- do not affect socket
    creation.
    """
    config = serve.ConfigBuilder(logger)
    config.ports = PORTS
    config.check_subdomains = False
    config.server_host = "127.0.0.1"
    config.doc_root = wpt_root
    # Not in ConfigBuilder._default: serve.build_config() and
    # TestEnvironment.build_config() both setattr it, and get_route_builder()
    # reads it off the entered Config (serve.py:993), so omitting it is an
    # AttributeError rather than a default.
    config.inject_script = None
    config.ssl = {
        "type": "pregenerated",
        "encrypt_after_connect": False,
        "pregenerated": {
            "host_key_path": os.path.join(CERT_ROOT, "web-platform.test.key"),
            "host_cert_path": os.path.join(CERT_ROOT, "web-platform.test.pem"),
            "ca_cert_path": os.path.join(CERT_ROOT, "cacert.pem"),
        },
    }
    return config


def wait_started(test_env, timeout):
    """environment.py:297-315's ensure_started, with our own deadline.

    Reuses TestEnvironment.test_servers() rather than reimplementing the probe,
    so "started" means the same thing it means in production -- including the
    webtransport-h3 special case, which blocks rather than failing fast.
    """
    end = time.time() + timeout
    while time.time() < end:
        failed, pending = test_env.test_servers()
        if failed:
            return False, f"failed: {failed}"
        if not pending:
            return True, None
        time.sleep(0.5)
    return False, "timed out waiting for servers"


class _EnvShim:
    """Just enough of TestEnvironment for test_servers() to run.

    test_servers() (environment.py:317-346) only touches self.servers,
    self.config and self.test_server_port. Constructing a real TestEnvironment
    would drag in the stash, the cache Manager and the log-queue thread, all of
    which this driver owns directly.
    """

    def __init__(self, servers, config):
        self.servers = servers
        self.config = config
        self.test_server_port = True

    test_servers = env.TestEnvironment.test_servers


def run_cycle(logger, record, cycle, mp_context, log_handlers, opts):
    """One TestEnvironment.__enter__ / __exit__, with nothing in between."""
    started = time.monotonic()
    config_ctx = build_config(logger)
    with config_ctx as config:
        routes = serve.get_route_builder(logger, config.aliases, config).get_routes()
        # The stash BaseManager and the cache Manager are both started
        # per-cycle because production starts them per-run inside the same
        # __enter__ (environment.py:141-142). They are two of the named-pipe
        # and handle-churn sources present during the burst, and Run 2's
        # harness omitted both -- which is on the list of things that might
        # explain its 750x shortfall.
        with mp_context.Manager(), serve.stash.StashServer(mp_context=mp_context):
            servers = serve.start(logger, config, routes, mp_context, log_handlers,
                                  webtransport_h3=opts.webtransport_h3,
                                  dns=opts.dns)
            spawned = time.monotonic()
            ok, why = wait_started(_EnvShim(servers, config), opts.startup_timeout)
            ready = time.monotonic()

            daemons = sum(len(v) for v in servers.values())

            for server in serve.iter_servers(servers):
                server.request_shutdown()
            for server in serve.iter_servers(servers):
                server.wait(timeout=30)

            exit_codes = {}
            for scheme, procs in servers.items():
                for port, server in procs:
                    exit_codes[f"{scheme}:{port}"] = server.proc.exitcode

    record(kind="cycle",
           cycle=cycle,
           daemons=daemons,
           started=ok,
           startup_error=why,
           spawn_s=round(spawned - started, 3),
           ready_s=round(ready - spawned, 3),
           total_s=round(time.monotonic() - started, 3),
           exit_codes=exit_codes)
    return ok


def evidence_hit(path, seen_bytes):
    """Has the evidence file grown an `anomaly` record since we last looked?

    Cheaper and more direct than grepping logs for `WinError 997`: Change 0
    writes the bundle itself, and a hit is the only thing that writes `anomaly`.
    Returns (hit, new_offset).
    """
    if not path or not os.path.exists(path):
        return False, seen_bytes
    try:
        size = os.path.getsize(path)
        if size <= seen_bytes:
            return False, seen_bytes
        with open(path, encoding="utf-8") as fh:
            fh.seek(seen_bytes)
            tail = fh.read()
        return ('"kind": "anomaly' in tail or '"kind":"anomaly' in tail), size
    except OSError:
        return False, seen_bytes


def run_child(opts):
    """Run cycles in this process until cycles/deadline/hit stops us.

    One generation. The supervisor starts a fresh one every --restart-every
    cycles; see run_supervisor for why that is a real child rather than an
    os.execv.
    """
    record = Recorder(opts.out)

    # mozlog. commandline.setup_logging installs the default logger that
    # get_server_logger() then tags with component="wptserve" -- the same
    # logger object environment.py:103 hands to serve.start().
    commandline.setup_logging("winsock-serve-loop",
                              {"mach": sys.stdout},
                              {"level": "info"})
    logger = env.get_server_logger()

    # Not serve.MpContext(): that is multiprocessing's *default* context, which
    # is fork on POSIX. Production is spawn everywhere (mpcontext.py:12, forced
    # again by wpt.py:187), and spawn is what makes each daemon a cold process.
    mp_context = mpcontext.get_context()

    # The log handler production actually gives the daemons: a QueueHandler over
    # an mp.Queue (environment.py:71-89,136,158). Kept rather than simplified to
    # a stream handler because the Queue's feeder thread is itself one of the
    # open suspects -- it is the in-process source of overlapped I/O in the
    # daemon-startup window, and dropping it would quietly remove a candidate
    # condition from the arm meant to be the faithful one.
    logging_ctx = env.ProxyLoggingContext(logger)

    evidence_path = os.environ.get("WPT_WINSOCK_EVIDENCE_PATH")
    seen_bytes = os.path.getsize(evidence_path) \
        if evidence_path and os.path.exists(evidence_path) else 0

    deadline = time.monotonic() + opts.deadline if opts.deadline else None
    cycle = opts.cycle_index_base
    completed = 0
    hit = False

    record(kind="run-start",
           generation=opts.generation,
           cycle_index_base=opts.cycle_index_base,
           webtransport_h3=opts.webtransport_h3,
           dns=opts.dns,
           evidence_path=evidence_path,
           argv=sys.argv)

    # One log-queue thread for the whole process, not one per cycle: production
    # enters it once per run and it is not part of the burst.
    with logging_ctx as log_handler:
        while True:
            if opts.cycles and completed >= opts.cycles:
                break
            if deadline is not None and time.monotonic() >= deadline:
                break
            if opts.restart_every and completed >= opts.restart_every:
                break

            cycle += 1
            completed += 1
            try:
                run_cycle(logger, record, cycle, mp_context, [log_handler], opts)
            except Exception:
                # A cycle that blows up is data, not a reason to stop:
                # production sees WSAENOBUFS pair-create failures on this image.
                record(kind="cycle-error", cycle=cycle,
                       generation=opts.generation,
                       traceback=traceback.format_exc())

            hit, seen_bytes = evidence_hit(evidence_path, seen_bytes)
            if hit:
                record(kind="hit", cycle=cycle, generation=opts.generation,
                       evidence_path=evidence_path)
                break

    record(kind="run-end", generation=opts.generation, cycles=cycle,
           completed_here=completed)
    return HIT_EXIT_CODE if hit else 0


def run_supervisor(opts):
    """Run generations as child processes until the deadline, or a hit.

    Deliberately NOT os.execv, which was the original design and is wrong on
    the only platform this targets. On Windows there is no exec: the CRT's
    _wexecv spawns a *new* process and terminates the caller, so the PID
    changes. The pipeline step waits on the PID it launched
    (`$proc.WaitForExit(1800 * 1000)`), so the first restart would have looked
    like a clean exit -- publishing partial artifacts while an orphaned
    grandchild kept appending to cycles.jsonl underneath the publish step, and
    defeating the hard kill that exists because the silent-park class is real.

    Each generation is a real child, waited on, with the deadline recomputed
    from the supervisor's clock so restarts cannot extend the budget.
    """
    record = Recorder(opts.out)
    deadline = time.monotonic() + opts.deadline if opts.deadline else None

    record(kind="supervisor-start",
           restart_every=opts.restart_every,
           deadline_s=opts.deadline,
           evidence_path=os.environ.get("WPT_WINSOCK_EVIDENCE_PATH"),
           argv=sys.argv)

    generation = 0
    cycle_base = 0
    while True:
        remaining = None
        if deadline is not None:
            remaining = deadline - time.monotonic()
            if remaining <= 1:
                break

        generation += 1
        argv = _child_argv(opts, cycle_base, generation, remaining)
        record(kind="generation-start", generation=generation,
               cycle_index_base=cycle_base, remaining_s=remaining, argv=argv)

        started = time.monotonic()
        try:
            returncode = subprocess.call(argv, cwd=wpt_root)
        except OSError:
            record(kind="generation-error", generation=generation,
                   traceback=traceback.format_exc())
            break

        record(kind="generation-end", generation=generation,
               returncode=returncode,
               elapsed_s=round(time.monotonic() - started, 3))

        if returncode == HIT_EXIT_CODE:
            record(kind="supervisor-hit", generation=generation)
            break
        if returncode != 0:
            # A child that died on its own is data, but continuing would most
            # likely just reproduce it every generation until the deadline.
            record(kind="supervisor-abort", generation=generation,
                   returncode=returncode)
            break
        if not opts.restart_every:
            break

        cycle_base += opts.restart_every

    record(kind="supervisor-end", generations=generation)
    return 0


def _child_argv(opts, cycle_base, generation, remaining):
    """Build one generation's argv.

    Re-entered through `wpt` rather than as a bare script, because the
    virtualenv that provides mozlog is built by the wpt dispatcher: a child
    spawned as `python tools/ci/winsock_serve_loop.py` would die at import,
    which is exactly how build 158830 lost all 20 legs. sys.executable is
    already the venv interpreter by the time we are running, so --venv plus
    --skip-venv-setup keeps the child from rebuilding it -- but only when
    VIRTUAL_ENV is actually set, since `--venv ""` would have the dispatcher
    build a Virtualenv on the empty path rather than fall back to the default.
    """
    argv = [sys.executable, os.path.join(wpt_root, "wpt")]
    venv_path = os.environ.get("VIRTUAL_ENV")
    if venv_path:
        argv += ["--venv", venv_path, "--skip-venv-setup"]
    argv += [COMMAND_NAME,
             "--child",
             "--generation", str(generation),
             "--cycle-index-base", str(cycle_base),
             "--restart-every", str(opts.restart_every),
             "--startup-timeout", str(opts.startup_timeout)]
    if opts.cycles:
        argv += ["--cycles", str(opts.cycles)]
    if remaining is not None:
        argv += ["--deadline", str(max(1, int(remaining)))]
    if opts.out:
        argv += ["--out", opts.out]
    argv.append("--webtransport-h3" if opts.webtransport_h3
                else "--no-webtransport-h3")
    if opts.dns:
        argv.append("--dns")
    return argv


def run(venv, **kwargs):
    # venv is positional because commands.json marks this virtualenv: true --
    # wpt.py:228 prepends it. Unused here beyond the fact that entering through
    # the dispatcher is what built it and put mozlog on sys.path at all.
    opts = argparse.Namespace(**kwargs)
    if opts.child or not opts.restart_every:
        return run_child(opts)
    return run_supervisor(opts)


def main():
    return run(None, **vars(get_parser().parse_args()))


if __name__ == "__main__":
    # Supported for local debugging only: the dispatcher path
    # (`python wpt winsock-serve-loop`) is what builds the virtualenv, so a
    # bare invocation only works in an environment that already has mozlog.
    sys.exit(main())
