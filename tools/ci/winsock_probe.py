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
  H5  The fault is thread-scoped, not socket-scoped: mswsock's synchronous path
      issues an AFD IOCTL and waits on a per-thread event, so if that primitive
      is corrupted, select() can return early with an unfilled fd_set (giving a
      phantom readable) *and* the following recv can surface raw STATUS_PENDING
      as Win32 997 rather than a WSA 10xxx code -- one mechanism for both
      anomalies.
        predicts: a brand-new, unrelated pair created on the same thread fails
        identically.  H1-H4 all predict it does not.
        This one decides whether the planned fix can work: if the fault is the
        thread, no amount of socket avoidance addresses the cause.

Base rate (measured over 30 days of epochs/three_hourly and epochs/daily):
20 occurrences in 3,400 Windows full-run jobs, ~12 daemons each, i.e. roughly
**5e-4 per daemon start**.  That number governs every hunt here: 2,000 cold
starts per expected hit, ~6,000 for 95% confidence of at least one, 20,000+
before two arms can be compared.  Run 1 of --mode wpt had *nine* cold starts and
reported "zero anomalies"; that had a 99.6% chance of happening regardless.
Never quote a clean result without its trial count.

Design notes
------------
H2 and H3 are *deterministic* -- `--mode probes` settles them in seconds and
needs no reproduction.  Only H1 (and H5) are stochastic.

`--mode burst` is the throughput arm and the one to run when hunting: one
lifecycle per spawned process, whole batches respawned, K socketpairs per child,
no http.server and no client traffic.  It exists because --mode wpt's trials are
mostly not cold starts, and cold starts are the population that fails.

`--mode wpt` is the fidelity arm: wptserve's serve_forever verbatim, on a real
ThreadingHTTPServer, with client traffic.  Its per-process trial cost is high, so
use it to check that burst mode has not abstracted away the thing that matters --
not as the hunt.  Pass --restart-every 0 for one lifecycle per process.

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
    py -3 winsock_probe.py --mode burst --duration 120       # calibrate
    py -3 winsock_probe.py --mode burst --duration 9000      # the hunt
    py -3 winsock_probe.py --mode burst --duration 9000 --poll-interval 0.01
    py -3 winsock_probe.py --mode wpt --duration 300 --restart-every 0
    py -3 winsock_probe.py --mode sweep --cell-seconds 120 --linger-reset
    py -3 winsock_probe.py --summarise findings.jsonl [more.jsonl ...]

Arms worth running against each other, given enough trials in each: the default
--poll-interval 0.5 versus 0.01 (does the anomaly have a per-select()-call
probability or a per-socketpair-lifetime one?  Nobody knows, and the comparison
is informative whichever way it falls), and --churn-thread on versus off.
--strict-handle-check is not an arm but a free extra: it fires at a rate not
bounded by this bug's own.

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
import tempfile
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

# ioctlsocket(FIONREAD) -- how many bytes are actually readable.  Zero bytes
# alongside a select() that says readable is the phantom-readability signature.
FIONREAD_WIN = 0x4004667F

