# mypy: allow-untyped-defs

import errno
import http
import http.server
import ipaddress
import json
import os
import platform
import select
import selectors
import socket
import socketserver
import ssl
import subprocess
import sys
import threading
import time
import traceback
import uuid
from collections import OrderedDict
from queue import Empty, Queue
from typing import Dict

from h2.config import H2Configuration
from h2.connection import H2Connection
from h2.events import RequestReceived, ConnectionTerminated, DataReceived, StreamReset, StreamEnded
from h2.exceptions import StreamClosedError, ProtocolError
from h2.settings import SettingCodes
from h2.utilities import extract_method_header

from urllib.parse import urlsplit, urlunsplit

from pywebsocket3 import dispatch
from pywebsocket3.handshake import HandshakeException, AbortedByUserException

from . import routes as default_routes
from .config import ConfigBuilder
from .logger import get_logger
from .request import Server, Request, H2Request
from .response import Response, H2Response
from .router import Router
from .utils import HTTPException, get_error_cause, isomorphic_decode, isomorphic_encode
from .constants import h2_headers
from .ws_h2_handshake import WsH2Handshaker

# We need to stress test that browsers can send/receive many headers (there is
# no specified limit), but the Python stdlib has an arbitrary limit of 100
# headers. Hitting the limit leads to HTTP 431, so we monkey patch it higher.
# https://bugs.python.org/issue26586
# https://github.com/web-platform-tests/wpt/pull/24451
import http.client
assert isinstance(getattr(http.client, '_MAXHEADERS'), int)
setattr(http.client, '_MAXHEADERS', 512)

"""
HTTP server designed for testing purposes.

The server is designed to provide flexibility in the way that
requests are handled, and to provide control both of exactly
what bytes are put on the wire for the response, and in the
timing of sending those bytes.

The server is based on the stdlib HTTPServer, but with some
notable differences in the way that requests are processed.
Overall processing is handled by a WebTestRequestHandler,
which is a subclass of BaseHTTPRequestHandler. This is responsible
for parsing the incoming request. A RequestRewriter is then
applied and may change the request data if it matches a
supplied rule.

Once the request data had been finalised, Request and Response
objects are constructed. These are used by the other parts of the
system to read information about the request and manipulate the
response.

Each request is handled by a particular handler function. The
mapping between Request and the appropriate handler is determined
by a Router. By default handlers are installed to interpret files
under the document root with .py extensions as executable python
files (see handlers.py for the api for such files), .asis files as
bytestreams to be sent literally and all other files to be served
statically.

The handler functions are responsible for either populating the
fields of the response object, which will then be written when the
handler returns, or for directly writing to the output stream.
"""


class RequestRewriter:
    def __init__(self, rules):
        """Object for rewriting the request path.

        :param rules: Initial rules to add; a list of three item tuples
                      (method, input_path, output_path), defined as for
                      register()
        """
        self.rules = {}
        for rule in reversed(rules):
            self.register(*rule)
        self.logger = get_logger()

    def register(self, methods, input_path, output_path):
        """Register a rewrite rule.

        :param methods: Set of methods this should match. "*" is a
                        special value indicating that all methods should
                        be matched.

        :param input_path: Path to match for the initial request.

        :param output_path: Path to replace the input path with in
                            the request.
        """
        if isinstance(methods, (bytes, str)):
            methods = [methods]
        self.rules[input_path] = (methods, output_path)

    def rewrite(self, request_handler):
        """Rewrite the path in a BaseHTTPRequestHandler instance, if
           it matches a rule.

        :param request_handler: BaseHTTPRequestHandler for which to
                                rewrite the request.
        """
        split_url = urlsplit(request_handler.path)
        if split_url.path in self.rules:
            methods, destination = self.rules[split_url.path]
            if "*" in methods or request_handler.command in methods:
                self.logger.debug("Rewriting request path %s to %s" %
                             (request_handler.path, destination))
                new_url = list(split_url)
                new_url[2] = destination
                new_url = urlunsplit(new_url)
                request_handler.path = new_url


# --------------------------------------------------------------------------
# winsock-997-probe: throwaway evidence capture for the Windows shutdown-
# socket anomaly investigation. DO NOT MERGE. See
# tools/ci/winsock_probe.py for the hypotheses this is trying to settle.
#
# Active only when WPT_WINSOCK_EVIDENCE_PATH is set (never true in a normal
# ./wpt run); behaviour is unchanged otherwise, and the original exception
# is always re-raised unchanged.
# --------------------------------------------------------------------------
_winsock_probe_module_cache = [None, False]


def _winsock_probe_module():
    module, tried = _winsock_probe_module_cache
    if not tried:
        _winsock_probe_module_cache[1] = True
        try:
            ci_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ci")
            if ci_dir not in sys.path:
                sys.path.insert(0, ci_dir)
            import winsock_probe
            module = winsock_probe
        except Exception:
            module = None
        _winsock_probe_module_cache[0] = module
    return module


def _winsock_probe_log(record):
    path = os.environ.get("WPT_WINSOCK_EVIDENCE_PATH")
    if not path:
        return
    try:
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, default=repr) + "\n")
    except OSError:
        pass


def _winsock_probe_ready_set(events, listener, wakeup_sock):
    """Which handles select() reported ready, by role -- the H8 discriminator.

    serve_forever polls the listening socket and the wakeup socket in ONE
    selector, so on Windows each iteration is a single select() and therefore a
    single AFD poll IOCTL covering both handles.  If an event belonging to the
    listener can be reported against the wakeup socket, that explains why the
    anomaly is always on the socket's *first* poll (the poll in flight when the
    first ever connection to the listener arrives) and why fionread is 0.

    So the question this answers is narrow: when the wakeup socket is spuriously
    readable, was the listener ready in the same call?  Note that on its own a
    yes proves little -- see listener_ready_count in the readable record, which
    is what supplies the base rate to compare it against.
    """
    roles = []
    for key, _mask in events:
        if key.fileobj is wakeup_sock:
            roles.append("wakeup")
        elif key.fileobj is listener:
            roles.append("listener")
        else:
            roles.append(repr(key.fileobj))
    return roles


