"""Discriminate the hypotheses for `[WinError 997]` (ERROR_IO_PENDING /
WSA_IO_PENDING) raised by a blocking recv() on one end of MAKE_PAIR().

On Windows there is no AF_UNIX and no native socketpair, so MAKE_PAIR()
is Lib/socket.py's `_fallback_socketpair`: a real loopback TCP connection.
wptserve uses such a pair as a shutdown channel in serve_forever(), and
intermittently the recv on it fails with WinError 997 (and, as a consequence of
serve_forever dying, a later send on the other end fails with WinError 10038).

Hypotheses:

  H1  mswsock/AFD genuinely returns a pending status for a *synchronous* recv on
      a recently created loopback socket.
        predicts: anomaly rate is a decreasing function of socket age; a
        retried recv succeeds; happens with or without a preceding select().
  H2  The reported code is stale: something (e.g. ws2_32's select) leaves 997 in
      the thread's last-error slot and the failing call fails to overwrite it.
        predicts: a *successful* select leaves 997 in the slot; anomalies only
        occur on the select-then-recv path, never on bare blocking recv;
        winerror disagrees with a raw WSAGetLastError()/raw recv().
  H3  Something in the process (LSP, AV/EDR inline hook, WFP shim) has put the
      socket into an overlapped/IOCP state.
        predicts: the socket is already associated with a completion port,
        and/or ws2_32/mswsock exports are inline-patched.
  H4  Handle-number reuse after a use-after-close elsewhere in the process.
        predicts: the failing socket's handle equals a handle recorded for some
        other (multiprocessing) object.

Design notes
------------
H2 and H3 are *deterministic* -- `--mode probes` settles them in seconds and
needs no reproduction.  Only H1 is stochastic.

`--mode wpt` is the load-bearing hunt, not a smoke test: it reproduces the
population that actually fails (one pair per process, ~9 spawned children, each
within a couple of seconds of startup, idle, with a random victim).  At
--duration 3600 --restart-every 5 --workers 9 that is roughly 6500 server
lifetimes of the right shape.

`--mode sweep` is the mechanism-discrimination tool, best used once you have a
hit -- or to bound a mechanism, not the bug.  It creates pairs serially in one
warm, long-lived process and registers a single fd, so it is *not* the wptserve
population: a null result there bounds "serial creation in a warm process" and
nothing more.  Within that limit it turns H1 into a dose-response measurement:
a grid of (socket age) x (call pattern) x (GIL load) x (mp pipe traffic), each
cell counted separately.  A rate that falls off with age is far stronger than a
single hit, and a clean grid gives a quantitative bound instead of "didn't
reproduce".

The `select-then-recv` vs `blocking-recv` axis is the sharpest single
discriminator available: if anomalies only ever appear on the former, the
preceding select() is necessary and H2 is implicated; if they appear on both, it
is not, and H1 is implicated.  Both arms issue their call at the *same* nominal
socket age, which is what makes the comparison mean anything.

Usage
-----
    py -3 winsock_probe.py --mode probes                     # seconds; do first
    py -3 winsock_probe.py --mode wpt --duration 20 --workers 1   # smoke
    py -3 winsock_probe.py --mode wpt --duration 3600 --workers 9 # the hunt
    py -3 winsock_probe.py --mode sweep --cell-seconds 120 --linger-reset
    py -3 winsock_probe.py --summarise findings.jsonl [more.jsonl ...]

Also worth running unchanged on Linux/macOS with --force-fallback as a negative
control on the identical code path: if the hunts fire there, the harness is
wrong rather than Windows.

Caveats
-------
* The IOCP probe *associates* the socket with a completion port when it was not
  already associated.  It therefore runs last, and only on sockets that are
  about to be discarded.
* Sockets under test are left blocking on purpose.  Setting a timeout would take
  a different path in CPython's sock_call_ex() (internal_select() plus a
  retry-on-EWOULDBLOCK loop) which could mask the very thing being measured.
  Verified faithful: nothing in tools/wptserve/ or tools/serve/serve.py calls
  settimeout/setblocking/setdefaulttimeout, so sock_timeout == -1 there too.
* Sweep cost is dominated by the age sleep plus one blocking select per trial,
  so cells are time-boxed (--cell-seconds) as well as trial-capped.  The age=2s
  cell costs ~2.5s per trial; a flat trial count would spend the whole run on
  the cells H1 predicts are clean.
* The sweep burns two ephemeral ports per trial and the active closer sits in
  TIME_WAIT.  Against Windows' ~16k dynamic range and a 2-minute TIME_WAIT,
  --linger-reset is effectively mandatory at large N, not optional, or the run
  degenerates into WSAEADDRINUSE backoff.  Those codes are counted separately.

Validation status (read before trusting a result)
-------------------------------------------------
As shipped, this has ONLY been run on macOS 26.6 / CPython 3.14.6.  What that
actually exercised: --mode probes, --mode sweep (both patterns, --load-threads,
--force-fallback, --linger-reset), --mode wpt (6 server lifetimes, 2 workers),
--summarise, and a synthetic anomaly through collect_evidence.

Every Windows-specific path is UNEXECUTED: wsa_last_error(), raw_recv(),
iocp_association_state(), probe_inline_hooks(), _non_system_modules(), the netsh
and powershell subprocesses, and all the ctypes argtypes/restypes above.  A
wrong signature there fails loudly, but a wrong *assumption* fails quietly --
so probe_baseline_iocp() self-tests its own central assumption (that
ERROR_INVALID_PARAMETER means "already associated") and reports
probe_self_test: BROKEN if it does not hold.  If that says BROKEN, ignore every
H3 verdict.

Run --mode probes on Windows first and read the raw JSON, not just the verdicts.
"""

from __future__ import annotations

import argparse
import collections
import errno
import itertools
import json
import os
import platform
import select
import selectors
import socket
import struct
import subprocess
import sys
import threading
import time
import traceback

IS_WINDOWS = sys.platform == "win32"

WSAEADDRINUSE = 10048
WSAENOBUFS = 10055
WSAECONNABORTED = 10053
WSAECONNRESET = 10054
WSAENOTCONN = 10057
ERROR_IO_PENDING = 997
ERROR_INVALID_PARAMETER = 87

PORT_PRESSURE = frozenset({WSAEADDRINUSE, WSAENOBUFS})
ABORT_CODES = frozenset({WSAENOTCONN, WSAECONNRESET, WSAECONNABORTED})