# PROCESS_MITIGATION_POLICY.ProcessStrictHandleCheckPolicy, and the two bits of
# PROCESS_MITIGATION_STRICT_HANDLE_CHECK_POLICY
# (RaiseExceptionOnInvalidHandleReference | HandleExceptionsPermanentlyEnabled).
PROCESS_STRICT_HANDLE_CHECK_POLICY = 3
STRICT_HANDLE_CHECK_BITS = 0x3

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
    _ws2.ioctlsocket.argtypes = [SOCKET, ctypes.c_long,
                                 ctypes.POINTER(ctypes.c_ulong)]
    _ws2.ioctlsocket.restype = ctypes.c_int

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

    _k32e.SetProcessMitigationPolicy.argtypes = [
        ctypes.c_int, ctypes.c_void_p, ctypes.c_size_t,
    ]
    _k32e.SetProcessMitigationPolicy.restype = wt.BOOL

    def wsa_last_error() -> int:
        """The thread's last-error value, read with no intervening call."""
        return _ws2.WSAGetLastError()

    def bytes_readable(fd: int) -> dict:
        """ioctlsocket(FIONREAD): how much there is actually to read.

        socket.ioctl() cannot ask this on Windows (it only accepts SIO_RCVALL,
        SIO_KEEPALIVE_VALS and SIO_LOOPBACK_FAST_PATH), hence the raw call.
        """
        n = ctypes.c_ulong(0)
        rc = _ws2.ioctlsocket(SOCKET(fd), FIONREAD_WIN, ctypes.byref(n))
        if rc != 0:
            return {"error": wsa_last_error()}
        return {"bytes": n.value}

    def enable_strict_handle_check() -> str:
        """Make an invalid-handle reference raise at the *culprit*.

        Every socket-scoped hypothesis for this bug that involves handle
        recycling (H4) requires a use-after-close somewhere in the process.
        The victim event -- that recycled handle happening to land on the
        shutdown pair -- is by construction far rarer than the culprit event,
        so this fires at a rate that is *not* bounded by the bug's own base
        rate.  That makes it the one probe worth running even when the hunt
        comes up empty.

        Caveat, stated plainly: STATUS_INVALID_HANDLE (0xC0000008) is a hard
        SEH exception the kernel raises, not something Python can catch, and
        faulthandler does not install a handler for it.  So a hit shows up as
        a child exit code of 0xC0000008 with no traceback -- it proves a bad
        handle operation happened in that process, and localises nothing
        further without a crash dump.
        """
        policy = ctypes.c_ulong(STRICT_HANDLE_CHECK_BITS)
        ok = _k32e.SetProcessMitigationPolicy(
            PROCESS_STRICT_HANDLE_CHECK_POLICY, ctypes.byref(policy),
            ctypes.sizeof(policy))
        if not ok:
            return f"failed:{ctypes.get_last_error()}"
        return "enabled"

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

    def bytes_readable(fd: int) -> dict:
        try:
            import fcntl
            import termios
            buf = fcntl.ioctl(fd, termios.FIONREAD, struct.pack("i", 0))
            return {"bytes": struct.unpack("i", buf)[0]}
        except Exception as exc:  # noqa: BLE001
            return {"error": repr(exc)}

    def enable_strict_handle_check() -> str:
        return "skipped:not-windows"

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
    """Describe one occurrence well enough that a single hit is sufficient.

    MUST be called on the thread that saw the anomaly: `fresh_pair_same_thread`
    below is only meaningful there.
    """
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
    ev["so_error"] = _safe(
        lambda: sock.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR))
    # 0 bytes readable alongside a select() that said readable is the phantom
    # signature, and distinguishes it from "there was a byte and recv failed".
    ev["fionread"] = _safe(lambda: bytes_readable(sock.fileno()))
    ev["reselect_readable"] = _safe(
        lambda: bool(select.select([sock], [], [], 0)[0]))
    # The socket under test is blocking and may have nothing to read (the
    # spurious-readable arm is exactly that case), so a blocking retry would
    # wedge the run on the first hit.  Force non-blocking: this is post-mortem
    # on a socket that is about to be discarded, so it cannot contaminate the
    # measurement.
    ev["retry_recv"] = _safe(lambda: _nonblocking_retry(sock))
    ev["raw_recv"] = _safe(lambda: raw_recv(sock.fileno()))
    # H5: socket-scoped or thread-scoped?  Everything above describes this
    # socket; this asks whether the *thread* is the broken thing.
    ev["fresh_pair_same_thread"] = _safe(_fresh_pair_same_thread)
    ev["iocp"] = _safe(lambda: iocp_association_state(sock.fileno()))
    if extra:
        ev.update(extra)
    return ev


def _fresh_pair_same_thread() -> dict:
    """H5: does a brand-new, unrelated pair fail on this same thread too?

    H1-H4 are all *socket*-scoped: each predicts that a fresh pair on the
    failing thread behaves normally.  H5 -- that the thread's synchronous-call
    primitive (mswsock issues an AFD IOCTL and waits on a per-thread event) has
    been corrupted -- predicts it fails identically, and would explain both
    anomalies at once: select() returning early with an unfilled fd_set (the
    phantom readable) *and* the following recv surfacing raw STATUS_PENDING as
    Win32 997 rather than a WSA 10xxx code.

    This distinction decides whether this plan's fix can work at all: if the
    fault is thread-scoped, no amount of socket avoidance -- AF_UNIX pair,
    polling, anything -- addresses the cause.

    Deliberately never calls settimeout(): that would take CPython's
    internal_select()/retry path in sock_call_ex() instead of the plain
    blocking path the bug lives on.  select() first, then a blocking recv only
    once there is provably something to read, is safe without changing paths.
    """
    a, b = MAKE_PAIR()
    try:
        b.sendall(b"z")
        if not select.select([a], [], [], 2.0)[0]:
            return {"ok": False, "never_readable": True}
        return {"ok": True, "recv_len": len(a.recv(1)),
                "slot": wsa_last_error()}
    except OSError as exc:
        return {"ok": False, "winerror": getattr(exc, "winerror", None),
                "errno": exc.errno, "slot": wsa_last_error(),
                "verdict": "THREAD-SCOPED: a fresh unrelated pair fails too"}
    finally:
        for s in (a, b):
            if s.fileno() != -1:
                s.close()


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

    # restart_every <= 0 means exactly one lifecycle in this process: restarting
    # the *socket* inside an already-warm process is not a cold start, and the
    # bug lives in a daemon's first second of life.  hunt_wpt then respawns
    # whole generations instead, so the run still fills its duration.
    single = restart_every <= 0
    deadline = time.monotonic() + duration
    restarts = 0
    while single or (time.monotonic() < deadline and not stop_flag.is_set()):
        try:
            httpd = Server(("127.0.0.1", 0), Handler)
        except OSError as exc:
            sink({"kind": "bind-failed", "exc": repr(exc)})
            if single:
                break
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
        if restart_every <= 0:
            # One lifecycle per process.  Restarting the *socket* inside an
            # already-warm process is not a cold start, and the bug lives in a
            # daemon's first second of life -- see --mode burst, which is the
            # throughput version of this.
            break

    sink({"kind": "worker-done", "restarts": restarts})
    log_queue.put(None)