def _winsock_probe_handshake(sock, peer, port):
    """3.5h treatment arm: prove the pair works before the loop ever polls it.

    Gated on WPT_WINSOCK_PAIR_HANDSHAKE so the same commit runs both arms of the
    A/B; control legs leave this a no-op.

    Build 158874 put the anomaly on the socket's FIRST select() call 9 times out
    of 9, and on no later call across 31,647 healthy wakeups.  This arm tests
    whether that invariant is causal and preventable: push a byte through the
    pair and read it back, so that by the time the loop polls, the socket has
    demonstrably carried traffic end to end.

    Deliberately does NOT touch the socket's blocking mode.  settimeout() would
    have been simpler, but it issues ioctlsocket(FIONBIO) calls, and a working
    treatment arm could then not be attributed to the byte round-trip rather than
    to the mode change.  3.5b spent a whole build establishing what this socket's
    blocking mode is; it is not a thing to perturb casually.

    A byte left unconsumed would poison the loop -- the first poll would find the
    socket genuinely readable, take the shutdown branch, and stop the daemon at
    startup.  The select() below is what prevents that.  If the byte were to
    arrive just after the timeout it would still fail loudly rather than silently:
    the readiness wait fails and the cycle records a startup_error.
    """
    if not os.environ.get("WPT_WINSOCK_PAIR_HANDSHAKE"):
        return
    record = {"kind": "pair-handshake", "ts": time.time(), "pid": os.getpid(),
              "port": port}
    started = time.monotonic()
    try:
        # b'\x00', not b'x': the real shutdown poke sends b'x', and the two must
        # stay distinguishable if one ever shows up where the other belongs.
        peer.send(b"\x00")
        readable, _, _ = select.select([sock], [], [], 5.0)
        if readable:
            got = sock.recv(1)
            record["got"] = got.hex()
            record["ok"] = got == b"\x00"
        else:
            record["ok"] = False
            record["error"] = "timed out waiting for the handshake byte"
    except OSError as exc:
        # The handshake's own recv can hit the anomaly -- that would be a 997 at
        # select_index 0, which is interesting rather than a failure of the arm.
        record["ok"] = False
        record["error"] = repr(exc)
        record["winerror"] = getattr(exc, "winerror", None)
    record["elapsed_s"] = time.monotonic() - started
    _winsock_probe_log(record)


def _winsock_probe_readable(sock, port, created_at, select_index,
                            ready_set=None, listener_ready_count=None):
    if not os.environ.get("WPT_WINSOCK_EVIDENCE_PATH"):
        return
    wp = _winsock_probe_module()

    def _names():
        # Cheap, and it makes the 4-tuple question answerable from controls
        # rather than from the handful of anomaly bundles -- 4-tuple reuse is the
        # one part of H4 still formally untested.
        try:
            return {"sockname": sock.getsockname(),
                    "peername": sock.getpeername()}
        except OSError as exc:
            return {"error": repr(exc)}

    fionread = wp._safe(lambda: wp.bytes_readable(sock.fileno())) if wp else None

    _winsock_probe_log({
        "kind": "readable-pre-recv",
        "ts": time.time(),
        "pid": os.getpid(),
        "thread": threading.current_thread().name,
        "thread_ident": threading.get_ident(),
        "port": port,
        "age_s": time.monotonic() - created_at,
        "select_index": select_index,
        "fionread": fionread,
        # 3.5h additions.
        "ready_set": ready_set,
        # The base rate the ready_set needs to be read against: how many of this
        # daemon's select() calls had the listener ready at all.  Without it,
        # "the listener was ready" is uninterpretable.
        "listener_ready_count": listener_ready_count,
        "names": _names(),
    })
    # Returned so 3.5d can decide whether to freeze the ETW trace here, half a
    # second before the recv raises.  Read it, don't recompute it: FIONREAD is
    # not idempotent in principle and asking twice would be two chances to
    # perturb the handle under investigation.
    return fionread


_winsock_probe_trace_stopped = []


def _winsock_probe_is_phantom(fionread):
    """The anomaly's signature at the readability, before the recv is issued.

    FIONREAD is 0 bytes on 17 of 17 occurrences and 1 byte on 15,118 of 15,118
    healthy wakeups, so this is the cheapest perfect discriminator in the bundle
    and it is available half a second before the recv raises.

    Deliberately strict about the shape.  `fionread` comes back through _safe(),
    so it can be an {"error": ...} dict or a repr string, and neither of those is
    evidence of a phantom -- guessing from a failed measurement would freeze the
    trace on healthy teardown pokes and throw away the one buffer that mattered.
    A fionread that fails is covered by the except-block backstop instead.
    """
    return isinstance(fionread, dict) and fionread.get("bytes") == 0