# On Windows MAKE_PAIR() *is* the loopback-TCP fallback, but on POSIX it
# is a native AF_UNIX pair.  --force-fallback makes every platform exercise
# Lib/socket.py's _fallback_socketpair, so a POSIX run is a real control for the
# same code path rather than a test of something else.
MAKE_PAIR = socket.socketpair


def use_fallback_socketpair() -> str:
    global MAKE_PAIR
    impl = getattr(socket, "_fallback_socketpair", None)
    if impl is None:
        return "unavailable (this Python has no socket._fallback_socketpair)"
    MAKE_PAIR = impl
    return "using socket._fallback_socketpair (loopback TCP)"


# ---------------------------------------------------------------------------
# Windows plumbing (stubbed elsewhere so the harness runs as a control).
# ---------------------------------------------------------------------------

if IS_WINDOWS:
    import ctypes
    import ctypes.wintypes as wt

    SOCKET = ctypes.c_size_t  # UINT_PTR

    # use_last_error=False matters: with True, ctypes saves/restores the slot
    # into its own storage and the H2 probe would be measuring ctypes.
    _ws2 = ctypes.WinDLL("ws2_32", use_last_error=False)
    _k32 = ctypes.WinDLL("kernel32", use_last_error=False)
    # Separate handle for calls where we *do* want ctypes to capture the error.
    _k32e = ctypes.WinDLL("kernel32", use_last_error=True)

    _ws2.WSAGetLastError.argtypes = []
    _ws2.WSAGetLastError.restype = ctypes.c_int
    _ws2.recv.argtypes = [SOCKET, ctypes.c_char_p, ctypes.c_int, ctypes.c_int]
    _ws2.recv.restype = ctypes.c_int

    _k32.GetModuleHandleW.argtypes = [ctypes.c_wchar_p]
    _k32.GetModuleHandleW.restype = ctypes.c_void_p
    _k32.LoadLibraryW.argtypes = [ctypes.c_wchar_p]
    _k32.LoadLibraryW.restype = ctypes.c_void_p
    _k32.GetProcAddress.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
    _k32.GetProcAddress.restype = ctypes.c_void_p
    _k32.GetCurrentProcess.argtypes = []
    _k32.GetCurrentProcess.restype = ctypes.c_void_p

    _k32e.CreateIoCompletionPort.argtypes = [
        ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, wt.DWORD,
    ]
    _k32e.CreateIoCompletionPort.restype = ctypes.c_void_p
    _k32e.CloseHandle.argtypes = [ctypes.c_void_p]
    _k32e.CloseHandle.restype = wt.BOOL

    def wsa_last_error() -> int:
        """The thread's last-error value, read with no intervening call."""
        return _ws2.WSAGetLastError()

    def raw_recv(fd: int) -> dict:
        """recv() one byte straight through ws2_32, bypassing CPython."""
        buf = ctypes.create_string_buffer(1)
        n = _ws2.recv(SOCKET(fd), buf, 1, 0)
        return {"ret": n, "wsa_error": wsa_last_error() if n < 0 else 0}

    def iocp_association_state(fd: int) -> str:
        """Is this socket already associated with a completion port?

        Associating an already-associated handle fails with
        ERROR_INVALID_PARAMETER.  DESTRUCTIVE: on an unassociated handle this
        call succeeds and thereby associates it.  Discard the socket after.
        """
        port = _k32e.CreateIoCompletionPort(ctypes.c_void_p(-1), None, 0, 0)
        if not port:
            return f"probe-failed:{ctypes.get_last_error()}"
        try:
            if _k32e.CreateIoCompletionPort(ctypes.c_void_p(fd), port, 0, 0):
                return "not-associated"
            err = ctypes.get_last_error()
            if err == ERROR_INVALID_PARAMETER:
                return "already-associated"
            return f"error:{err}"
        finally:
            _k32e.CloseHandle(port)

else:

    def wsa_last_error() -> int:
        return 0

    def raw_recv(fd: int) -> dict:
        return {"ret": None, "wsa_error": None, "skipped": "not-windows"}

    def iocp_association_state(fd: int) -> str:
        return "skipped:not-windows"


def sock_error_code(exc: BaseException) -> int | None:
    # Not `winerror or errno`: winerror == 0 is a real value here (wptserve's
    # own acceptable_errors includes 0), and would fall through to errno.
    err = getattr(exc, "winerror", None)
    return err if err is not None else getattr(exc, "errno", None)


def linger_bytes(onoff: int = 1, seconds: int = 0) -> bytes:
    """SO_LINGER payload, which is NOT the same shape on both platforms.

    POSIX:   struct linger { int l_onoff; int l_linger; }        -- 8 bytes
    Windows: struct linger { u_short l_onoff; u_short l_linger; } -- 4 bytes

    Passing the POSIX 8-byte form to Winsock's setsockopt is a wrong optlen and
    can fail with WSAEFAULT rather than setting the option, which would silently
    turn --linger-reset into a no-op and leave the sweep in TIME_WAIT backoff.
    """
    return struct.pack("HH" if IS_WINDOWS else "ii", onoff, seconds)


def _safe(fn):
    try:
        return fn()
    except OSError as exc:
        return {"winerror": getattr(exc, "winerror", None), "errno": exc.errno}
    except Exception as exc:  # noqa: BLE001 - diagnostics must not raise
        return f"error: {exc!r}"


# ---------------------------------------------------------------------------
# Phase A: deterministic probes.  These settle H2 and H3 without a repro.
# ---------------------------------------------------------------------------

def probe_environment() -> dict:
    import _socket

    out = {
        "python": sys.version,
        "platform": platform.platform(),
        "machine": platform.machine(),
        "pid": os.getpid(),
        "has_AF_UNIX": hasattr(socket, "AF_UNIX"),
        "native_socketpair": hasattr(_socket, "socketpair"),
        "socketpair_impl": getattr(socket.socketpair, "__name__", "?"),
        "selector_impl": selectors.DefaultSelector.__name__,
    }
    if IS_WINDOWS:
        out["windows_version"] = tuple(sys.getwindowsversion())
        for key, cmd in (
            ("winsock_catalog", ["netsh", "winsock", "show", "catalog"]),
            ("defender", ["powershell", "-NoProfile", "-Command",
                          "Get-MpComputerStatus | Select-Object "
                          "AMServiceEnabled,RealTimeProtectionEnabled,"
                          "AMProductVersion | Format-List"]),
        ):
            try:
                proc = subprocess.run(cmd, capture_output=True, text=True,
                                      timeout=90)
                out[key] = proc.stdout.strip() or proc.stderr.strip()
            except Exception as exc:  # noqa: BLE001
                out[key] = f"unavailable: {exc!r}"
        out["non_system_modules"] = _non_system_modules()
    return out