def _wpt_generation(ctx, sink, counts, workers, duration, poll_interval,
                    restart_every, force_fallback, idle_first) -> list:
    """One cohort of spawned daemon children, drained to completion."""
    import queue as queue_mod

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

    live = workers
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
        raise
    finally:
        for p in procs:
            p.join(timeout=60)
    return [p.exitcode for p in procs]


def hunt_wpt(sink, duration: float, workers: int, poll_interval: float,
             restart_every: float, force_fallback: bool = False,
             idle_first: float = 2.0) -> dict:
    """The fidelity arm: wptserve's serve_forever verbatim on a real server.

    With --restart-every 0 each child runs one lifecycle and exits, and whole
    generations are respawned until the duration is used up -- so every trial is
    a cold start rather than one cold start plus many warm reruns.  With
    --restart-every > 0 this keeps the original single-generation behaviour,
    which is useful for the idle-window question but is not a cold-start hunt.
    """
    import multiprocessing

    ctx = multiprocessing.get_context("spawn")
    counts: collections.Counter = collections.Counter()
    started = time.monotonic()
    deadline = started + duration
    exitcodes: list = []
    generations = 0

    try:
        while True:
            generations += 1
            exitcodes = _wpt_generation(
                ctx, sink, counts, workers,
                # A per-generation duration is meaningless when each child does
                # exactly one lifecycle; only the outer deadline matters.
                0.0 if restart_every <= 0 else duration,
                poll_interval, restart_every, force_fallback, idle_first)
            if restart_every > 0 or time.monotonic() >= deadline:
                break
            # Same guard as burst mode: generations that create no pairs mean
            # the children are not working, and spinning on that for the whole
            # duration would report a clean run built on nothing.
            if generations >= 3 and counts["pair-created"] == 0:
                print("ABORTING: 3 generations produced no server lifetimes; "
                      "the children are not running (check for bind-failed).")
                sink({"kind": "wpt-aborted", "reason": "no-trials",
                      "generations": generations, "counts": dict(counts)})
                break
            if generations % 25 == 0:
                elapsed = time.monotonic() - started
                pairs = counts["pair-created"]
                print(f"  generation {generations}: {pairs} cold-start "
                      f"lifetimes, {counts['anomaly']} anomalies, "
                      f"{pairs / elapsed * 60:.0f}/min")
                sink({"kind": "wpt-progress", "generations": generations,
                      "cold_start_trials": pairs,
                      "anomalies": counts["anomaly"],
                      "elapsed_s": round(elapsed, 1)})
    except KeyboardInterrupt:
        print("interrupted")

    elapsed = max(time.monotonic() - started, 1e-9)
    return {"records": dict(counts), "exitcodes": exitcodes,
            "generations": generations,
            "cold_start_trials": counts["pair-created"],
            "anomalies": counts["anomaly"],
            "elapsed_s": round(elapsed, 1),
            "trials_per_min": round(counts["pair-created"] / elapsed * 60, 1)}