def _winsock_probe_stop_trace(reason):
    """Freeze the Winsock/AFD ETW trace on the anomaly (3.5d).

    The session runs in circular file mode for the whole leg, so its .etl always
    holds the last N MB of AFD events; stopping it is what freezes the window
    containing the poll that just misreported.  Nothing else in the leg stops it,
    so on a miss the buffer simply wraps forever and the file is discarded.

    Called at the *readability*, not from the except block, and that is the
    point.  `fionread` is a perfect discriminator there -- 0 on 17 of 17
    occurrences against 1 byte on 15,118 of 15,118 healthy wakeups -- and the
    recv then parks 0.40-0.49s before raising.  Half a second of verbose AFD
    events is a great deal of ring buffer, and it is all noise generated *after*
    the event of interest.  The except block calls this too, as a backstop for a
    fionread that lies; whichever fires first wins.

    `logman stop` as a subprocess rather than ControlTraceW via ctypes.  The
    ctypes route is faster and spawns nothing, but EVENT_TRACE_PROPERTIES'
    layout is fiddly, none of it can be exercised off Windows, and a wrong
    struct layout would fail silently at the one moment in the build that
    matters.  This campaign has already lost two builds to plumbing that failed
    into a green tick.  The elapsed time is recorded rather than assumed, so the
    cost of the choice is measurable.
    """
    session = os.environ.get("WPT_WINSOCK_ETW_SESSION")
    if not session or _winsock_probe_trace_stopped:
        return None
    _winsock_probe_trace_stopped.append(True)
    started = time.monotonic()
    try:
        proc = subprocess.run(["logman", "stop", "-n", session, "-ets"],
                              capture_output=True, text=True, timeout=60)
        result = {"rc": proc.returncode,
                  "stdout": (proc.stdout or "").strip()[-400:],
                  "stderr": (proc.stderr or "").strip()[-400:]}
    except Exception as exc:  # noqa: BLE001 - must not mask the real anomaly
        result = {"error": repr(exc)}
    record = {"kind": "etw-stop", "ts": time.time(), "pid": os.getpid(),
              "reason": reason, "elapsed_s": time.monotonic() - started,
              "result": result}
    _winsock_probe_log(record)
    return record


_winsock_probe_dump_taken = []


def _winsock_probe_dump():
    """Dump this process at the anomaly, before anything perturbs it.

    Deliberately called *before* collect_evidence(), which is destructive by
    design: _nonblocking_retry() flips the socket to non-blocking and consumes
    a byte, and iocp_association_state() associates an unassociated handle with
    a completion port.  Any of those would be visible in the dump as state the
    bug did not create.

    One dump per process, ever: a full-memory dump of a daemon child is
    hundreds of MB, and a second one from the same process would show the
    aftermath of the first bundle rather than the anomaly.
    """
    dump_dir = os.environ.get("WPT_WINSOCK_DUMP_DIR")
    if not dump_dir or _winsock_probe_dump_taken:
        return None
    _winsock_probe_dump_taken.append(True)
    wp = _winsock_probe_module()
    if wp is None:
        return {"error": "winsock_probe module unavailable"}
    try:
        os.makedirs(dump_dir, exist_ok=True)
        path = os.path.join(
            dump_dir, f"winsock997-pid{os.getpid()}-{int(time.time())}.dmp")
        return wp.write_minidump(path)
    except Exception as exc:  # noqa: BLE001 - must not mask the real anomaly
        return {"error": repr(exc)}


def _winsock_probe_anomaly(sock, peer, created_at, exc, select_index,
                           recv_s=None, ready_set=None):
    if not os.environ.get("WPT_WINSOCK_EVIDENCE_PATH"):
        return
    # Before collect_evidence(), which is destructive on purpose. The module
    # import unavoidably happens first (write_minidump lives there), so its
    # effect on the last-error slot is already baked in either way -- that is
    # the same defect the bundle's own slot_now field has.
    dump = _winsock_probe_dump()
    wp = _winsock_probe_module()
    # recv_s is 3.5h's headline field. Build 158874 showed 1.13-2.64s between the
    # readable-pre-recv record and the 997 on all eight occurrences, which is the
    # most surprising thing it found -- but that interval is log-emit PLUS recv,
    # and the log goes through a QueueHandler onto an mp.Queue while 12 daemons
    # spawn, so it could not be attributed. This times the recv alone.
    extra = {"select_index": select_index, "dump": dump,
             "recv_s": recv_s, "ready_set": ready_set}
    if wp is None:
        _winsock_probe_log({"kind": "anomaly-no-module", "exc": repr(exc),
                            **extra})
        return
    _winsock_probe_log(wp.collect_evidence(
        sock, peer, created_at, exc, "server.serve_forever", extra=extra))


class WebTestServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    # Older versions of Python might throw `OSError: [Errno 0] Error`
    # instead of `SSLEOFError`.
    acceptable_errors = (errno.EPIPE, errno.ECONNABORTED, 0)
    request_queue_size = 2000

    # Ensure that we don't hang on shutdown waiting for requests
    daemon_threads = True

    def __init__(self, server_address, request_handler_cls,
                 router, rewriter, bind_address, ws_doc_root=None,
                 config=None, use_ssl=False, key_file=None, certificate=None,
                 encrypt_after_connect=False, latency=None, http2=False, **kwargs):
        """Server for HTTP(s) Requests

        :param server_address: tuple of (server_name, port)

        :param request_handler_cls: BaseHTTPRequestHandler-like class to use for
                                    handling requests.

        :param router: Router instance to use for matching requests to handler
                       functions

        :param rewriter: RequestRewriter-like instance to use for preprocessing
                         requests before they are routed

        :param config: Dictionary holding environment configuration settings for
                       handlers to read, or None to use the default values.

        :param use_ssl: Boolean indicating whether the server should use SSL

        :param key_file: Path to key file to use if SSL is enabled.

        :param certificate: Path to certificate to use if SSL is enabled.

        :param ws_doc_root: Document root for websockets

        :param encrypt_after_connect: For each connection, don't start encryption
                                      until a CONNECT message has been received.
                                      This enables the server to act as a
                                      self-proxy.

        :param bind_address True to bind the server to both the IP address and
                            port specified in the server_address parameter.
                            False to bind the server only to the port in the
                            server_address parameter, but not to the address.
        :param latency: Delay in ms to wait before serving each response, or
                        callable that returns a delay in ms
        """
        self._shutdown_event = threading.Event()
        self._shutdown_write_sock = None

        self.router = router
        self.rewriter = rewriter

        self.scheme = "http2" if http2 else "https" if use_ssl else "http"
        self.logger = get_logger()

        self.latency = latency

        if bind_address:
            hostname_port = server_address
        else:
            hostname_port = ("",server_address[1])

        super().__init__(hostname_port, request_handler_cls)

        if config is not None:
            Server.config = config
        else:
            self.logger.debug("Using default configuration")
            with ConfigBuilder(self.logger,
                               browser_host=server_address[0],
                               ports={"http": [self.server_address[1]]}) as config:
                assert config["ssl_config"] is None
                Server.config = config



        self.ws_doc_root = ws_doc_root
        self.key_file = key_file
        self.certificate = certificate
        self.encrypt_after_connect = use_ssl and encrypt_after_connect

        if use_ssl and not encrypt_after_connect:
            if http2:
                ssl_context = ssl.create_default_context(purpose=ssl.Purpose.CLIENT_AUTH)
                ssl_context.load_cert_chain(keyfile=self.key_file, certfile=self.certificate)
                ssl_context.set_alpn_protocols(['h2'])
                self.socket = ssl_context.wrap_socket(self.socket,
                                                      do_handshake_on_connect=False,
                                                      server_side=True)

            else:
                ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                ssl_context.load_cert_chain(keyfile=self.key_file, certfile=self.certificate)
                self.socket = ssl_context.wrap_socket(self.socket,
                                                      do_handshake_on_connect=False,
                                                      server_side=True)

    def server_bind(self):
        if platform.system() != "Darwin":
            super().server_bind()
        else:
            # We override this on macOS to workaround gethostbyaddr triggering the local
            # network alert even when passed "localhost" (rdar://153097791); this should
            # be the same as the superclass implementation except for the addition of
            # our check.
            socketserver.TCPServer.server_bind(self)
            host, port = self.server_address[:2]
            if (
                ipaddress.ip_address(host).is_loopback and
                ipaddress.ip_address(socket.gethostbyname("localhost")).is_loopback
            ):
                self.server_name = "localhost"
            else:
                self.server_name = socket.getfqdn(host)
            self.server_port = port

    def serve_forever(self, poll_interval=0.5):
        """Handle one request at a time until shutdown.

        This overrides the superclass implementation to use a socket pair to process
        shutdown requests, avoiding waiting the poll_interval before shutting down.
        It does, however, still call service_actions() every poll_interval.

        """
        shutdown_read_sock, self._shutdown_write_sock = socket.socketpair()
        self._shutdown_event.clear()
        # winsock-997-probe: throwaway, never merge.
        created_at = time.monotonic()
        select_index = 0
        listener_ready_count = 0
        # winsock-997-probe 3.5h treatment arm: throwaway, never merge. A no-op
        # unless WPT_WINSOCK_PAIR_HANDSHAKE is set, so control and treatment legs
        # run the identical commit.
        _winsock_probe_handshake(shutdown_read_sock, self._shutdown_write_sock,
                                 self.server_port)

        try:
            with selectors.DefaultSelector() as selector:
                selector.register(self, selectors.EVENT_READ)
                selector.register(shutdown_read_sock, selectors.EVENT_READ)

                while True:
                    events = selector.select(timeout=poll_interval)
                    select_index += 1  # winsock-997-probe: throwaway, never merge.
                    # winsock-997-probe: throwaway, never merge. The base rate
                    # the anomaly's ready_set has to be read against.
                    if any(key.fileobj is self for key, _mask in events):
                        listener_ready_count += 1

                    # Handle shutdown requests before any request
                    if any(
                        key.fileobj == shutdown_read_sock and mask == selectors.EVENT_READ
                        for key, mask in events
                    ):
                        # winsock-997-probe: throwaway, never merge. Log at the
                        # readability, not only the error, since a phantom
                        # readable that doesn't raise would otherwise park this
                        # thread in recv() forever with no trace at all.
                        ready_set = _winsock_probe_ready_set(
                            events, self, shutdown_read_sock)
                        fionread = _winsock_probe_readable(
                            shutdown_read_sock, self.server_port, created_at,
                            select_index, ready_set, listener_ready_count)
                        # winsock-997-probe 3.5d: throwaway, never merge. Freeze
                        # the ETW ring buffer *here*, on the fionread==0
                        # signature, rather than waiting for the recv below to
                        # raise 0.40-0.49s later. A no-op unless
                        # WPT_WINSOCK_ETW_SESSION names a running session.
                        if _winsock_probe_is_phantom(fionread):
                            _winsock_probe_stop_trace("fionread-0")
                        # Timed separately from the log line above: see recv_s in
                        # _winsock_probe_anomaly.
                        recv_started = time.monotonic()
                        try:
                            shutdown_read_sock.recv(1)
                        except OSError as exc:
                            # Backstop for a fionread that lied, and it must come
                            # first: _winsock_probe_anomaly does slow, destructive
                            # things, and every millisecond here is more AFD
                            # traffic overwriting the poll we want.
                            _winsock_probe_stop_trace("recv-raised")
                            _winsock_probe_anomaly(
                                shutdown_read_sock, self._shutdown_write_sock,
                                created_at, exc, select_index,
                                time.monotonic() - recv_started, ready_set)
                            raise
                        break

                    for key, mask in events:
                        if key.fileobj == self and mask == selectors.EVENT_READ:
                            super()._handle_request_noblock()
                        else:
                            assert False, "unreachable"
                    else:
                        self.service_actions()

        finally:
            shutdown_read_sock.close()
            self._shutdown_write_sock.close()
            self._shutdown_event.set()

    def shutdown(self):
        """Stops the serve_forever loop and waits for it to finish."""
        self._shutdown_write_sock.send(b'x')
        self._shutdown_event.wait()

    def finish_request(self, request, client_address):
        if isinstance(self.socket, ssl.SSLSocket):
            request.do_handshake()
        super().finish_request(request, client_address)

    def handle_error(self, request, client_address):
        error = sys.exc_info()[1]

        if ((isinstance(error, OSError) and
             isinstance(error.args, tuple) and
             error.args[0] in self.acceptable_errors) or
            (isinstance(error, IOError) and
             error.errno in self.acceptable_errors) or
            # `SSLEOFError` and `SSLError` may occur when a client
            # (e.g., wptrunner's `TestEnvironment`) tests for connectivity
            # but doesn't perform the handshake.
            isinstance(error, ssl.SSLEOFError) or isinstance(error, ssl.SSLError)):
            pass  # remote hang up before the result is sent
        else:
            msg = traceback.format_exc()
            self.logger.error(f"{type(error)} {error}")
            self.logger.info(msg)