def _non_system_modules():
    """DLLs loaded from outside %SystemRoot% -- an H3 flavour check."""
    if not IS_WINDOWS:
        return "skipped:not-windows"
    import ctypes
    import ctypes.wintypes as wt

    try:
        psapi = ctypes.WinDLL("psapi", use_last_error=True)
        # Declare these: without argtypes ctypes converts pointer-sized values
        # as C int, which truncates 64-bit handles.
        psapi.EnumProcessModules.argtypes = [
            ctypes.c_void_p, ctypes.POINTER(ctypes.c_void_p), wt.DWORD,
            ctypes.POINTER(wt.DWORD),
        ]
        psapi.EnumProcessModules.restype = wt.BOOL
        psapi.GetModuleFileNameExW.argtypes = [
            ctypes.c_void_p, ctypes.c_void_p, ctypes.c_wchar_p, wt.DWORD,
        ]
        psapi.GetModuleFileNameExW.restype = wt.DWORD
        proc = _k32.GetCurrentProcess()
        count = 2048
        arr = (ctypes.c_void_p * count)()
        needed = wt.DWORD()
        if not psapi.EnumProcessModules(ctypes.c_void_p(proc), arr,
                                        ctypes.sizeof(arr),
                                        ctypes.byref(needed)):
            return f"EnumProcessModules failed: {ctypes.get_last_error()}"
        n = min(count, needed.value // ctypes.sizeof(ctypes.c_void_p))
        buf = ctypes.create_unicode_buffer(1024)
        root = os.environ.get("SystemRoot", r"C:\Windows").lower()
        found = []
        for i in range(n):
            if psapi.GetModuleFileNameExW(ctypes.c_void_p(proc), arr[i],
                                         buf, 1024):
                if not buf.value.lower().startswith(root):
                    found.append(buf.value)
        return found
    except Exception as exc:  # noqa: BLE001
        return f"unavailable: {exc!r}"


def probe_last_error_hygiene() -> dict:
    """H2's premise: does a *successful* call leave 997 in the slot?"""
    out = {}
    a, b = MAKE_PAIR()
    with a, b:
        select.select([a], [], [], 0.05)          # succeeds by timing out
        out["after_select_timeout"] = wsa_last_error()

        b.sendall(b"x")
        select.select([a], [], [], 1.0)           # succeeds, ready
        out["after_select_ready"] = wsa_last_error()

        a.recv(1)
        out["after_recv_success"] = wsa_last_error()

        with selectors.DefaultSelector() as sel:  # the wptserve path
            sel.register(a, selectors.EVENT_READ)
            sel.select(timeout=0.05)
            out["after_selectors_select"] = wsa_last_error()

        b.sendall(b"y")
        with selectors.DefaultSelector() as sel:
            sel.register(a, selectors.EVENT_READ)
            sel.select(timeout=1.0)
            out["after_selectors_ready"] = wsa_last_error()
        a.recv(1)

    leaked = [k for k, v in out.items() if v == ERROR_IO_PENDING]
    out["verdict"] = (
        f"H2 PREMISE HOLDS: 997 left in slot by {leaked}" if leaked
        else "H2 premise fails: no successful call left 997 in the slot"
    )
    return out


def _rst_pair():
    """A pair whose read end has a pending RST, with the slot primed by select."""
    a, b = MAKE_PAIR()
    select.select([a], [], [], 0.05)  # prime the slot the way wptserve does
    b.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, linger_bytes())
    b.close()
    time.sleep(0.05)
    return a, b


def probe_error_fidelity() -> dict:
    """Does a failing recv report its own code, or an earlier one?

    Uses two identically prepared pairs, because a raw recv on the *same*
    socket would be a second call after the first already consumed the pending
    error -- which reliably returns EOF and tells you nothing.  One pair goes
    through CPython, the other straight through ws2_32; the codes should agree.
    """
    out = {}
    a1, b1 = _rst_pair()
    a2, b2 = _rst_pair()
    try:
        out["slot_after_priming_select"] = wsa_last_error()
        try:
            data = a1.recv(1)
            out["python_recv"] = {"ok": True, "len": len(data)}
        except OSError as exc:
            out["python_recv"] = {
                "ok": False,
                "winerror": getattr(exc, "winerror", None),
                "errno": exc.errno,
                # Exception construction has run by now, so a mismatch here is
                # weak evidence on its own; the cross-pair comparison is the
                # load-bearing one.
                "slot_after": wsa_last_error(),
            }
        out["raw_recv_other_pair"] = raw_recv(a2.fileno())
    finally:
        for s in (a1, b1, a2, b2):
            if s.fileno() != -1:
                s.close()

    py, raw = out.get("python_recv", {}), out.get("raw_recv_other_pair", {})
    if py.get("ok") is not False:
        out["verdict"] = ("inconclusive: the RST did not make recv fail "
                          "(expected on AF_UNIX; rerun with --force-fallback)")
    elif not raw.get("wsa_error"):
        out["verdict"] = (f"partial: python={py.get('winerror')}, raw pair gave "
                          f"ret={raw.get('ret')} (no error to compare)")
    elif py.get("winerror") == raw.get("wsa_error"):
        out["verdict"] = f"consistent: both report {py.get('winerror')}"
    else:
        out["verdict"] = (f"MISMATCH python={py.get('winerror')} "
                          f"raw={raw.get('wsa_error')} -- supports H2")
    return out


_STRONG_JMP = (b"\xe9", b"\xeb", b"\xff\x25")