# ---------------------------------------------------------------------------
# Phase B3: the burst.  The throughput arm.
#
# Run 1 of --mode wpt produced 387 `pair-created` records and read that as 387
# trials.  It was not: _child_main restarts the *socket* inside an already-warm
# process, so only the first iteration per worker was a cold start, and the
# other 386 recvs happened seconds later after a *real* poke.  Nine cold starts,
# against a measured base rate of ~5e-4 per daemon start, had a 99.6% chance of
# coming up clean regardless -- it could not have said anything.
#
# So this mode optimises for cold-start trials per second:
#   * one lifecycle per process, whole batches respawned (no warm reruns)
#   * no http.server and no client traffic -- the failure lands before the
#     daemon has served a single request, so the hammering phase was dead
#     weight, and `import http.server` was a large part of the spawn cost.  A
#     bare socket()+bind()+listen() in the selector is cheaper *and* more
#     faithful to the failing moment.
#   * K pairs per process rather than 1: if the mechanism is per-process or
#     per-thread and merely has to *land* on a socketpair, K targets multiply
#     the hit rate by up to K for almost no cost.
#   * a hang counts as a hit (see _blocking_recv_on_thread).
#
# Target, at 5e-4 per cold start: 2,000 trials per expected hit, ~6,000 for 95%
# confidence of at least one, 20,000+ before two arms can be compared.  Any
# clean result has to be quoted against its trial count or it repeats run 1's
# mistake.
# ---------------------------------------------------------------------------

def churn_handles(n_files: int, n_sockets: int) -> dict:
    """Approximate the handle churn a real daemon child does before its pair.

    A wptserve daemon child imports wptserve, ssl and h2, builds the route
    table and (for https) loads a cert chain -- hundreds of file opens and
    closes -- all *before* serve_forever creates the shutdown pair.  This
    harness's child imports almost nothing, so if H4 (handle-slot reuse) is
    live, run 1 was missing the mechanism rather than missing the bug.
    """
    stats: collections.Counter = collections.Counter()
    for _ in range(n_files):
        try:
            with tempfile.TemporaryFile() as fh:
                fh.write(b"x")
        except OSError:
            stats["file_failed"] += 1
        else:
            stats["files"] += 1
    for _ in range(n_sockets):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.close()
            r, w = os.pipe()
            os.close(r)
            os.close(w)
        except OSError:
            stats["socket_failed"] += 1
        else:
            stats["sockets"] += 1
    return dict(stats)


class BackgroundChurn:
    """Recycle handles on another thread *while* the serve thread selects.

    Handle-slot reuse needs a close concurrent with the window under test, not
    only before it.
    """

    def __init__(self, enabled: bool):
        self.enabled = enabled
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self.rounds = 0

    def __enter__(self):
        if self.enabled:
            self._thread = threading.Thread(target=self._run, name="churn",
                                            daemon=True)
            self._thread.start()
        return self

    def __exit__(self, *exc):
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=5)
        return False

    def _run(self):
        while not self._stop.is_set():
            try:
                with tempfile.TemporaryFile() as fh:
                    fh.write(b"x")
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.close()
            except OSError:
                pass
            self.rounds += 1
            time.sleep(0.001)


def _blocking_recv_on_thread(rsock, wsock, created_at, sink, extra) -> None:
    """Issue wptserve's exact call -- a *blocking* recv(1) -- unwedgeably.

    The read end is blocking in wptserve, so a readable socket with nothing to
    read makes recv block forever rather than raise: serve_forever parks, and in
    production that is *quieter* than the crash we are chasing.  Run 1 would
    have scored such a child as merely slow.  Here it is its own anomaly class.

    The recv runs on a throwaway daemon thread so it cannot hold up the trial,
    and collect_evidence is called from inside that thread on purpose --
    fresh_pair_same_thread only discriminates H5 if it runs on the thread that
    failed.
    """
    result: dict = {}

    def reader():
        try:
            result["len"] = len(rsock.recv(1))
        except OSError as exc:
            result["evidence"] = collect_evidence(
                rsock, wsock, created_at, exc, "burst/spurious-readable-recv",
                extra)

    thread = threading.Thread(target=reader, name="burst-recv", daemon=True)
    thread.start()
    thread.join(timeout=5.0)
    if thread.is_alive():
        sink({"kind": "anomaly", "context": "burst/readable-but-recv-blocked",
              "ts": time.time(), "pid": os.getpid(), "winerror": None,
              "age_s": time.monotonic() - created_at,
              "fionread": _safe(lambda: bytes_readable(rsock.fileno())),
              "fileno": _safe(rsock.fileno), **extra})
    elif "evidence" in result:
        sink(result["evidence"])
    else:
        # A byte means somebody poked a pair nobody has a handle to; zero bytes
        # means the write end is already gone, which in wptserve would be a
        # different bug in the same place.  Do not conflate them.
        sink({"kind": "anomaly",
              "context": ("burst/readable-with-data" if result.get("len")
                          else "burst/readable-peer-gone"),
              "ts": time.time(), "pid": os.getpid(), "winerror": None,
              "len": result.get("len"),
              "age_s": time.monotonic() - created_at,
              "fileno": _safe(rsock.fileno), **extra})