class BaseWebTestRequestHandler(http.server.BaseHTTPRequestHandler):
    """RequestHandler for WebTestHttpd"""

    def __init__(self, *args, **kwargs):
        self.logger = get_logger()
        super().__init__(*args, **kwargs)

    def finish_handling_h1(self, request_line_is_valid):

        self.server.rewriter.rewrite(self)

        with Request(self) as request:
            response = Response(self, request)

            if request.method == "CONNECT":
                self.handle_connect(response)
                return

            if not request_line_is_valid:
                response.set_error(414)
                response.write()
                return

            self.logger.debug(f"{request.method} {request.request_path}")
            handler = self.server.router.get_handler(request)
            self.finish_handling(request, response, handler)

    def finish_handling(self, request, response, handler):
        # If the handler we used for the request had a non-default base path
        # set update the doc_root of the request to reflect this
        if hasattr(handler, "base_path") and handler.base_path:
            request.doc_root = handler.base_path
        if hasattr(handler, "url_base") and handler.url_base != "/":
            request.url_base = handler.url_base

        if self.server.latency is not None:
            if callable(self.server.latency):
                latency = self.server.latency()
            else:
                latency = self.server.latency
            self.logger.warning("Latency enabled. Sleeping %i ms" % latency)
            time.sleep(latency / 1000.)

        if handler is None:
            self.logger.debug("No Handler found!")
            response.set_error(404)
        else:
            try:
                handler(request, response)
            except HTTPException as e:
                exc = get_error_cause(e) if 500 <= e.code < 600 else e
                response.set_error(e.code, exc)
            except Exception as e:
                response.set_error(500, e)
        self.logger.debug("%i %s %s (%s) %i" % (response.status[0],
                                                request.method,
                                                request.request_path,
                                                request.headers.get('Referer'),
                                                request.raw_input.length))

        if not response.writer.content_written:
            response.write()

        # If a python handler has been used, the old ones won't send a END_STR data frame, so this
        # allows for backwards compatibility by accounting for these handlers that don't close streams
        if isinstance(response, H2Response) and not response.writer.stream_ended:
            response.writer.end_stream()

        # If we want to remove this in the future, a solution is needed for
        # scripts that produce a non-string iterable of content, since these
        # can't set a Content-Length header. A notable example of this kind of
        # problem is with the trickle pipe i.e. foo.js?pipe=trickle(d1)
        if response.close_connection:
            self.close_connection = True

        if not self.close_connection:
            # Ensure that the whole request has been read from the socket
            request.raw_input.read()

    def handle_connect(self, response):
        self.logger.debug("Got CONNECT")
        response.status = 200
        response.write()
        if self.server.encrypt_after_connect:
            self.logger.debug("Enabling SSL for connection")
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ssl_context.load_cert_chain(keyfile=self.server.key_file, certfile=self.server.certificate)
            self.request = ssl_context.wrap_socket(self.connection,
                                                   server_side=True)
            self.setup()
        return

    def log_request(self, code="-", size="-"):
        if isinstance(code, http.HTTPStatus):
            code = code.value

        self.logger.debug(
            "{} - - [{}] {!r} {!s} {!s}".format(
                self.address_string(),
                self.log_date_time_string(),
                self.requestline,
                code,
                size,
            )
        )

    def log_error(self, format, *args):
        self.logger.error(
            "{} - - [{}] {}".format(
                self.address_string(), self.log_date_time_string(), format % args
            )
        )

    def log_message(self, format, *args):
        self.logger.info(
            "{} - - [{}] {}".format(
                self.address_string(), self.log_date_time_string(), format % args
            )
        )