def probe_inline_hooks() -> dict:
    """H3: are the relevant entry points inline-patched?"""
    if not IS_WINDOWS:
        return {"skipped": "not-windows"}
    import ctypes

    targets = {
        "ws2_32": ("recv", "send", "select", "WSARecv", "WSASend", "WSAPoll"),
        "mswsock": ("WSARecvEx",),
    }
    out, patched = {}, []
    for dll, names in targets.items():
        mod = _k32.GetModuleHandleW(dll) or _k32.LoadLibraryW(dll)
        if not mod:
            out[dll] = {"error": "not-loadable"}
            continue
        entries = {}
        for name in names:
            addr = _k32.GetProcAddress(mod, name.encode("ascii"))
            if not addr:
                entries[name] = {"error": "no-such-export"}
                continue
            first = ctypes.string_at(addr, 8)
            hooked = any(first.startswith(p) for p in _STRONG_JMP)
            entries[name] = {"bytes": first.hex(), "patched": hooked}
            if hooked:
                patched.append(f"{dll}!{name}")
        out[dll] = entries
    out["verdict"] = (
        f"H3 SUPPORT: inline-patched: {patched}" if patched
        else "no strong inline-hook signature (does not exclude LSP or WFP)"
    )
    return out


def probe_baseline_iocp() -> dict:
    """A fresh socketpair end should not be IOCP-associated.

    If it already is, something is doing it to every socket in the process and
    H3 is confirmed without ever reproducing the flake.

    This also self-tests the probe's central and otherwise unverified
    assumption: that a second association attempt on an already-associated
    handle fails with ERROR_INVALID_PARAMETER.  The first call associates the
    socket, so the second call must report already-associated.  If it does not,
    the probe cannot detect H3 at all and every H3 verdict is meaningless.
    """
    a, b = MAKE_PAIR()
    try:
        first = iocp_association_state(a.fileno())
        second = iocp_association_state(a.fileno())  # now definitely associated
    finally:
        a.close()
        b.close()

    if not IS_WINDOWS:
        self_test = "skipped:not-windows"
    elif first == "not-associated" and second == "already-associated":
        self_test = "valid"
    elif first == "already-associated":
        self_test = "inconclusive: was already associated before we touched it"
    else:
        self_test = (f"BROKEN: first={first} second={second} -- "
                     "ignore all H3 verdicts")
    return {
        "fresh_pair_state": first,
        "second_attempt": second,
        "probe_self_test": self_test,
        "verdict": ("H3 CONFIRMED process-wide" if first == "already-associated"
                    else f"baseline is {first}"),
    }


PROBES = (
    ("environment", probe_environment),
    ("last_error_hygiene", probe_last_error_hygiene),
    ("error_fidelity", probe_error_fidelity),
    ("inline_hooks", probe_inline_hooks),
    ("baseline_iocp", probe_baseline_iocp),
)


def run_probes(sink) -> None:
    for name, fn in PROBES:
        try:
            result = fn()
        except Exception:  # noqa: BLE001 - one bad probe must not stop the rest
            result = {"probe_error": traceback.format_exc()}
        print(f"\n=== {name} ===")
        print(json.dumps(result, indent=2, default=str))
        sink({"kind": "probe", "probe": name, "result": result})


# ---------------------------------------------------------------------------
# Evidence bundle: ordered cheapest and least destructive first, so that a
# single occurrence is self-describing and sufficient.
# ---------------------------------------------------------------------------

def collect_evidence(sock, peer, created_at, exc, context, extra=None) -> dict:
    ev = {
        "kind": "anomaly",
        "ts": time.time(),
        "pid": os.getpid(),
        "thread": threading.current_thread().name,
        "context": context,
        "winerror": getattr(exc, "winerror", None),
        "errno": getattr(exc, "errno", None),
        "exc": repr(exc),
        # Read the slot before anything else: H2 predicts it may disagree.
        "slot_now": wsa_last_error(),
        "age_s": time.monotonic() - created_at,
        "fileno": _safe(sock.fileno),
        "peer_fileno": _safe(peer.fileno) if peer is not None else None,
        "active_threads": threading.active_count(),
    }
    ev["getsockname"] = _safe(sock.getsockname)
    ev["getpeername"] = _safe(sock.getpeername)
    ev["reselect_readable"] = _safe(
        lambda: bool(select.select([sock], [], [], 0)[0]))
    # The socket under test is blocking and may have nothing to read (the
    # spurious-readable arm is exactly that case), so a blocking retry would
    # wedge the run on the first hit.  Force non-blocking: this is post-mortem
    # on a socket that is about to be discarded, so it cannot contaminate the
    # measurement.
    ev["retry_recv"] = _safe(lambda: _nonblocking_retry(sock))
    ev["raw_recv"] = _safe(lambda: raw_recv(sock.fileno()))
    ev["iocp"] = _safe(lambda: iocp_association_state(sock.fileno()))
    if extra:
        ev.update(extra)
    return ev


def _nonblocking_retry(sock) -> dict:
    """Retry the recv without any possibility of blocking."""
    try:
        sock.setblocking(False)
    except OSError as exc:
        return {"setblocking_failed": sock_error_code(exc)}
    try:
        return {"len": len(sock.recv(1))}
    except BlockingIOError:
        # Readable per select, yet nothing to read: notable in its own right.
        return {"would_block": True}


# ---------------------------------------------------------------------------
# GIL / pipe load, so cells can be compared with and without it.
# ---------------------------------------------------------------------------

class Load:
    """Optional background pressure: spinning threads (GIL contention) and
    multiprocessing pipe traffic (the only overlapped I/O in WPT's children)."""

    def __init__(self, threads: int = 0, pipe_traffic: bool = False):
        self._stop = threading.Event()
        self._threads: list[threading.Thread] = []
        self.n_threads = threads
        self.pipe_traffic = pipe_traffic
        self._queue = None
        self.handles: dict[str, object] = {}

    def __enter__(self):
        for i in range(self.n_threads):
            t = threading.Thread(target=self._spin, name=f"load-{i}",
                                 daemon=True)
            t.start()
            self._threads.append(t)
        if self.pipe_traffic:
            import multiprocessing
            self._queue = multiprocessing.get_context("spawn").Queue()
            for attr in ("_reader", "_writer"):
                obj = getattr(self._queue, attr, None)
                if obj is not None:
                    self.handles[attr] = _safe(obj.fileno)
            t = threading.Thread(target=self._pump, name="load-pipe",
                                 daemon=True)
            t.start()
            self._threads.append(t)
        return self

    def __exit__(self, *exc):
        self._stop.set()
        for t in self._threads:
            t.join(timeout=5)
        if self._queue is not None:
            self._queue.close()
            self._queue.join_thread()
        return False

    def _spin(self):
        x = 0
        while not self._stop.is_set():
            for _ in range(10000):
                x += 1
            time.sleep(0)

    def _pump(self):
        # put/get keeps the feeder thread writing to the pipe, which on Windows
        # is an overlapped WriteFile drained via GetOverlappedResult.
        queue = self._queue
        assert queue is not None
        while not self._stop.is_set():
            queue.put(b"x" * 256)
            try:
                queue.get(timeout=0.5)
            except Exception:  # noqa: BLE001 - queue.Empty and friends
                pass
            time.sleep(0.005)