def _inspect_readable_listener(listener, created_at, sink, extra) -> None:
    """The same select() anomaly on a different socket, for two lines.

    Nothing ever connects to this listener, so any readability is anomalous --
    and whether accept() then yields a connection or BlockingIOError separates
    "a stray connection arrived" from "select() lied".
    """
    try:
        listener.setblocking(False)
        conn, addr = listener.accept()
    except BlockingIOError:
        sink({"kind": "anomaly", "context": "burst/listener-readable-no-conn",
              "ts": time.time(), "pid": os.getpid(), "winerror": None,
              "fileno": _safe(listener.fileno), **extra})
        return
    except OSError as exc:
        sink(collect_evidence(listener, None, created_at, exc,
                              "burst/listener-accept-failed", extra))
        return
    conn.close()
    sink({"kind": "anomaly", "context": "burst/listener-unsolicited-conn",
          "ts": time.time(), "pid": os.getpid(), "winerror": None,
          "peer": str(addr), **extra})


def _burst_child_main(path: str, opts: dict) -> None:
    t0 = time.monotonic()
    out = open(path, "w", encoding="utf-8")

    def sink(record):
        record.setdefault("pid", os.getpid())
        record.setdefault("trial", opts["trial"])
        out.write(json.dumps(record, default=str) + "\n")
        if record.get("kind") == "anomaly":
            out.flush()

    try:
        strict = (enable_strict_handle_check() if opts["strict_handle_check"]
                  else "off")
        if opts["force_fallback"]:
            use_fallback_socketpair()
        churn = churn_handles(opts["churn_files"], opts["churn_sockets"])

        listener = None
        try:
            listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            # wptserve sets allow_reuse_address and request_queue_size = 2000.
            listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            listener.bind(("127.0.0.1", 0))
            listener.listen(2000)
        except OSError as exc:
            sink({"kind": "listen-failed", "code": sock_error_code(exc)})
            if listener is not None:
                listener.close()
            listener = None

        pairs, offsets = [], []
        for i in range(opts["pairs"]):
            try:
                rsock, wsock = MAKE_PAIR()
            except OSError as exc:
                sink({"kind": "pair-create-failed", "index": i,
                      "code": sock_error_code(exc)})
                break
            pairs.append([rsock, wsock, time.monotonic(), False])
            offsets.append(round(time.monotonic() - t0, 4))

        select_calls = 0
        first_select = None
        with BackgroundChurn(opts["churn_thread"]) as background:
            with selectors.DefaultSelector() as sel:
                if listener is not None:
                    sel.register(listener, selectors.EVENT_READ,
                                 ("listener", -1))
                for i, entry in enumerate(pairs):
                    sel.register(entry[0], selectors.EVENT_READ, ("pair", i))

                idle_until = t0 + opts["idle"]
                while time.monotonic() < idle_until:
                    events = sel.select(timeout=opts["poll_interval"])
                    select_calls += 1
                    if first_select is None:
                        # Run 1 only ever recorded a *second* select's answer.
                        first_select = [key.data for key, _ in events]
                    for key, _mask in events:
                        what, idx = key.data
                        extra = {"pair_index": idx, "pairs": len(pairs),
                                 "select_calls": select_calls,
                                 "first_select_events": first_select,
                                 "age_from_process_start_s":
                                     round(time.monotonic() - t0, 4),
                                 "strict_handle_check": strict,
                                 "churn": churn,
                                 "churn_rounds": background.rounds}
                        # Stop selecting on it either way: a sticky readable
                        # would otherwise spin for the rest of the trial.
                        sel.unregister(key.fileobj)
                        if what == "listener":
                            _inspect_readable_listener(listener, t0, sink,
                                                       extra)
                        else:
                            entry = pairs[idx]
                            entry[3] = True  # recv in flight; do not close
                            _blocking_recv_on_thread(entry[0], entry[1],
                                                     entry[2], sink, extra)

        sink({"kind": "burst-trial", "pairs": len(pairs),
              "spawn_latency_s": round(time.time() - opts["spawned_at"], 3),
              "pair_offsets_s": offsets, "select_calls": select_calls,
              "first_select_events": first_select,
              "elapsed_s": round(time.monotonic() - t0, 3),
              "strict_handle_check": strict, "churn": churn,
              "churn_rounds": background.rounds})

        # RST-close rather than a graceful close: 16 pairs per trial at several
        # trials a second would otherwise put thousands of loopback sockets into
        # a two-minute TIME_WAIT and exhaust Windows' ~16k dynamic port range
        # mid-run, turning the hunt into WSAEADDRINUSE backoff.
        for rsock, wsock, _created, in_flight in pairs:
            if in_flight:
                continue  # a thread may still be blocked in recv on rsock
            _close_pair(rsock, wsock, True)
        if listener is not None:
            listener.close()
    finally:
        out.close()