class Http2WebTestRequestHandler(BaseWebTestRequestHandler):
    protocol_version = "HTTP/2.0"

    def handle_one_request(self):
        """
        This is the main HTTP/2 Handler.

        When a browser opens a connection to the server
        on the HTTP/2 port, the server enters this which will initiate the h2 connection
        and keep running throughout the duration of the interaction, and will read/write directly
        from the socket.

        Because there can be multiple H2 connections active at the same
        time, a UUID is created for each so that it is easier to tell them apart in the logs.
        """

        config = H2Configuration(client_side=False)
        self.conn = H2ConnectionGuard(H2Connection(config=config))
        self.close_connection = False

        # Generate a UUID to make it easier to distinguish different H2 connection debug messages
        self.uid = str(uuid.uuid4())[:8]

        self.logger.debug('(%s) Initiating h2 Connection' % self.uid)

        with self.conn as connection:
            # Bootstrapping WebSockets with HTTP/2 specification requires
            # ENABLE_CONNECT_PROTOCOL to be set in order to enable WebSocket
            # over HTTP/2
            new_settings = dict(connection.local_settings)
            new_settings[SettingCodes.ENABLE_CONNECT_PROTOCOL] = 1
            connection.local_settings.update(new_settings)
            connection.local_settings.acknowledge()

            connection.initiate_connection()
            data = connection.data_to_send()
            window_size = connection.remote_settings.initial_window_size

        try:
            self.request.sendall(data)
        except ConnectionResetError:
            self.logger.warning("Connection reset during h2 setup")
            return

        # Dict of { stream_id: (thread, queue) }
        stream_queues = {}

        try:
            while not self.close_connection:
                data = self.request.recv(window_size)
                if data == b'':
                    self.logger.debug('(%s) Socket Closed' % self.uid)
                    self.close_connection = True
                    continue

                with self.conn as connection:
                    frames = connection.receive_data(data)
                    window_size = connection.remote_settings.initial_window_size
                    non_closed_streams = {
                        stream_id
                        for stream_id, stream in connection.streams.items()
                        if not stream.closed
                    }

                self.logger.debug('(%s) Frames Received: ' % self.uid + str(frames))

                for frame in frames:
                    if isinstance(frame, ConnectionTerminated):
                        self.logger.debug('(%s) Connection terminated by remote peer ' % self.uid)
                        self.close_connection = True

                        # Flood all the streams with connection terminated, this will cause them to stop
                        for stream_id, (thread, queue) in stream_queues.items():
                            queue.put(frame)

                    elif hasattr(frame, 'stream_id') and frame.stream_id != 0:
                        # Stream ID 0 is reserved for connection control messages (RFC 9113 § 5.1.1)
                        # and is handled directly by h2, so we only create streams for stream IDs > 0
                        if frame.stream_id not in stream_queues:
                            queue = Queue()
                            stream_queues[frame.stream_id] = (self.start_stream_thread(frame, queue), queue)
                        stream_queues[frame.stream_id][1].put(frame)

                for closed_id in set(stream_queues.keys()) - non_closed_streams:
                    self.logger.debug(f'({self.uid}) Stream {closed_id} is closed, removing queue')
                    del stream_queues[closed_id]

        except OSError as e:
            self.logger.error(f'({self.uid}) Closing Connection - \n{str(e)}')
            if not self.close_connection:
                self.close_connection = True
        except ProtocolError as e:
            self.logger.debug(f'H2 protocol error - {str(e)}')
            if not self.close_connection:
                self.close_connection = True
        except Exception as e:
            self.logger.error(f'({self.uid}) Unexpected Error - \n{str(e)}')
        finally:
            for stream_id, (thread, queue) in stream_queues.items():
                queue.put(None)
                thread.join()

    def _is_extended_connect_frame(self, frame):
        if not isinstance(frame, RequestReceived):
            return False

        method = extract_method_header(frame.headers)
        if method != b"CONNECT":
            return False

        protocol = ""
        for key, value in frame.headers:
            if key in (b':protocol', ':protocol'):
                protocol = isomorphic_encode(value)
                break
        if protocol != b"websocket":
            raise ProtocolError(f"Invalid protocol {protocol} with CONNECT METHOD")

        return True

    def start_stream_thread(self, frame, queue):
        """
        This starts a new thread to handle frames for a specific stream.
        :param frame: The first frame on the stream
        :param queue: A queue object that the thread will use to check for new frames
        :return: The thread object that has already been started
        """
        if self._is_extended_connect_frame(frame):
            target = Http2WebTestRequestHandler._stream_ws_thread
        else:
            target = Http2WebTestRequestHandler._stream_thread
        t = threading.Thread(
            target=target,
            args=(self, frame.stream_id, queue)
        )
        t.start()
        return t

    def _stream_ws_thread(self, stream_id, queue):
        frame = queue.get(True, None)

        if frame is None:
            return

        # Needs to be unbuffered for websockets.
        rfile, wfile = os.pipe()
        with os.fdopen(rfile, 'rb') as rfile, os.fdopen(wfile, 'wb', 0) as wfile:
            stream_handler = H2HandlerCopy(self, frame, rfile)

            h2request = H2Request(stream_handler)
            h2response = H2Response(stream_handler, h2request)

            dispatcher = dispatch.Dispatcher(self.server.ws_doc_root, None, False)
            if not dispatcher.get_handler_suite(stream_handler.path):
                h2response.set_error(404)
                h2response.write()
                return

            request_wrapper = _WebSocketRequest(stream_handler, h2response)

            handshaker = WsH2Handshaker(request_wrapper, dispatcher)
            try:
                handshaker.do_handshake()
            except HandshakeException as e:
                self.logger.info("Handshake failed")
                h2response.set_error(e.status, e)
                h2response.write()
                return
            except AbortedByUserException:
                h2response.write()
                return

            # h2 Handshaker prepares the headers but does not send them down the
            # wire. Flush the headers here.
            try:
                h2response.write_status_headers()
            except (StreamClosedError, ProtocolError):
                # work around https://github.com/web-platform-tests/wpt/issues/27786
                # The stream or connection was already closed.
                return

            request_wrapper._dispatcher = dispatcher

            # we need two threads:
            # - one to handle the frame queue
            # - one to handle the request (dispatcher.transfer_data is blocking)
            # the alternative is to have only one (blocking) thread. That thread
            # will call transfer_data. That would require a special case in
            # handle_one_request, to bypass the queue and write data to wfile
            # directly.
            t = threading.Thread(
                target=Http2WebTestRequestHandler._stream_ws_sub_thread,
                args=(self, request_wrapper, stream_handler, queue)
            )
            t.start()

            while not self.close_connection:
                try:
                    frame = queue.get(True, 1)
                except Empty:
                    continue

                if isinstance(frame, DataReceived):
                    wfile.write(frame.data)
                    if frame.stream_ended:
                        raise NotImplementedError("frame.stream_ended")
                elif frame is None or isinstance(frame, (StreamReset, StreamEnded, ConnectionTerminated)):
                    self.logger.error(f'({self.uid} - {stream_id}) Stream Reset, Thread Closing')
                    break

        t.join()

    def _stream_ws_sub_thread(self, request, stream_handler, queue):
        dispatcher = request._dispatcher
        try:
            dispatcher.transfer_data(request)
        except (StreamClosedError, ProtocolError):
            # work around https://github.com/web-platform-tests/wpt/issues/27786
            # The stream was already closed.
            queue.put(None)
            return

        stream_id = stream_handler.h2_stream_id
        with stream_handler.conn as connection:
            try:
                connection.end_stream(stream_id)
                data = connection.data_to_send()
                stream_handler.request.sendall(data)
            except (StreamClosedError, ProtocolError):  # maybe the stream has already been closed
                pass
        queue.put(None)

    def _stream_thread(self, stream_id, queue):
        """
        This thread processes frames for a specific stream. It waits for frames to be placed
        in the queue, and processes them. When it receives a request frame, it will start processing
        immediately, even if there are data frames to follow. One of the reasons for this is that it
        can detect invalid requests before needing to read the rest of the frames.
        """

        # The file-like pipe object that will be used to share data to request object if data is received
        wfile = None
        rfile = None
        request = None
        response = None
        req_handler = None

        def cleanup():
            # Try to close the files
            # Ignore any exception (e.g. if the file handle was already closed for some reason).
            if rfile:
                try:
                    rfile.close()
                except OSError:
                    pass
            if wfile:
                try:
                    wfile.close()
                except OSError:
                    pass

        while not self.close_connection:
            try:
                frame = queue.get(True, 1)
            except Empty:
                # Restart to check for close_connection
                continue

            self.logger.debug(f'({self.uid} - {stream_id}) {str(frame)}')
            if isinstance(frame, RequestReceived):
                cleanup()

                pipe_rfile, pipe_wfile = os.pipe()
                (rfile, wfile) = os.fdopen(pipe_rfile, 'rb'), os.fdopen(pipe_wfile, 'wb')

                stream_handler = H2HandlerCopy(self, frame, rfile)

                stream_handler.server.rewriter.rewrite(stream_handler)
                request = H2Request(stream_handler)
                response = H2Response(stream_handler, request)

                req_handler = stream_handler.server.router.get_handler(request)

                if hasattr(req_handler, "frame_handler"):
                    # Convert this to a handler that will utilise H2 specific functionality, such as handling individual frames
                    req_handler = self.frame_handler(request, response, req_handler)

                if hasattr(req_handler, 'handle_headers'):
                    req_handler.handle_headers(frame, request, response)

            elif isinstance(frame, DataReceived):
                wfile.write(frame.data)

                if hasattr(req_handler, 'handle_data'):
                    req_handler.handle_data(frame, request, response)

            elif frame is None or isinstance(frame, (StreamReset, StreamEnded, ConnectionTerminated)):
                self.logger.debug(f'({self.uid} - {stream_id}) Stream Reset, Thread Closing')
                break

            if request is not None:
                request.frames.append(frame)

            if getattr(frame, "stream_ended", False):
                try:
                    self.finish_handling(request, response, req_handler)
                except (StreamClosedError, ProtocolError):
                    # The stream or connection was closed before we could
                    # finish writing the response.
                    self.logger.debug(
                        '(%s - %s) Unable to write response; stream or '
                        'connection closed' % (self.uid, stream_id))
                break

        cleanup()

    def frame_handler(self, request, response, handler):
        try:
            return handler.frame_handler(request)
        except HTTPException as e:
            exc = get_error_cause(e) if 500 <= e.code < 600 else e
            response.set_error(exc.code, exc)
            response.write()
        except Exception as e:
            response.set_error(500, e)
            response.write()