# ---------------------------------------------------------------------------
# Phase B: the sweep.  A grid, not a blind loop.
# ---------------------------------------------------------------------------

# Socket ages to test, in seconds.  0.5 is where the observed CI failure sat.
DEFAULT_AGES = (0.0, 0.0005, 0.005, 0.05, 0.25, 0.5, 1.0, 2.0)
# The sharpest axis: does a preceding select() have to happen for it to fail?
PATTERNS = ("select-then-recv", "blocking-recv")


def _new_pair(stats):
    try:
        return MAKE_PAIR()
    except OSError as exc:
        code = sock_error_code(exc)
        stats[f"create_failed:{code}"] += 1
        if code in PORT_PRESSURE:
            time.sleep(1.0)  # ephemeral port / TIME_WAIT pressure: noise
        return None


def _close_pair(rsock, wsock, linger_reset, stats=None):
    # Set the option on *both* ends before closing *either*: closing one end
    # disconnects the other, and setsockopt(SO_LINGER) on an already
    # disconnected socket fails (EINVAL on macOS), which would silently make
    # --linger-reset a half no-op.
    if linger_reset:
        for s in (rsock, wsock):
            try:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER,
                             linger_bytes())
            except OSError as exc:
                # Do not swallow this: if the linger payload is rejected,
                # --linger-reset is a no-op and the run will drown in TIME_WAIT.
                if stats is not None:
                    stats[f"linger_setopt_failed:{sock_error_code(exc)}"] += 1
    rsock.close()
    wsock.close()


def _trial_select_then_recv(rsock, wsock, created_at, age, poll_interval,
                            stats, sink, cell):
    """wptserve's exact shape: age the socket, then select, then recv."""
    if age:
        time.sleep(age)
    issued_at_age = time.monotonic() - created_at
    with selectors.DefaultSelector() as sel:
        sel.register(rsock, selectors.EVENT_READ)

        # Nothing has been written, so a readable report is itself the anomaly.
        # Poll first (cheap), then do a *blocking* select, because that is what
        # wptserve does and a non-blocking poll is serviced by Winsock without
        # the IRP wait a blocking select performs -- the failure we are chasing
        # came out of a blocking select(0.5).  Cost: poll_interval per trial.
        spurious = bool(sel.select(timeout=0))
        stats["spurious_on_poll" if spurious else "quiet_on_poll"] += 1
        if not spurious:
            spurious = bool(sel.select(timeout=poll_interval))
            if spurious:
                stats["spurious_on_blocking_select"] += 1
        if spurious:
            stats["spurious_readable"] += 1
            try:
                data = rsock.recv(1)
                sink({"kind": "anomaly", "context": "spurious-readable-recv-ok",
                      "cell": cell, "ts": time.time(), "pid": os.getpid(),
                      "age_s": time.monotonic() - created_at,
                      "issued_at_age_s": issued_at_age,
                      "len": len(data), "winerror": None,
                      "fileno": rsock.fileno()})
            except OSError as exc:
                stats[f"recv_failed:{sock_error_code(exc)}"] += 1
                sink(collect_evidence(rsock, wsock, created_at, exc,
                                      "select-then-recv/spurious",
                                      {"cell": cell,
                                       "issued_at_age_s": issued_at_age}))
            return

        # Now do it for real: make it readable, then recv, as wptserve does.
        wsock.sendall(b"x")
        if not sel.select(timeout=max(poll_interval, 1.0)):
            stats["never_readable"] += 1
            sink({"kind": "anomaly", "context": "never-readable", "cell": cell,
                  "ts": time.time(), "pid": os.getpid(),
                  "age_s": time.monotonic() - created_at,
                  "issued_at_age_s": issued_at_age,
                  "fileno": rsock.fileno(), "winerror": None})
            return
        try:
            rsock.recv(1)
            stats["ok"] += 1
        except OSError as exc:
            stats[f"recv_failed:{sock_error_code(exc)}"] += 1
            sink(collect_evidence(rsock, wsock, created_at, exc,
                                  "select-then-recv/after-send",
                                  {"cell": cell,
                                   "issued_at_age_s": issued_at_age}))


def _trial_blocking_recv(rsock, wsock, created_at, age, poll_interval,
                         stats, sink, cell):
    """No select() at all: a bare blocking recv, woken by the peer.

    If 997 shows up here, the preceding select is not necessary and H2 is out.

    The age sleep must happen *before* the recv is issued: H1 is about the age
    at which the call is made.  Sleeping while the reader is already blocked
    would make every trial sample age 0 and break the comparison against
    select-then-recv.
    """
    result: dict = {}
    if age:
        time.sleep(age)
    issued_at_age = time.monotonic() - created_at

    def reader():
        try:
            result["data"] = rsock.recv(1)
        except OSError as exc:
            result["exc"] = exc
            result["slot"] = wsa_last_error()

    t = threading.Thread(target=reader, name="blocking-recv", daemon=True)
    t.start()
    time.sleep(0.005)  # short, fixed: just let the recv reach a blocking state
    try:
        wsock.sendall(b"x")
    except OSError as exc:
        stats[f"send_failed:{sock_error_code(exc)}"] += 1
        return
    t.join(timeout=10)
    if t.is_alive():
        stats["recv_hung"] += 1
        sink({"kind": "anomaly", "context": "blocking-recv/hung", "cell": cell,
              "ts": time.time(), "pid": os.getpid(), "winerror": None,
              "age_s": time.monotonic() - created_at,
              "issued_at_age_s": issued_at_age,
              "fileno": _safe(rsock.fileno)})
        return
    if "exc" in result:
        exc = result["exc"]
        stats[f"recv_failed:{sock_error_code(exc)}"] += 1
        sink(collect_evidence(rsock, wsock, created_at, exc, "blocking-recv",
                              {"cell": cell, "issued_at_age_s": issued_at_age,
                               "slot_in_thread": result.get("slot")}))
    else:
        stats["ok"] += 1


