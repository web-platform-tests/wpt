#!/usr/bin/env python3
# mypy: allow-untyped-defs

"""Wrapper script for running jobs in Taskcluster

This is intended for running test jobs in Taskcluster. The script
takes a two positional arguments which are the name of the test job
and the script to actually run.

The name of the test job is used to determine whether the script should be run
for this push (this is in lieu of having a proper decision task). There are
several ways that the script can be scheduled to run

1. The output of wpt test-jobs includes the job name
2. The job name is included in a job declaration (see below)
3. The string "all" is included in the job declaration
4. The job name is set to "all"

A job declaration is a line appearing in the pull request body (for
pull requests) or first commit message (for pushes) of the form:

tc-jobs: job1,job2,[...]

In addition, there are a number of keyword arguments used to set options for the
environment in which the jobs run. Documentation for these is in the command help.

As well as running the script, the script sets two environment variables;
GITHUB_BRANCH which is the branch that the commits will merge into (if it's a PR)
or the branch that the commits are on (if it's a push), and GITHUB_PULL_REQUEST
which is the string "false" if the event triggering this job wasn't a pull request
or the pull request number if it was. The semantics of these variables are chosen
to match the corresponding TRAVIS_* variables.

Note: for local testing in the Docker image the script ought to still work, but
full functionality requires that the TASK_EVENT environment variable is set to
the serialization of a GitHub event payload.
"""

import argparse
import fnmatch
import glob
import json
import os
import stat
import subprocess
import sys
import tarfile
import tempfile
import threading
import time
import zipfile

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from tools.wpt.httputils import get_download_to_descriptor

root = os.path.abspath(
    os.path.join(os.path.dirname(__file__),
                 os.pardir,
                 os.pardir))


started_processes = []

# DEBUG(wpt#62901): the first Chrome launch on a fresh CI worker stalls for
# 20-46s.  When True, read the files Chrome needs at startup before running
# the job, and report how long each group takes.  When False, only record the
# I/O statistics so that a run without warmed caches can be used as a baseline.
COLD_START_PREREAD = True


def run(cmd, return_stdout=False, **kwargs):
    print(" ".join(cmd))
    if return_stdout:
        f = subprocess.check_output
        if "encoding" not in kwargs:
            kwargs["encoding"] = "utf-8"
    else:
        f = subprocess.check_call
    return f(cmd, **kwargs)


def start(cmd):
    print(" ".join(cmd))
    started_processes.append(subprocess.Popen(cmd))


def get_parser():
    p = argparse.ArgumentParser()
    p.add_argument("--oom-killer",
                   action="store_true",
                   help="Run userspace OOM killer")
    p.add_argument("--hosts",
                   dest="hosts_file",
                   action="store_true",
                   default=True,
                   help="Setup wpt entries in hosts file")
    p.add_argument("--no-hosts",
                   dest="hosts_file",
                   action="store_false",
                   help="Don't setup wpt entries in hosts file")
    p.add_argument("--browser",
                   action="append",
                   default=[],
                   help="Browsers that will be used in the job")
    p.add_argument("--channel",
                   choices=["experimental", "canary", "dev", "nightly", "beta", "stable"],
                   help="Chrome browser channel")
    p.add_argument("--xvfb",
                   action="store_true",
                   help="Start xvfb")
    p.add_argument("--install-certificates", action="store_true", default=None,
                   help="Install web-platform.test certificates to UA store")
    p.add_argument("--no-install-certificates", action="store_false", default=None,
                   help="Don't install web-platform.test certificates to UA store")
    p.add_argument("--setup-repository", action="store_true", default=None, dest="setup_repository",
                   help="Run any repository setup steps, instead use the existing worktree")
    p.add_argument("--no-setup-repository", action="store_false", dest="setup_repository",
                   help="Don't run any repository setup steps, instead use the existing worktree. "
                        "This is useful for local testing.")
    p.add_argument("--checkout",
                   help="Revision to checkout before starting job")
    p.add_argument("--ref",
                   help="Git ref for the commit that should be run")
    p.add_argument("--head-rev",
                   help="Commit at the head of the branch when the decision task ran")
    p.add_argument("--merge-rev",
                   help="Provisional merge commit for PR when the decision task ran")
    p.add_argument("script",
                   help="Script to run for the job")
    p.add_argument("script_args",
                   nargs=argparse.REMAINDER,
                   help="Additional arguments to pass to the script")
    return p


