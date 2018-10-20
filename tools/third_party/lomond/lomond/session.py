"""
The session manages the mechanics of receiving and sending data over
the websocket.

"""

from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import logging
import math
import socket
import ssl
import threading
import time

from six.moves.urllib.parse import urlparse

from .frame import Frame
from . import errors
from . import events
from . import proxy
from . import selectors


HAS_SNI = hasattr(ssl, 'SSLContext') and getattr(ssl, 'HAS_SNI', False)
log = logging.getLogger('lomond')


class _SocketFail(Exception):
    """Used internally to respond to socket fails."""


class _ForceDisconnect(Exception):
    """Used internally when the close timeout is tripped."""


class WebsocketSession(object):
    """Manages the mechanics of running the websocket."""
    _selector_cls = selectors.PlatformSelector

    BUFFER_SIZE = 64 * 1024

    def __init__(self, websocket):
        self.websocket = websocket
        self._address = (websocket.host, websocket.port)
        self._lock = threading.Lock()
        self._sock = None
        self._poll_start = None
        self._next_ping = None
        self._last_pong = None
        self._start_time = None
        self._ready = False
        self._buffer = bytearray(self.BUFFER_SIZE)

    def __repr__(self):
        return "<ws-session '{}'>".format(self.websocket.url)

    @property
    def session_time(self):
        """Get the time (in seconds) since the WebSocket session started."""
        return (
            0.0
            if self._start_time is None else
            time.time() - self._start_time
        )

    def close(self):
        """Close the websocket, if it is open."""
        self._close_socket()
        self._sock = None

    def force_disconnect(self):
        """Force the socket to disconnect."""
        raise _ForceDisconnect()

    def write(self, data):
        """Send raw data."""
        with self._lock:
            if self._sock is None:
                log.debug('WebSocket unavailable; data not sent')
                raise errors.WebSocketUnavailable('not connected')
            if self.websocket.is_closed:
                log.debug('WebSocket closed; data not sent')
                raise errors.WebSocketClosed('data not sent')
            if self.websocket.is_closing:
                log.debug('WebSocket closing; data not sent')
                raise errors.WebSocketClosing('data not sent')
            try:
                self._sock.sendall(data)
            except socket.error as error:
                log.debug('WebSocket send error; %s', error)
                raise errors.TransportFail(
                    'socket fail; {}', error
                )
            except Exception as error:
                log.warning('WebSocket send error; %s', error)
                raise errors.TransportFail(
                    'socket error; {}', error
                )

    def send(self, opcode, data):
        """Send a WS Frame."""
        frame = Frame(opcode, payload=bytearray(data))
        self.write(frame.to_bytes())
        log.debug(' SRV <- CLI : %r', frame)

    def send_compressed(self, opcode, data):
        """Send a compressed WS Frame."""
        frame = Frame(opcode, payload=bytearray(data), rsv1=1)
        self.write(frame.to_bytes())
        log.debug(' SRV <- CLI : %r', frame)

    @classmethod
    def _socket_fail(cls, msg, *args, **kwargs):
        """Raises a socket fail error to exit select loop."""
        _msg = msg.format(*args, **kwargs)
        log.debug(_msg)
        raise _SocketFail(_msg)

    def _connect_sock(self, host, port, ssl=False):
        sock = None
        try:
            addr_info = socket.getaddrinfo(
                host, port, socket.AF_UNSPEC, socket.SOCK_STREAM
            )
        except socket.error as error:
            self._socket_fail('unable to connect; {}', error)
        for res in addr_info:
            af, socktype, proto, canonname, sa = res
            try:
                sock = socket.socket(af, socktype, proto)
            except socket.error as error:
                log.debug('unable to create socket; %s', error)
                sock = None
                continue
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            sock.settimeout(30)  # TODO: make a parameter for this?
            if ssl:
                log.debug('wrapping socket')
                sock = self._wrap_socket(sock, host)
            try:
                sock.connect(sa)
            except socket.error as error:
                log.debug('socket error connecting to %r; %s', sa, error)
                sock.close()
                sock = None
                continue
            break
        if sock is None:
            self._socket_fail('unable to connect')
        return sock

    def _connect_proxy(self, proxy_url):
        """Connect to a http proxy, return socket."""
        _proxy_url = urlparse(proxy_url)
        _port = (
            int(_proxy_url.port)
            if _proxy_url.port else
            (443 if _proxy_url.scheme == 'https' else 80)
        )
        try:
            sock = self._connect_sock(
                _proxy_url.hostname, _port,
                ssl=_proxy_url.scheme == 'https'
            )
        except _SocketFail as error:
            self._socket_fail('unable to connect to proxy; {}', error)
        proxy_request = proxy.build_request(
            self.websocket.host, self.websocket.port,
            proxy_username=_proxy_url.username,
            proxy_password=_proxy_url.password
        )
        sock.sendall(proxy_request)
        proxy_parser = proxy.ProxyParser()
        response = None
        while response is None:
            data = sock.recv(1024)
            for response in proxy_parser.feed(data):
                break
        return (
            self._wrap_socket(sock, self.websocket.host)
            if self.websocket.is_secure else
            sock
        )

    def _connect(self):
        """Create socket and connect."""
        proxy = self.websocket.proxies.get(
            'https' if self.websocket.is_secure else 'http'
        )
        if proxy:
            sock = self._connect_proxy(proxy)
            proxy_url = proxy
        else:
            sock = self._connect_sock(
                self.websocket.host,
                self.websocket.port,
                ssl=self.websocket.is_secure
            )
            proxy_url = None
        # The timeout makes the socket non-blocking
        # We want to the socket to block after the connection
        sock.settimeout(None)
        return sock, proxy_url

    def _wrap_socket(self, sock, host):
        """Wrap the socket with an SSL proxy."""
        # sniff SNI support (added Python 2.7.9)
        if HAS_SNI:
            _protocol = getattr(
                ssl,
                'PROTOCOL_TLS',  # Supported since 2.7.13
                ssl.PROTOCOL_SSLv23   # Supported since 2.7.9
            )
            ssl_context = ssl.SSLContext(_protocol)
            ssl_sock = ssl_context.wrap_socket(
                sock, server_hostname=host
            )
        else:
            # Fallback for no SNI
            ssl_sock = ssl.wrap_socket(sock)
        log.debug('wrapped socket %r', ssl_sock)
        return ssl_sock

    def _close_socket(self):
        """Close the socket safely."""
        # Is a no-op if the socket is already closed.
        if self._sock is None:
            return
        try:
            # Get the write lock, so we can be certain data sending
            # in another thread is sent.
            with self._lock:
                self._sock.shutdown(socket.SHUT_RDWR)
                self._sock.close()
        except socket.error:
            # Socket is already closed, just a no-op
            pass
        except Exception as error:
            # Paranoia
            log.warning('error closing socket; %s', error)
        finally:
            self._sock = None

    def _send_request(self):
        """Send the request over the wire."""
        self.write(self.websocket.build_request())

    def _check_poll(self, poll, session_time):
        """Check if it is time for a poll."""
        _time = session_time
        if self._poll_start is None or _time - self._poll_start >= poll:
            self._poll_start = _time
            return True
        else:
            return False

    def _check_auto_ping(self, ping_rate, session_time):
        """Check if a ping is required."""
        if ping_rate and session_time > self._next_ping:
            # Calculate next ping time that is in the future.
            self._next_ping = (
                math.ceil(session_time / ping_rate) * ping_rate
            )
            try:
                self.websocket.send_ping()
            except errors.WebSocketError:
                pass  # If the websocket has gone away

    def _check_ping_timeout(self, ping_timeout, session_time):
        """Check if the server is not responding to pings."""
        if ping_timeout:
            time_since_last_pong = session_time - self._last_pong
            if time_since_last_pong > ping_timeout:
                log.debug('ping_timeout time exceeded')
                return True
        return False

    def _check_close_timeout(self, close_timeout, session_time):
        """Check if the close timeout was tripped."""
        if close_timeout:
            sent_close_time = self.websocket.sent_close_time
            if sent_close_time is None:
                return
            if session_time >= sent_close_time + close_timeout:
                raise _ForceDisconnect(
                    "server didn't respond to close packet "
                    "within {}s".format(close_timeout)
                )

    def _recv(self, count):
        """Receive and return pending data from the socket."""
        if self._sock is None:
            return bytearray(b'')
        try:
            _recv_count = self._sock.recv_into(self._buffer, count)
            return memoryview(self._buffer)[:_recv_count]
        except socket.error as error:
            log.debug('error in _recv', exc_info=True)
            self._socket_fail('recv fail; {}', error)

    def _regular(self, poll, ping_rate, ping_timeout, close_timeout):
        """Run regularly to do polling / pings."""
        # Check for regularly running actions.
        if self._check_poll(poll, self.session_time):
            yield events.Poll()
        self._check_auto_ping(ping_rate, self.session_time)
        if self._check_ping_timeout(ping_timeout, self.session_time):
            yield events.Unresponsive()
            raise _ForceDisconnect(
                'exceeded {:.0f}s ping timeout'.format(ping_timeout)
            )
        self._check_close_timeout(close_timeout, self.session_time)

    def _send_pong(self, event):
        """Send a pong message in response to ping event."""
        try:
            self.websocket.send_pong(event.data)
        except errors.WebSocketError:
            # In case the websocket has gone away
            pass

    def _on_pong(self, event):
        """Record last pong time."""
        self._last_pong = self.session_time

    def _on_ready(self):
        """Called when a ready event is received."""
        self._last_pong = 0.0
        self._next_ping = 0.0
        self._start_time = time.time()

    def _on_event(self, event, auto_pong=True):
        """Handle logic in response to an event."""
        if event.name == 'ready':
            self._on_ready()
            self._ready = True
        elif event.name == 'ping':
            if auto_pong:
                self._send_pong(event)
        elif event.name == 'pong':
            self._on_pong(event)

    def run(self,
            poll=5,
            ping_rate=30,
            ping_timeout=None,
            auto_pong=True,
            close_timeout=None):
        """Run the websocket."""
        websocket = self.websocket
        url = websocket.url
        # Connecting event
        yield events.Connecting(url)

        # Create socket and connect to remote server
        try:
            sock, proxy = self._connect()
            self._sock = sock
        except _SocketFail as error:
            yield events.ConnectFail('{}'.format(error))
            return
        except Exception as error:
            log.error('error connecting to %s; %s', url, error)
            yield events.ConnectFail('{}'.format(error))
            return

        # We now have a socket.
        # Send the request.
        try:
            self._send_request()
        except errors.WebSocketError as error:
            self._close_socket()
            yield events.ConnectFail('request failed; {}'.format(error))
            return

        # Connected to the server, but not yet upgraded to websockets
        yield events.Connected(url, proxy=proxy)

        selector = self._selector_cls(sock)
        log.debug('%r created', selector)

        def _regular():
            """Run regular events if websocket is ready."""
            if self._ready:
                return self._regular(
                    poll, ping_rate, ping_timeout, close_timeout
                )
            return ()

        try:
            while not websocket.is_closed:
                readable, max_bytes = selector.wait(self.BUFFER_SIZE, poll)
                for event in _regular():
                    yield event
                if readable:
                    data = self._recv(max_bytes)
                    if data:
                        for event in self.websocket.feed(data):
                            self._on_event(event, auto_pong)
                            yield event
                            for event in _regular():
                                yield event
                    else:
                        if websocket.is_active:
                            self._socket_fail('connection lost')
                        break
        except _ForceDisconnect as error:
            self._close_socket()
            yield events.Disconnected('disconnected; {}'.format(error))
        except _SocketFail as error:
            # Session methods will translate socket errors to this
            # exception. The result is we are disconnected.
            self._close_socket()
            yield events.Disconnected('socket fail; {}'.format(error))
        except Exception as error:  # pragma: no cover
            # It pays to be paranoid.
            log.exception('error in websocket loop')
            self._close_socket()
            yield events.Disconnected('error; {}'.format(error))
        else:
            # The websocket instance terminated the loop, which means
            # it was a graceful exit.
            self._close_socket()
            yield events.Disconnected(graceful=True)
        finally:
            selector.close()