TRIALS = {
    "select-then-recv": _trial_select_then_recv,
    "blocking-recv": _trial_blocking_recv,
}


def hunt_sweep(sink, trials_per_cell: int, ages, patterns, rate: float,
               poll_interval: float, linger_reset: bool, load_threads: int,
               pipe_traffic: bool, deadline: float | None,
               cell_seconds: float) -> dict:
    """Run the grid.

    Cells are time-boxed as well as trial-capped, because per-trial cost is
    dominated by the age sleep plus the blocking select: the age=2s cell costs
    ~2.5s per trial, so a flat trial count would make the long-age cells
    (precisely the ones H1 predicts are clean) eat the whole run.  Each cell
    reports its own n, and --summarise bounds each cell separately.
    """
    cells = list(itertools.product(ages, patterns))
    per_cell = {}
    min_gap = 1.0 / rate if rate > 0 else 0.0

    with Load(load_threads, pipe_traffic) as load:
        if load.handles:
            sink({"kind": "load-handles", "pid": os.getpid(),
                  "mp_handles": load.handles})
        for age, pattern in cells:
            cell = f"age={age}s/{pattern}/load={load_threads}/pipe={pipe_traffic}"
            stats: collections.Counter = collections.Counter()
            started = time.monotonic()
            cell_deadline = started + cell_seconds
            next_start = started
            for _ in range(trials_per_cell):
                now = time.monotonic()
                if now > cell_deadline:
                    stats["stopped_on_cell_budget"] += 1
                    break
                if deadline is not None and now > deadline:
                    stats["stopped_on_run_deadline"] += 1
                    break
                if now < next_start:
                    time.sleep(next_start - now)
                next_start = time.monotonic() + min_gap

                pair = _new_pair(stats)
                if pair is None:
                    continue
                rsock, wsock = pair
                created_at = time.monotonic()
                stats["trials"] += 1
                try:
                    TRIALS[pattern](rsock, wsock, created_at, age,
                                    poll_interval, stats, sink,
                                    {"age": age, "pattern": pattern,
                                     "load_threads": load_threads,
                                     "pipe_traffic": pipe_traffic,
                                     "mp_handles": load.handles})
                finally:
                    _close_pair(rsock, wsock, linger_reset, stats)
            summary: dict[str, object] = dict(stats)
            summary["elapsed_s"] = round(time.monotonic() - started, 1)
            per_cell[cell] = summary
            print(f"  {cell}: {summary}")
            sink({"kind": "cell-summary", "cell": cell, "stats": summary})
    return per_cell


# ---------------------------------------------------------------------------
# Phase B2: the realistic shape -- spawned children, mp.Queue log feeder,
# mp.Event stop flag, threaded HTTP server, wptserve's serve_forever verbatim.
# ---------------------------------------------------------------------------

def _child_main(worker_id, log_queue, stop_flag, duration, poll_interval,
                restart_every, force_fallback=False, idle_first=2.0):
    import http.server

    if force_fallback:
        use_fallback_socketpair()

    def sink(record):
        record.setdefault("worker", worker_id)
        log_queue.put(("finding", record))

    mp_handles = {}
    for attr in ("_reader", "_writer"):
        obj = getattr(log_queue, attr, None)
        if obj is not None:
            mp_handles[attr] = _safe(obj.fileno)
    sink({"kind": "worker-start", "pid": os.getpid(), "mp_handles": mp_handles})

    class Handler(http.server.BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def do_GET(self):
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):  # noqa: A002 - matches base class
            pass

    class Server(http.server.ThreadingHTTPServer):
        allow_reuse_address = True
        daemon_threads = True
        # wptserve sets this (server.py:141); listen(2000) rather than listen(5)
        # is almost certainly irrelevant to the pair, but it is free to match.
        request_queue_size = 2000

        def __init__(self, *args, **kwargs):
            self._shutdown_event = threading.Event()
            self._shutdown_write_sock = None
            self.pair_created_at = None
            super().__init__(*args, **kwargs)

        def serve_forever(self, poll_interval=poll_interval):
            # wptserve's loop, unchanged except for instrumentation.
            read_sock, self._shutdown_write_sock = MAKE_PAIR()
            self.pair_created_at = time.monotonic()
            self._shutdown_event.clear()
            sink({"kind": "pair-created", "pid": os.getpid(),
                  "read_fileno": read_sock.fileno(),
                  "write_fileno": self._shutdown_write_sock.fileno(),
                  "mp_handles": mp_handles})
            try:
                with selectors.DefaultSelector() as selector:
                    selector.register(self, selectors.EVENT_READ)
                    selector.register(read_sock, selectors.EVENT_READ)
                    while True:
                        events = selector.select(timeout=poll_interval)
                        if any(key.fileobj == read_sock
                               and mask == selectors.EVENT_READ
                               for key, mask in events):
                            try:
                                read_sock.recv(1)
                            except OSError as exc:
                                sink(collect_evidence(
                                    read_sock, self._shutdown_write_sock,
                                    self.pair_created_at, exc,
                                    "wpt/shutdown-recv",
                                    {"mp_handles": mp_handles}))
                            break
                        for key, mask in events:
                            if key.fileobj is self and mask == selectors.EVENT_READ:
                                self._handle_request_noblock()
                        else:
                            self.service_actions()
            finally:
                read_sock.close()
                self._shutdown_write_sock.close()
                self._shutdown_event.set()

        def shutdown(self):
            try:
                self._shutdown_write_sock.send(b"x")
            except OSError as exc:
                # This is the WinError 10038 seen in CI: it means serve_forever
                # already exited and closed the pair.
                sink(collect_evidence(
                    self._shutdown_write_sock, None,
                    self.pair_created_at or time.monotonic(), exc,
                    "wpt/shutdown-send", {"mp_handles": mp_handles}))
                return
            self._shutdown_event.wait(30)

        def handle_error(self, request, client_address):
            # wptserve swallows EPIPE/ECONNABORTED/0 (server.py:306-322); our
            # client closes without draining, so do the same rather than
            # spewing tracebacks that would bury a real anomaly.
            exc = sys.exc_info()[1]
            code = sock_error_code(exc) if isinstance(exc, OSError) else None
            if code in (errno.EPIPE, errno.ECONNABORTED, errno.ECONNRESET, 0):
                return
            sink({"kind": "request-error", "exc": repr(exc), "code": code})

    deadline = time.monotonic() + duration
    restarts = 0
    while time.monotonic() < deadline and not stop_flag.is_set():
        try:
            httpd = Server(("127.0.0.1", 0), Handler)
        except OSError as exc:
            sink({"kind": "bind-failed", "exc": repr(exc)})
            time.sleep(1.0)
            continue
        port = httpd.socket.getsockname()[1]
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()

        # Stay idle first.  In CI the failure happened in a process that had not
        # served a single request: the daemons started at 0:20 and the crash was
        # ~0.7s later, while tests only began at 0:27.  Driving the client
        # immediately would structurally never visit that state.
        idle_until = time.monotonic() + idle_first
        while time.monotonic() < idle_until and not stop_flag.is_set():
            time.sleep(0.05)

        end = min(deadline, time.monotonic() + restart_every)
        while time.monotonic() < end and not stop_flag.is_set():
            try:
                with socket.create_connection(("127.0.0.1", port),
                                              timeout=5) as c:
                    c.sendall(b"GET / HTTP/1.1\r\nHost: x\r\n\r\n")
                    c.recv(4096)
            except OSError as exc:
                sink({"kind": "client-error", "exc": repr(exc)})
            log_queue.put(("log", f"worker {worker_id} tick"))
            time.sleep(0.01)

        httpd.shutdown()
        httpd.server_close()
        thread.join(timeout=30)
        if thread.is_alive():
            sink({"kind": "serve-forever-stuck", "port": port})
        restarts += 1

    sink({"kind": "worker-done", "restarts": restarts})
    log_queue.put(None)