def start_userspace_oom_killer(log_only=False):
    # Start userspace OOM killer: https://github.com/rfjakob/earlyoom
    # It will report memory usage every minute and prefer to kill browsers.
    cmd = ["sudo", "earlyoom", "-p", "-r", "60", "--prefer=(chrome|firefox)", "--avoid=python"]
    if log_only:
        cmd.append("--dryrun")
    start(cmd)


def read_io_counters():
    counters = {}
    with open("/proc/vmstat") as f:
        for line in f:
            name, value = line.split()
            if name in ("pgpgin", "pgmajfault"):
                counters[name] = int(value)
    with open("/proc/stat") as f:
        # cpu user nice system idle iowait irq softirq steal ...
        cpu = [int(value) for value in f.readline().split()[1:]]
    counters["iowait"] = cpu[4]
    counters["cpu_total"] = sum(cpu)
    return counters


def start_io_stats(path, interval=1.0):
    # Sample block reads, major page faults and iowait once per interval.
    # The counters are host-wide, which is what we want: the stall is
    # suspected to come from a cold disk on the worker, not from the container.
    # Busy samples are also printed, so that they line up with the test log.
    def sample():
        prev = read_io_counters()
        with open(path, "w") as f:
            f.write("utc_time\tread_kib\tmajfault\tiowait_pct\n")
            while True:
                time.sleep(interval)
                cur = read_io_counters()
                read_kib = cur["pgpgin"] - prev["pgpgin"]
                majfault = cur["pgmajfault"] - prev["pgmajfault"]
                cpu_delta = cur["cpu_total"] - prev["cpu_total"]
                iowait_pct = (100.0 * (cur["iowait"] - prev["iowait"]) / cpu_delta
                              if cpu_delta else 0.0)
                line = "%s\t%d\t%d\t%.1f" % (time.strftime("%H:%M:%S", time.gmtime()),
                                             read_kib, majfault, iowait_pct)
                f.write(line + "\n")
                f.flush()
                if read_kib >= 1024 or majfault >= 100:
                    print("IO-STATS: %s" % line, flush=True)
                prev = cur

    print("INFO: cold-start: recording I/O statistics to %s" % path)
    threading.Thread(target=sample, daemon=True).start()


def chrome_libraries(channel):
    install_dir = {"experimental": "chrome-unstable",
                   "dev": "chrome-unstable",
                   "beta": "chrome-beta",
                   "stable": "chrome"}.get(channel)
    if install_dir is None:
        # Canary is Chrome for Testing, which is only installed by wpt run.
        return []
    output = run(["ldd", os.path.join("/opt/google", install_dir, "chrome")],
                 return_stdout=True)
    libraries = []
    for line in output.splitlines():
        if "=>" in line:
            path = line.split("=>")[1].split("(")[0].strip()
            if path.startswith("/"):
                libraries.append(path)
    return libraries


def files_under(paths):
    for path in paths:
        if os.path.isfile(path) and not os.path.islink(path):
            yield path
        for dir_path, _, file_names in os.walk(path):
            for name in file_names:
                file_path = os.path.join(dir_path, name)
                if os.path.isfile(file_path) and not os.path.islink(file_path):
                    yield file_path


def preread(label, paths, max_bytes=None):
    # Read the files (or their first max_bytes) so that they end up in the page
    # cache, and report the throughput.  A low throughput means a cold disk.
    start_time = time.monotonic()
    count = 0
    total = 0
    for path in paths:
        try:
            with open(path, "rb") as f:
                remaining = max_bytes
                while remaining is None or remaining > 0:
                    chunk = f.read(1 << 20 if remaining is None else min(1 << 20, remaining))
                    if not chunk:
                        break
                    total += len(chunk)
                    if remaining is not None:
                        remaining -= len(chunk)
            count += 1
        except OSError:
            pass
    elapsed = time.monotonic() - start_time
    mib = total / (1 << 20)
    print("INFO: cold-start: pre-read %s: %d files, %.1f MiB in %.1fs (%.1f MiB/s)" %
          (label, count, mib, elapsed, mib / elapsed if elapsed else 0.0), flush=True)