class H2ConnectionGuard:
    """H2Connection objects are not threadsafe, so this keeps thread safety"""
    def __init__(self, obj):
        assert isinstance(obj, H2Connection)
        self.obj = obj
        self.lock = threading.Lock()

    def __enter__(self):
        self.lock.acquire()
        return self.obj

    def __exit__(self, exception_type, exception_value, traceback):
        self.lock.release()


class H2Headers(Dict[bytes, bytes]):
    def __init__(self, headers):
        self.raw_headers = OrderedDict()
        for key, val in headers:
            key = isomorphic_decode(key)
            val = isomorphic_decode(val)
            self.raw_headers[key] = val
            dict.__setitem__(self, self._convert_h2_header_to_h1(key), val)

    def _convert_h2_header_to_h1(self, header_key):
        if header_key[1:] in h2_headers and header_key[0] == ':':
            return header_key[1:]
        else:
            return header_key

    # TODO This does not seem relevant for H2 headers, so using a dummy function for now
    def getallmatchingheaders(self, header):
        return ['dummy function']


class H2HandlerCopy:
    def __init__(self, handler, req_frame, rfile):
        self.headers = H2Headers(req_frame.headers)
        self.command = self.headers['method']
        self.path = self.headers['path']
        self.h2_stream_id = req_frame.stream_id
        self.server = handler.server
        self.protocol_version = handler.protocol_version
        self.client_address = handler.client_address
        self.raw_requestline = ''
        self.rfile = rfile
        self.request = handler.request
        self.conn = handler.conn

class Http1WebTestRequestHandler(BaseWebTestRequestHandler):
    protocol_version = "HTTP/1.1"

    def handle_one_request(self):
        response = None

        try:
            self.close_connection = False

            request_line_is_valid = self.get_request_line()

            if self.close_connection:
                return

            request_is_valid = self.parse_request()
            if not request_is_valid:
                #parse_request() actually sends its own error responses
                return

            self.finish_handling_h1(request_line_is_valid)

        except socket.timeout as e:
            self.log_error("Request timed out: %r", e)
            self.close_connection = True
            return

        except Exception as e:
            if response:
                response.set_error(500, e)
                response.write()

    def get_request_line(self):
        try:
            self.raw_requestline = self.rfile.readline(65537)
        except OSError:
            self.close_connection = True
            return False
        if len(self.raw_requestline) > 65536:
            self.requestline = ''
            self.request_version = ''
            self.command = ''
            return False
        if not self.raw_requestline:
            self.close_connection = True
        return True