def hunt_wpt(sink, duration: float, workers: int, poll_interval: float,
             restart_every: float, force_fallback: bool = False,
             idle_first: float = 2.0) -> dict:
    import multiprocessing
    import queue as queue_mod

    ctx = multiprocessing.get_context("spawn")
    log_queue = ctx.Queue()
    stop_flag = ctx.Event()
    procs = []
    for i in range(workers):
        p = ctx.Process(target=_child_main,
                        args=(i, log_queue, stop_flag, duration,
                              poll_interval, restart_every, force_fallback,
                              idle_first))
        p.start()
        procs.append(p)

    live, counts = workers, collections.Counter()
    try:
        while live:
            try:
                # Timeout, not a bare get(): a child that dies from an unhandled
                # exception never sends its sentinel, and a bare get() would
                # leave the parent blocked forever with no summary.
                item = log_queue.get(timeout=5)
            except queue_mod.Empty:
                dead = sum(1 for p in procs if not p.is_alive())
                if dead >= live:
                    for p in procs:
                        if not p.is_alive() and p.exitcode not in (0, None):
                            counts[f"child-died:{p.exitcode}"] += 1
                            sink({"kind": "child-died", "pid": p.pid,
                                  "exitcode": p.exitcode})
                    break
                continue
            if item is None:
                live -= 1
                continue
            kind, payload = item
            if kind == "finding":
                counts[payload.get("kind", "?")] += 1
                sink(payload)
                if payload.get("kind") == "anomaly":
                    print("ANOMALY:", json.dumps(payload, default=str))
            # "log" items exist only to keep the pipe busy; drop them.
    except KeyboardInterrupt:
        stop_flag.set()
    for p in procs:
        p.join(timeout=60)
    return {"records": dict(counts), "exitcodes": [p.exitcode for p in procs]}


# ---------------------------------------------------------------------------
# Verdict.
# ---------------------------------------------------------------------------

def summarise(paths: list[str]) -> None:
    records = []
    for path in paths:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    records.append(json.loads(line))

    probes = {r["probe"]: r["result"]
              for r in records if r.get("kind") == "probe"}
    anomalies = [r for r in records if r.get("kind") == "anomaly"]
    cells = [r for r in records if r.get("kind") == "cell-summary"]
    trials = sum(c["stats"].get("trials", 0) for c in cells)
    print(f"{len(records)} records; {trials} sweep trials; "
          f"{len(anomalies)} anomalies\n")

    def line(tag, supported, detail):
        print(f"{tag:4} {'SUPPORTED' if supported else 'not supported':14} {detail}")

    # H2: deterministic probe, plus any winerror/slot disagreement.
    hygiene = probes.get("last_error_hygiene", {})
    stale = [k for k, v in hygiene.items() if v == ERROR_IO_PENDING]
    mismatch = [a for a in anomalies
                if isinstance(a.get("slot_now"), int)
                and isinstance(a.get("winerror"), int)
                and a["slot_now"] != a["winerror"]]
    by_pattern = collections.Counter(
        (a.get("cell") or {}).get("pattern") if isinstance(a.get("cell"), dict)
        else None for a in anomalies)
    select_only = (by_pattern.get("select-then-recv", 0) > 0
                   and by_pattern.get("blocking-recv", 0) == 0)
    line("H2", bool(stale) or bool(mismatch) or select_only,
         f"slot leaks 997 after: {stale or 'nothing'}; "
         f"fidelity={probes.get('error_fidelity', {}).get('verdict', 'not run')}; "
         f"winerror!=slot: {len(mismatch)}; "
         f"select-only failures: {select_only} ({dict(by_pattern)})")

    # H3: IOCP association or inline hooks.
    baseline = probes.get("baseline_iocp", {}).get("fresh_pair_state", "not run")
    associated = [a for a in anomalies if a.get("iocp") == "already-associated"]
    hooks = probes.get("inline_hooks", {}).get("verdict", "")
    line("H3", baseline == "already-associated" or bool(associated)
         or "H3 SUPPORT" in hooks,
         f"fresh pair: {baseline}; associated at failure: {len(associated)}; "
         f"{hooks}")

    # H1: does the rate fall off with socket age, and is it transient?
    ages = sorted(a["age_s"] for a in anomalies
                  if isinstance(a.get("age_s"), (int, float)))
    transient = [a for a in anomalies
                 if isinstance(a.get("retry_recv"), dict)
                 and "len" in a["retry_recv"]]
    if ages:
        detail = (f"ages {ages[0]:.4f}..{ages[-1]:.4f}s; "
                  f"under 1s: {sum(1 for a in ages if a < 1)}/{len(ages)}; "
                  f"retry succeeded: {len(transient)}/{len(anomalies)}")
    else:
        detail = "no anomalies recorded"
    line("H1", bool(ages) and all(a < 1.0 for a in ages), detail)

    # H4: handle collision with a recorded multiprocessing handle.
    collisions = []
    for a in anomalies:
        fn = a.get("fileno")
        handles = a.get("mp_handles") or {}
        if isinstance(handles, dict) and isinstance(fn, int):
            if fn in [h for h in handles.values() if isinstance(h, int)]:
                collisions.append(a)
    line("H4", bool(collisions), f"handle collisions: {len(collisions)}")

    # The competing "connection was aborted" reading.
    aborted = [a for a in anomalies
               if isinstance(a.get("getpeername"), dict)
               and a["getpeername"].get("winerror") in ABORT_CODES]
    print(f"\n     aborted-connection signature: {len(aborted)}/{len(anomalies)}")
    print(f"     winerror histogram: "
          f"{dict(collections.Counter(a.get('winerror') for a in anomalies))}")

    # Per-cell rates: the dose-response curve H1 predicts.
    if cells:
        print("\n     per-cell rates (anomalies/trials):")
        anom_by_cell = collections.Counter(
            f"age={(a.get('cell') or {}).get('age')}s/"
            f"{(a.get('cell') or {}).get('pattern')}"
            for a in anomalies if isinstance(a.get("cell"), dict))
        for c in cells:
            n = c["stats"].get("trials", 0)
            key = c["cell"].split("/load=")[0]
            k = anom_by_cell.get(key, 0)
            if n:
                bound = "" if k else f" (95% upper bound {3 / n:.2g})"
                print(f"       {c['cell']}: {k}/{n}{bound}")

    # What a null result is worth.
    if trials and not anomalies:
        print(f"\n     0 anomalies in {trials} sweep trials => 95% upper bound "
              f"{3 / trials:.2g} per trial -- but ONLY for the sweep's "
              "population:")
        print("     serial pair creation in one warm process with a single fd "
              "registered.")
        print("     It does not bound the wptserve population (one pair per "
              "spawned process,")
        print("     idle, seconds after startup); use --mode wpt for that, and "
              "count its")
        print("     pair-created records as the denominator.")
    pairs = sum(1 for r in records if r.get("kind") == "pair-created")
    if pairs:
        anomalous = len([a for a in anomalies
                         if str(a.get("context", "")).startswith("wpt/")])
        bound = f", 95% upper bound {3 / pairs:.2g}" if not anomalous else ""
        print(f"\n     wpt-shaped population: {anomalous}/{pairs} server "
              f"lifetimes{bound}")