def page_cache_snapshot(roots, min_size=1 << 20):
    # Map each regular file of at least min_size bytes to (resident bytes, mtime).
    start_time = time.monotonic()
    stats = {}
    for root_dir in roots:
        for dir_path, _, file_names in os.walk(root_dir):
            for name in file_names:
                path = os.path.join(dir_path, name)
                try:
                    st = os.lstat(path)
                except OSError:
                    continue
                if stat.S_ISREG(st.st_mode) and st.st_size >= min_size:
                    stats[path] = st.st_mtime
    snapshot = {}
    paths = list(stats)
    for i in range(0, len(paths), 200):
        output = subprocess.run(["fincore", "--bytes", "--noheadings", "--raw",
                                 "--output", "RES,FILE"] + paths[i:i + 200],
                                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                encoding="utf-8").stdout
        for line in output.splitlines():
            resident, path = line.split(" ", 1)
            if path in stats:
                snapshot[path] = (int(resident), stats[path])
    print("INFO: cold-start: page cache snapshot of %d files (>= %d KiB) in %.1fs" %
          (len(snapshot), min_size >> 10, time.monotonic() - start_time), flush=True)
    return snapshot


# Directories that may hold files read by the browser; see report_page_cache_growth().
PAGE_CACHE_ROOTS = ["/usr", "/opt", "/etc", "/var", "/tmp", os.path.expanduser("~")]
page_cache_before = None


def report_page_cache_growth(top=40):
    # Report the files that entered the page cache while the job ran.  With
    # the pre-read done, these are the files the browser had to read from disk.
    # Files created or modified during the job are marked, because their pages
    # are cached by writing, not by reading.
    if page_cache_before is None:
        return
    after = page_cache_snapshot(PAGE_CACHE_ROOTS)
    growth = []
    for path, (resident, mtime) in after.items():
        before_resident, before_mtime = page_cache_before.get(path, (0, None))
        if resident > before_resident:
            written = before_mtime is None or mtime != before_mtime
            growth.append((resident - before_resident, path, written))
    growth.sort(reverse=True)

    total_read = sum(size for size, _, written in growth if not written)
    total_written = sum(size for size, _, written in growth if written)
    print("INFO: cold-start: page cache growth: %.1f MiB in files present before the job, "
          "%.1f MiB in files written during the job" %
          (total_read / (1 << 20), total_written / (1 << 20)))
    by_dir = {}
    for size, path, written in growth:
        if not written:
            key = "/".join(path.split("/")[:4])
            by_dir[key] = by_dir.get(key, 0) + size
    for key, size in sorted(by_dir.items(), key=lambda item: -item[1])[:15]:
        print("INFO: cold-start:   %8.1f MiB  %s/" % (size / (1 << 20), key))
    for size, path, written in growth[:top]:
        print("INFO: cold-start:   %8.1f MiB  %s%s" %
              (size / (1 << 20), path, "  (written during job)" if written else ""))

    with open(os.path.expanduser("~/artifacts/page-cache-growth.tsv"), "w") as f:
        f.write("growth_bytes\twritten_during_job\tpath\n")
        for size, path, written in growth:
            f.write("%d\t%d\t%s\n" % (size, written, path))
    sys.stdout.flush()