def _drain_child(path: str, sink, keep_budget: list) -> collections.Counter:
    counts: collections.Counter = collections.Counter()
    try:
        with open(path, encoding="utf-8") as fh:
            lines = fh.readlines()
    except OSError:
        counts["child-no-file"] += 1
        return counts
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            record = json.loads(line)
        except ValueError:
            counts["child-bad-line"] += 1
            continue
        kind = record.get("kind")
        counts[kind or "?"] += 1
        if kind == "burst-trial":
            counts["cold_start_trials"] += record.get("pairs", 0)
            counts["children_completed"] += 1
            # Keep a sample so the offset distribution is inspectable without
            # writing a record per trial for the whole run.
            if keep_budget[0] > 0:
                keep_budget[0] -= 1
                sink(record)
        else:
            sink(record)
            if kind == "anomaly":
                print("ANOMALY:", json.dumps(record, default=str))
    try:
        os.remove(path)
    except OSError:
        pass
    return counts


def hunt_burst(sink, duration: float, batch: int, pairs: int, idle: float,
               poll_interval: float, grace: float, churn_files: int,
               churn_sockets: int, churn_thread: bool,
               strict_handle_check: bool, force_fallback: bool,
               findings_dir: str, keep_trials: int) -> dict:
    import multiprocessing

    ctx = multiprocessing.get_context("spawn")
    os.makedirs(findings_dir, exist_ok=True)
    started = time.monotonic()
    deadline = started + duration
    totals: collections.Counter = collections.Counter()
    keep_budget = [keep_trials]
    trial_no = 0
    batches = 0

    child_opts = {
        "pairs": pairs, "idle": idle, "poll_interval": poll_interval,
        "churn_files": churn_files, "churn_sockets": churn_sockets,
        "churn_thread": churn_thread,
        "strict_handle_check": strict_handle_check,
        "force_fallback": force_fallback,
    }

    try:
        while time.monotonic() < deadline:
            batches += 1
            batch_started = time.monotonic()
            procs = []
            # Back to back with no stagger, as TestEnvironment.__enter__ spawns
            # its ~12 daemons.
            for _ in range(batch):
                trial_no += 1
                path = os.path.join(findings_dir, f"t{trial_no}.jsonl")
                opts = dict(child_opts, trial=trial_no,
                            spawned_at=time.time())
                proc = ctx.Process(target=_burst_child_main,
                                   args=(path, opts))
                proc.start()
                procs.append((proc, path, trial_no))

            child_deadline = batch_started + idle + grace
            for proc, _path, n in procs:
                proc.join(timeout=max(0.0, child_deadline - time.monotonic()))
                if proc.is_alive():
                    # A hang is a hit.  Terminating is safe here only because
                    # children report through their own file rather than a
                    # shared mp.Queue -- terminate() on a Queue writer can
                    # leave the queue's lock held and deadlock every sibling.
                    totals["child_timeout"] += 1
                    sink({"kind": "anomaly", "context": "burst/child-timeout",
                          "trial": n, "pid": proc.pid, "ts": time.time(),
                          "winerror": None, "idle_s": idle, "grace_s": grace})
                    print(f"ANOMALY: child for trial {n} did not exit by "
                          f"deadline (idle={idle}s grace={grace}s)")
                    proc.terminate()
                    proc.join(timeout=10)
                    if proc.is_alive():
                        proc.kill()
                        proc.join(timeout=10)
                elif proc.exitcode != 0:
                    totals[f"child_exit:{proc.exitcode}"] += 1
                    sink({"kind": "anomaly", "context": "burst/child-exit",
                          "trial": n, "exitcode": proc.exitcode,
                          "winerror": None, "ts": time.time()})
            for _proc, path, _n in procs:
                totals.update(_drain_child(path, sink, keep_budget))

            elapsed = time.monotonic() - started
            trials = totals["cold_start_trials"]
            progress = {
                "kind": "burst-progress", "batches": batches,
                "children_spawned": trial_no,
                "children_completed": totals["children_completed"],
                "cold_start_trials": trials,
                "anomalies": totals["anomaly"],
                "elapsed_s": round(elapsed, 1),
                "trials_per_min": round(trials / elapsed * 60, 1) if elapsed
                else 0,
            }
            sink(progress)
            print(f"  batch {batches}: {trial_no} children, {trials} "
                  f"cold-start trials, {totals['anomaly']} anomalies, "
                  f"{progress['trials_per_min']}/min")
            # Do not burn 150 minutes looking busy.  If children cannot even
            # create pairs -- a broken interpreter, a sandbox, port exhaustion
            # -- say so now rather than reporting a clean run with no trials.
            if batches >= 3 and trials == 0:
                print("ABORTING: 3 batches produced no cold-start trials at "
                      "all; the children are not running. Check the findings "
                      "file for pair-create-failed / child-no-file.")
                sink({"kind": "burst-aborted", "reason": "no-trials",
                      "batches": batches, "counts": dict(totals)})
                break
    except KeyboardInterrupt:
        print("interrupted")

    elapsed = max(time.monotonic() - started, 1e-9)
    trials = totals["cold_start_trials"]
    result = {
        "children_spawned": trial_no,
        "children_completed": totals["children_completed"],
        "cold_start_trials": trials,
        "pairs_per_child": pairs,
        "anomalies": totals["anomaly"],
        "elapsed_s": round(elapsed, 1),
        "trials_per_min": round(trials / elapsed * 60, 1),
        "children_per_min": round(trial_no / elapsed * 60, 1),
        "counts": dict(totals),
    }
    sink({"kind": "burst-summary", "result": result})
    return result