# ---------------------------------------------------------------------------

def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        description="Discriminate WinError 997 hypotheses for MAKE_PAIR()",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--mode", default="probes",
                   choices=("probes", "sweep", "wpt", "all"))
    p.add_argument("--trials", type=int, default=500,
                   help="trial cap per sweep cell (default 500)")
    p.add_argument("--cell-seconds", type=float, default=120.0,
                   help="wall-clock budget per sweep cell (default 120); the "
                        "cell stops at whichever of this and --trials comes "
                        "first, so long-age cells cannot eat the run")
    p.add_argument("--idle-first", type=float, default=2.0,
                   help="seconds each wpt-mode server stays idle after start "
                        "before any request; the CI failure happened in an "
                        "idle process, so 0 here may miss it entirely")
    p.add_argument("--ages", type=float, nargs="+", default=list(DEFAULT_AGES),
                   help="socket ages in seconds to test")
    p.add_argument("--patterns", nargs="+", default=list(PATTERNS),
                   choices=list(PATTERNS))
    p.add_argument("--duration", type=float, default=600.0,
                   help="seconds for the wpt hunt / sweep ceiling")
    p.add_argument("--workers", type=int, default=9,
                   help="child processes in wpt mode (WPT itself runs ~9)")
    p.add_argument("--rate", type=float, default=200.0,
                   help="pairs/second ceiling; 0 = unthrottled")
    p.add_argument("--poll-interval", type=float, default=0.5,
                   help="selector timeout, matching wptserve")
    p.add_argument("--restart-every", type=float, default=5.0,
                   help="seconds between server restarts in wpt mode")
    p.add_argument("--load-threads", type=int, default=0,
                   help="spinning threads for GIL contention")
    p.add_argument("--pipe-traffic", action="store_true",
                   help="run an mp.Queue feeder alongside (overlapped I/O)")
    p.add_argument("--linger-reset", action="store_true",
                   help="tear pairs down with RST to avoid TIME_WAIT")
    p.add_argument("--force-fallback", action="store_true",
                   help="use socket._fallback_socketpair (loopback TCP) on every "
                        "platform; makes a POSIX run a real control")
    p.add_argument("--out", default="findings.jsonl")
    p.add_argument("--summarise", nargs="+", metavar="FILE",
                   help="summarise existing findings and exit")
    args = p.parse_args(argv)

    if args.summarise:
        summarise(args.summarise)
        return 0

    if not IS_WINDOWS:
        print("NOTE: not Windows; Windows-only probes are stubbed. Running the "
              "hunts here is still useful as a negative control.\n")

    if args.force_fallback:
        print(f"socketpair: {use_fallback_socketpair()}\n")

    out = open(args.out, "a", encoding="utf-8")

    def sink(record):
        out.write(json.dumps(record, default=str) + "\n")
        out.flush()

    try:
        sink({"kind": "run-start", "ts": time.time(), "argv": sys.argv})
        if args.mode in ("probes", "all"):
            run_probes(sink)
        if args.mode in ("sweep", "all"):
            print("\n=== sweep ===")
            result = hunt_sweep(
                sink, args.trials, args.ages, args.patterns, args.rate,
                args.poll_interval, args.linger_reset, args.load_threads,
                args.pipe_traffic,
                time.monotonic() + args.duration if args.mode == "all" else None,
                args.cell_seconds)
            sink({"kind": "hunt-summary", "hunt": "sweep", "result": result})
        if args.mode in ("wpt", "all"):
            print("\n=== wpt-shaped hunt ===")
            result = hunt_wpt(sink, args.duration, args.workers,
                              args.poll_interval, args.restart_every,
                              args.force_fallback, args.idle_first)
            print(json.dumps(result, indent=2))
            sink({"kind": "hunt-summary", "hunt": "wpt", "result": result})
    finally:
        out.close()

    print(f"\nfindings appended to {args.out}; "
          f"now run: {sys.executable} {sys.argv[0]} --summarise {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