class WebTestHttpd:
    """
    :param host: Host from which to serve (default: 127.0.0.1)
    :param port: Port from which to serve (default: 8000)
    :param server_cls: Class to use for the server (default depends on ssl vs non-ssl)
    :param handler_cls: Class to use for the RequestHandler
    :param use_ssl: Use a SSL server if no explicit server_cls is supplied
    :param key_file: Path to key file to use if ssl is enabled
    :param certificate: Path to certificate file to use if ssl is enabled
    :param encrypt_after_connect: For each connection, don't start encryption
                                  until a CONNECT message has been received.
                                  This enables the server to act as a
                                  self-proxy.
    :param router_cls: Router class to use when matching URLs to handlers
    :param doc_root: Document root for serving files
    :param ws_doc_root: Document root for websockets
    :param routes: List of routes with which to initialize the router
    :param rewriter_cls: Class to use for request rewriter
    :param rewrites: List of rewrites with which to initialize the rewriter_cls
    :param config: Dictionary holding environment configuration settings for
                   handlers to read, or None to use the default values.
    :param bind_address: Boolean indicating whether to bind server to IP address.
    :param latency: Delay in ms to wait before serving each response, or
                    callable that returns a delay in ms

    HTTP server designed for testing scenarios.

    Takes a router class which provides one method get_handler which takes a Request
    and returns a handler function.

    .. attribute:: host

      The host name or ip address of the server

    .. attribute:: port

      The port on which the server is running

    .. attribute:: router

      The Router object used to associate requests with resources for this server

    .. attribute:: rewriter

      The Rewriter object used for URL rewriting

    .. attribute:: use_ssl

      Boolean indicating whether the server is using ssl

    .. attribute:: started

      Boolean indicating whether the server is running

    """
    def __init__(self, host="127.0.0.1", port=8000,
                 server_cls=None, handler_cls=Http1WebTestRequestHandler,
                 use_ssl=False, key_file=None, certificate=None, encrypt_after_connect=False,
                 router_cls=Router, doc_root=os.curdir, ws_doc_root=None, routes=None,
                 rewriter_cls=RequestRewriter, bind_address=True, rewrites=None,
                 latency=None, config=None, http2=False):

        if routes is None:
            routes = default_routes.routes

        self.host = host

        self.router = router_cls(doc_root, routes)
        self.rewriter = rewriter_cls(rewrites if rewrites is not None else [])

        self.use_ssl = use_ssl
        self.http2 = http2
        self.logger = get_logger()

        if server_cls is None:
            server_cls = WebTestServer

        if use_ssl:
            if not os.path.exists(key_file):
                raise ValueError(f"SSL certificate not found: {key_file}")
            if not os.path.exists(certificate):
                raise ValueError(f"SSL key not found: {certificate}")

        try:
            self.httpd = server_cls((host, port),
                                    handler_cls,
                                    self.router,
                                    self.rewriter,
                                    config=config,
                                    bind_address=bind_address,
                                    ws_doc_root=ws_doc_root,
                                    use_ssl=use_ssl,
                                    key_file=key_file,
                                    certificate=certificate,
                                    encrypt_after_connect=encrypt_after_connect,
                                    latency=latency,
                                    http2=http2)
            self.started = False

            _host, self.port = self.httpd.socket.getsockname()
        except Exception:
            self.logger.critical("Failed to start HTTP server on port %s; "
                                 "is something already using that port?" % port)
            raise

    def start(self):
        """Start the server.

        :param block: True to run the server on the current thread, blocking,
                      False to run on a separate thread."""
        http_type = "http2" if self.http2 else "https" if self.use_ssl else "http"
        http_scheme = "https" if self.use_ssl else "http"
        self.logger.info(f"Starting {http_type} server on {http_scheme}://{self.host}:{self.port}")
        self.started = True
        self.server_thread = threading.Thread(target=self.httpd.serve_forever)
        self.server_thread.daemon = True  # don't hang on exit
        self.server_thread.start()

    def stop(self):
        """
        Stops the server.

        If the server is not running, this method has no effect.
        """
        if self.started:
            try:
                self.httpd.shutdown()
                self.httpd.server_close()
                self.server_thread.join()
                self.server_thread = None
                self.logger.info(f"Stopped http server on {self.host}:{self.port}")
            except AttributeError:
                pass
            self.started = False
        self.httpd = None

    def get_url(self, path="/", query=None, fragment=None):
        if not self.started:
            return None

        return urlunsplit(("http" if not self.use_ssl else "https",
                           f"{self.host}:{self.port}",
                           path, query, fragment))


class _WebSocketConnection:
    def __init__(self, request_handler, response):
        """Mimic mod_python mp_conn.

        :param request_handler: A H2HandlerCopy instance.

        :param response: A H2Response instance.
        """

        self._request_handler = request_handler
        self._response = response

        self.remote_addr = self._request_handler.client_address

    def write(self, data):
        self._response.writer.write_data(data, False)

    def read(self, length):
        return self._request_handler.rfile.read(length)


class _WebSocketRequest:
    def __init__(self, request_handler, response):
        """Mimic mod_python request.

        :param request_handler: A H2HandlerCopy instance.

        :param response: A H2Response instance.
        """

        self.connection = _WebSocketConnection(request_handler, response)
        self.protocol = "HTTP/2"
        self._response = response

        self.uri = request_handler.path
        self.unparsed_uri = request_handler.path
        self.method = request_handler.command
        # read headers from request_handler
        self.headers_in = request_handler.headers
        # write headers directly into H2Response
        self.headers_out = response.headers

    # proxies status to H2Response
    @property
    def status(self):
        return self._response.status

    @status.setter
    def status(self, status):
        self._response.status = status