def debug_cold_start(channel):
    global page_cache_before

    artifacts_dir = os.path.expanduser("~/artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    start_io_stats(os.path.join(artifacts_dir, "io-stats.tsv"))
    if COLD_START_PREREAD:
        preread_startup_files(channel)
    page_cache_before = page_cache_snapshot(PAGE_CACHE_ROOTS)


def preread_startup_files(channel):
    lib_dir = "/usr/lib/x86_64-linux-gnu"
    preread("chrome-libs", chrome_libraries(channel))
    # Libraries that Chrome loads with dlopen(), and the data they read at startup.
    gui_libs = []
    for pattern in ["libgtk-*", "libgdk*", "libatk*", "libatspi*", "libpango*", "libcairo*",
                    "libharfbuzz*", "libepoxy*", "libX*", "libxcb*", "libxkb*", "libEGL*",
                    "libGL*", "libgbm*", "libdrm*", "libva*", "libdbus*", "libgio*",
                    "libglib*", "libgobject*", "libgmodule*", "libpulse*"]:
        gui_libs.extend(glob.glob(os.path.join(lib_dir, pattern)))
    preread("gui-libs", files_under(gui_libs + [
        os.path.join(lib_dir, "gtk-3.0"),
        os.path.join(lib_dir, "gdk-pixbuf-2.0"),
        os.path.join(lib_dir, "gio"),
        "/usr/share/X11",
        "/usr/share/glib-2.0",
        "/usr/share/icons",
        "/usr/share/mime",
        "/usr/lib/locale",
    ]))
    # The fontconfig caches, and the head of every font file, which is what a
    # fontconfig rescan reads if it decides the caches are stale.
    preread("fontconfig", files_under(["/etc/fonts", "/var/cache/fontconfig"]))
    preread("font-headers", files_under(["/usr/share/fonts"]), max_bytes=64 << 10)


def make_hosts_file():
    run(["sudo", "sh", "-c", "./wpt make-hosts-file >> /etc/hosts"])


def checkout_revision(rev):
    run(["git", "checkout", "--quiet", rev])


def install_certificates():
    run(["sudo", "cp", "tools/certs/cacert.pem",
         "/usr/local/share/ca-certificates/cacert.crt"])
    run(["sudo", "update-ca-certificates"])


def start_dbus():
    # Start system bus
    run(["sudo", "service", "dbus", "start"])
    # Start user bus and set env
    dbus_env = run(["dbus-launch"], return_stdout=True)
    for dbus_env_line in dbus_env.splitlines():
        dbus_env_name, dbus_env_value = dbus_env_line.split("=", 1)
        assert (dbus_env_name.startswith("DBUS_SESSION"))
        os.environ[dbus_env_name] = dbus_env_value
    assert ("DBUS_SESSION_BUS_ADDRESS" in os.environ)


def install_chrome(channel):
    if channel == "canary":
        # Chrome for Testing Canary is installed via --install-browser
        return
    if channel in ("experimental", "dev"):
        deb_archive = "google-chrome-unstable_current_amd64.deb"
    elif channel == "beta":
        deb_archive = "google-chrome-beta_current_amd64.deb"
    elif channel == "stable":
        deb_archive = "google-chrome-stable_current_amd64.deb"
    else:
        raise ValueError("Unrecognized release channel: %s" % channel)

    dest = os.path.join("/tmp", deb_archive)
    deb_url = "https://dl.google.com/linux/direct/%s" % deb_archive
    with open(dest, "wb") as f:
        get_download_to_descriptor(f, deb_url)

    run(["sudo", "apt-get", "-qqy", "update"])
    run(["sudo", "gdebi", "-qn", "/tmp/%s" % deb_archive])


def start_xvfb():
    start(["sudo", "Xvfb", os.environ["DISPLAY"], "-screen", "0",
           "%sx%sx%s" % (os.environ["SCREEN_WIDTH"],
                         os.environ["SCREEN_HEIGHT"],
                         os.environ["SCREEN_DEPTH"])])
    start(["sudo", "fluxbox", "-display", os.environ["DISPLAY"]])


def set_variables(event):
    # Set some variables that we use to get the commits on the current branch
    ref_prefix = "refs/heads/"
    pull_request = "false"
    branch = None
    if "pull_request" in event:
        pull_request = str(event["pull_request"]["number"])
        # Note that this is the branch that a PR will merge to,
        # not the branch name for the PR
        branch = event["pull_request"]["base"]["ref"]
    elif "ref" in event:
        branch = event["ref"]
        if branch.startswith(ref_prefix):
            branch = branch[len(ref_prefix):]

    os.environ["GITHUB_PULL_REQUEST"] = pull_request
    if branch:
        os.environ["GITHUB_BRANCH"] = branch


def task_url(task_id):
    root_url = os.environ['TASKCLUSTER_ROOT_URL']
    if root_url == 'https://taskcluster.net':
        queue_base = "https://queue.taskcluster.net/v1/task"
    else:
        queue_base = root_url + "/api/queue/v1/task"

    return "%s/%s" % (queue_base, task_id)


def download_artifacts(artifacts):
    artifact_list_by_task = {}
    for artifact in artifacts:
        base_url = task_url(artifact["task"])
        if artifact["task"] not in artifact_list_by_task:
            with tempfile.TemporaryFile() as f:
                get_download_to_descriptor(f, base_url + "/artifacts")
                f.seek(0)
                artifacts_data = json.load(f)
            artifact_list_by_task[artifact["task"]] = artifacts_data

        artifacts_data = artifact_list_by_task[artifact["task"]]
        print("DEBUG: Got artifacts %s" % artifacts_data)
        found = False
        for candidate in artifacts_data["artifacts"]:
            print("DEBUG: candidate: %s glob: %s" % (candidate["name"], artifact["glob"]))
            if fnmatch.fnmatch(candidate["name"], artifact["glob"]):
                found = True
                print("INFO: Fetching aritfact %s from task %s" % (candidate["name"], artifact["task"]))
                file_name = candidate["name"].rsplit("/", 1)[1]
                url = base_url + "/artifacts/" + candidate["name"]
                dest_path = os.path.expanduser(os.path.join("~", artifact["dest"], file_name))
                dest_dir = os.path.dirname(dest_path)
                if not os.path.exists(dest_dir):
                    os.makedirs(dest_dir)
                with open(dest_path, "wb") as f:
                    get_download_to_descriptor(f, url)

                if artifact.get("extract"):
                    unpack(dest_path)
        if not found:
            print("WARNING: No artifact found matching %s in task %s" % (artifact["glob"], artifact["task"]))


def unpack(path):
    dest = os.path.dirname(path)
    if tarfile.is_tarfile(path):
        run(["tar", "-xf", path], cwd=os.path.dirname(path))
    elif zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            archive.extractall(dest)
    else:
        print("ERROR: Don't know how to extract %s" % path)
        raise Exception


def setup_environment(**kwargs):
    if "TASK_ARTIFACTS" in os.environ:
        artifacts = json.loads(os.environ["TASK_ARTIFACTS"])
        download_artifacts(artifacts)

    if kwargs["hosts_file"]:
        make_hosts_file()

    if kwargs["install_certificates"]:
        install_certificates()

    if "chrome" in kwargs["browser"]:
        assert kwargs["channel"] is not None
        install_chrome(kwargs["channel"])

    # These browsers use dbus for various features.
    if {"chrome", "firefox", "webkitgtk_minibrowser", "wpewebkit_minibrowser"}.intersection(
            kwargs["browser"]):
        start_dbus()

    if kwargs["xvfb"]:
        start_xvfb()

    if kwargs["oom_killer"]:
        log_only = "firefox_android" in kwargs["browser"]
        start_userspace_oom_killer(log_only)

    if "chrome" in kwargs["browser"]:
        debug_cold_start(kwargs["channel"])


def setup_repository(**kwargs):
    is_pr = os.environ.get("GITHUB_PULL_REQUEST", "false") != "false"

    # Initially task_head points at the same commit as the ref we want to test.
    # However that may not be the same commit as we actually want to test if
    # the branch changed since the decision task ran. The branch may have
    # changed because someone has pushed more commits (either to the PR
    # or later commits to the branch), or because someone has pushed to the
    # base branch for the PR.
    #
    # In that case we take a different approach depending on whether this is a
    # PR or a push to a branch.
    # If this is a push to a branch, and the original commit is still fetchable,
    # we try to fetch that (it may not be in the case of e.g. a force push).
    # If it's not fetchable then we fail the run.
    # For a PR we are testing the provisional merge commit. If that's changed it
    # could be that the PR branch was updated or the base branch was updated. In the
    # former case we fail the run because testing an old commit is a waste of
    # resources. In the latter case we assume it's OK to use the current merge
    # instead of the one at the time the decision task ran.

    if kwargs["ref"]:
        if is_pr:
            assert kwargs["ref"].endswith("/merge")
            expected_head = kwargs["merge_rev"]
        else:
            expected_head = kwargs["head_rev"]

        task_head = run(["git", "rev-parse", "task_head"], return_stdout=True).strip()

        if task_head != expected_head:
            if not is_pr:
                try:
                    run(["git", "fetch", "origin", expected_head])
                    run(["git", "reset", "--hard", expected_head])
                except subprocess.CalledProcessError:
                    print("CRITICAL: task_head points at %s, expected %s and "
                          "unable to fetch expected commit.\n"
                          "This may be because the branch was updated" % (task_head, expected_head))
                    sys.exit(1)
            else:
                # Convert the refs/pulls/<id>/merge to refs/pulls/<id>/head
                head_ref = kwargs["ref"].rsplit("/", 1)[0] + "/head"
                try:
                    remote_head = run(["git", "ls-remote", "origin", head_ref],
                                      return_stdout=True).split("\t")[0]
                except subprocess.CalledProcessError:
                    print("CRITICAL: Failed to read remote ref %s" % head_ref)
                    sys.exit(1)
                if remote_head != kwargs["head_rev"]:
                    print("CRITICAL: task_head points at %s, expected %s. "
                          "This may be because the branch was updated" % (task_head, expected_head))
                    sys.exit(1)
                print("INFO: Merge commit changed from %s to %s due to base branch changes. "
                      "Running task anyway." % (expected_head, task_head))

    if os.environ.get("GITHUB_PULL_REQUEST", "false") != "false":
        parents = run(["git", "rev-parse", "task_head^@"],
                      return_stdout=True).strip().split()
        if len(parents) == 2:
            base_head = parents[0]
            pr_head = parents[1]

            run(["git", "branch", "base_head", base_head])
            run(["git", "branch", "pr_head", pr_head])
        else:
            print("ERROR: Pull request HEAD wasn't a 2-parent merge commit; "
                  "expected to test the merge of PR into the base")
            commit = run(["git", "rev-parse", "task_head"],
                         return_stdout=True).strip()
            print("HEAD: %s" % commit)
            print("Parents: %s" % ", ".join(parents))
            sys.exit(1)

    branch = os.environ.get("GITHUB_BRANCH")
    if branch:
        # Ensure that the remote base branch exists
        # TODO: move this somewhere earlier in the task
        run(["git", "fetch", "--quiet", "origin", "%s:%s" % (branch, branch)])

    checkout_rev = kwargs["checkout"] if kwargs["checkout"] is not None else "task_head"
    checkout_revision(checkout_rev)

    refs = run(["git", "for-each-ref", "refs/heads"], return_stdout=True)
    print("INFO: git refs:\n%s" % refs)
    print("INFO: checked out commit:\n%s" % run(["git", "rev-parse", "HEAD"],
                                                return_stdout=True))


def fetch_event_data():
    try:
        task_id = os.environ["TASK_ID"]
    except KeyError:
        print("WARNING: Missing TASK_ID environment variable")
        # For example under local testing
        return None

    with tempfile.TemporaryFile() as f:
        get_download_to_descriptor(f, task_url(task_id))
        f.seek(0)
        task_data = json.load(f)
    event_data = task_data.get("extra", {}).get("github_event")
    if event_data is not None:
        return json.loads(event_data)


def include_job(job):
    # Only for supporting pre decision-task PRs
    # Special case things that unconditionally run on pushes,
    # assuming a higher layer is filtering the required list of branches
    if "GITHUB_PULL_REQUEST" not in os.environ:
        return True

    if (os.environ["GITHUB_PULL_REQUEST"] == "false" and
        job == "run-all"):
        return True

    jobs_str = run([os.path.join(root, "wpt"),
                    "test-jobs"], return_stdout=True)
    print(jobs_str)
    return job in set(jobs_str.splitlines())


def run_tc(*args, **kwargs):
    try:
        is_ci = "TASKCLUSTER_ROOT_URL" in os.environ

        if "TASK_EVENT" in os.environ:
            event = json.loads(os.environ["TASK_EVENT"])
        elif is_ci:
            event = fetch_event_data()
        else:
            event = None

        if event:
            set_variables(event)

        if kwargs["setup_repository"] or (kwargs["setup_repository"] is None and is_ci):
            setup_repository(**kwargs)

        # Hack for backwards compatibility
        if kwargs["script"] in ["run-all", "lint", "update_built", "tools_unittest",
                                "wpt_integration", "resources_unittest",
                                "wptrunner_infrastructure", "stability", "affected_tests"]:
            job = kwargs["script"]
            if not include_job(job):
                return
            kwargs["script"] = kwargs["script_args"][0]
            kwargs["script_args"] = kwargs["script_args"][1:]

        # Run the job
        setup_environment(**kwargs)
        os.chdir(root)
        cmd = [kwargs["script"]] + kwargs["script_args"]
        print(" ".join(cmd))
        returncode = subprocess.call(cmd)
        report_page_cache_growth()
        sys.exit(returncode)
    finally:
        for process in started_processes:
            process.terminate()
            try:
                process.wait(30)
            except subprocess.TimeoutExpired:
                process.kill()


def main():
    args = get_parser().parse_args()
    run_tc(**vars(args))


if __name__ == "__main__":
    main()  # type: ignore