# ---------------------------------------------------------------------------
# Verdict.
# ---------------------------------------------------------------------------

def _summarise_burst(records: list, anomalies: list) -> None:
    """Print the denominator at least as loudly as the numerator.

    Run 1's "zero anomalies" was read as a result when it was a coin that had
    been flipped nine times.  Nothing below is a verdict until the trial count
    is in the thousands, so the trial count goes first.
    """
    summaries = [r["result"] for r in records
                 if r.get("kind") == "burst-summary"]
    if not summaries:
        return
    trials = sum(s.get("cold_start_trials", 0) for s in summaries)
    children = sum(s.get("children_spawned", 0) for s in summaries)
    completed = sum(s.get("children_completed", 0) for s in summaries)
    elapsed = sum(s.get("elapsed_s", 0) for s in summaries)
    burst_anomalies = [a for a in anomalies
                       if str(a.get("context", "")).startswith("burst/")]

    print("=== burst (cold-start) population ===")
    print(f"  cold-start trials:   {trials}")
    print(f"  children spawned:    {children} ({completed} completed cleanly)")
    if elapsed:
        print(f"  rate:                {trials / elapsed * 60:.0f} trials/min, "
              f"{children / elapsed * 60:.0f} children/min "
              f"({elapsed / 60:.1f} min)")
        print(f"  projected per 150-minute job: "
              f"{trials / elapsed * 60 * 150:.0f} trials")
    print(f"  anomalies:           {len(burst_anomalies)}")
    for context, n in sorted(collections.Counter(
            a.get("context") for a in burst_anomalies).items()):
        print(f"      {context}: {n}")

    # At the measured production rate of ~5e-4 per daemon start.
    needed = {"1 expected hit": 2000, "95% conf of >=1 hit": 6000,
              "A/B two arms": 20000}
    if burst_anomalies:
        print(f"  => {len(burst_anomalies)}/{trials} = "
              f"{len(burst_anomalies) / max(trials, 1):.2g} per cold start "
              f"(production is ~5e-4)")
    else:
        verdict = [f"{label} needs {n}" for label, n in needed.items()
                   if trials < n]
        bound = f"95% upper bound {3 / trials:.2g} per cold start" if trials \
            else "no trials"
        print(f"  => 0 anomalies in {trials} cold-start trials: {bound}")
        if verdict:
            print(f"     NOT YET A RESULT: {'; '.join(verdict)}.")
        else:
            print("     Above 20,000 trials with production at ~5e-4, a clean "
                  "run is real evidence")
            print("     that the synthetic population is missing a condition "
                  "the real one has.")
    print()


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

    _summarise_burst(records, anomalies)

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

    # H5: socket-scoped or thread-scoped?  This is the one that decides whether
    # replacing the socketpair can fix anything at all.
    checked = [a for a in anomalies
               if isinstance(a.get("fresh_pair_same_thread"), dict)]
    thread_scoped = [a for a in checked
                     if a["fresh_pair_same_thread"].get("ok") is False]
    line("H5", bool(thread_scoped),
         f"fresh pair on the failing thread also failed: "
         f"{len(thread_scoped)}/{len(checked)} checked"
         + ("" if not thread_scoped else
            " -- the fault is NOT the socket, so avoiding the socketpair "
            "cannot fix it"))

    # Phantom readability: select() said readable and FIONREAD said 0 bytes.
    phantom = [a for a in anomalies
               if isinstance(a.get("fionread"), dict)
               and a["fionread"].get("bytes") == 0]
    blocked = [a for a in anomalies
               if a.get("context") == "burst/readable-but-recv-blocked"]
    would_block = [a for a in anomalies
                   if isinstance(a.get("retry_recv"), dict)
                   and a["retry_recv"].get("would_block")]
    print(f"\n     phantom readability (0 bytes per FIONREAD): "
          f"{len(phantom)}/{len(anomalies)}; recv would-block: "
          f"{len(would_block)}; recv blocked outright: {len(blocked)}")

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
                   choices=("probes", "sweep", "wpt", "burst", "all"))
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
                   help="seconds between server restarts in wpt mode; 0 means "
                        "one lifecycle per process (a restart inside a warm "
                        "process is not a cold start)")
    p.add_argument("--batch", type=int, default=24,
                   help="burst mode: children spawned back to back per batch. "
                        "At or above WPT's real ~12 daemons; more costs little "
                        "and adds contention")
    p.add_argument("--pairs-per-trial", type=int, default=16,
                   help="burst mode: socketpairs registered in each child's "
                        "one selector.  Each is an independent target, so this "
                        "multiplies the hit rate by up to K for free")
    p.add_argument("--idle", type=float, default=1.5,
                   help="burst mode: seconds each child selects before "
                        "exiting.  The real failure lands ~0.7s after the "
                        "daemon starts")
    p.add_argument("--grace", type=float, default=45.0,
                   help="burst mode: seconds beyond --idle before a child is "
                        "declared hung.  Must cover Windows spawn latency; a "
                        "child still alive after it is recorded as an anomaly, "
                        "because a blocking recv on a readable-but-empty "
                        "socket never returns")
    p.add_argument("--churn-files", type=int, default=200,
                   help="burst mode: files opened and closed before the pairs "
                        "are created, standing in for the cert/route/import "
                        "churn a real daemon child does")
    p.add_argument("--churn-sockets", type=int, default=32,
                   help="burst mode: sockets and pipes opened and closed "
                        "before the pairs are created")
    p.add_argument("--churn-thread", action="store_true",
                   help="burst mode: keep recycling handles on another thread "
                        "*during* the select window, not only before it")
    p.add_argument("--strict-handle-check", action="store_true",
                   help="burst mode: SetProcessMitigationPolicy("
                        "ProcessStrictHandleCheckPolicy), so an invalid-handle "
                        "reference raises at the culprit.  Fires at a rate not "
                        "bounded by this bug's base rate, since bad closes are "
                        "far commoner than one landing on the pair; shows up "
                        "as a child exit code of 0xC0000008, with no traceback")
    p.add_argument("--keep-trial-records", type=int, default=50,
                   help="burst mode: how many per-trial records to keep in the "
                        "findings file (the rest are counted, not stored)")
    p.add_argument("--findings-dir", default=None,
                   help="burst mode: scratch dir for per-child findings "
                        "(default: <out>.children).  Children report through "
                        "their own file rather than a shared mp.Queue so that "
                        "terminating a hung one cannot deadlock its siblings")
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
        status = use_fallback_socketpair()
        print(f"socketpair: {status}\n")
        if status.startswith("unavailable") and not IS_WINDOWS:
            # Continuing here would run the whole hunt on a native AF_UNIX pair
            # while the log said --force-fallback, i.e. report a clean negative
            # control for a code path that was never executed.  socket.py only
            # exposes _fallback_socketpair as a module-level name from 3.10 on.
            print("ERROR: --force-fallback asked for the loopback-TCP path and "
                  "this Python cannot provide it, so the run would silently "
                  "test AF_UNIX instead. Use Python 3.10+ or drop the flag.",
                  file=sys.stderr)
            return 2

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
        if args.mode in ("burst", "all"):
            print("\n=== burst (cold-start) hunt ===")
            findings_dir = (args.findings_dir
                            or os.path.abspath(args.out) + ".children")
            result = hunt_burst(
                sink, args.duration, args.batch, args.pairs_per_trial,
                args.idle, args.poll_interval, args.grace, args.churn_files,
                args.churn_sockets, args.churn_thread,
                args.strict_handle_check, args.force_fallback, findings_dir,
                args.keep_trial_records)
            print(json.dumps(result, indent=2))
            print(f"\nCALIBRATION: {result['trials_per_min']} cold-start "
                  f"trials/min, {result['children_per_min']} children/min.")
            print(f"  A 150-minute job at this rate gives "
                  f"{result['trials_per_min'] * 150:.0f} trials; 6,000 is the "
                  f"floor for a clean run to mean anything.")
            sink({"kind": "hunt-summary", "hunt": "burst", "result": result})
    finally:
        out.close()

    print(f"\nfindings appended to {args.out}; "
          f"now run: {sys.executable} {sys.argv[0]} --summarise {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
