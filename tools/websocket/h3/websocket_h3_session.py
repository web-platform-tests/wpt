# mypy: allow-untyped-defs

"""Connects one WebSocket-over-H3 stream to a pywebsocket3 handler.

aioquic gives this server WebSocket data as HTTP/3 DATA events. pywebsocket3
expects to read and write data through a socket-like object. This file provides
the small request, connection, and session objects that translate between those
two APIs.
"""

import asyncio
import logging
import os
import threading
from typing import BinaryIO, Dict, Optional, TYPE_CHECKING, Union

from pywebsocket3 import dispatch

from .headers import H3Headers

if TYPE_CHECKING:
    from .websocket_h3_server import WebSocketH3Protocol


_logger: logging.Logger = logging.getLogger(__name__)


_HeaderName = Union[str, bytes]
_HeaderValue = Union[str, bytes]


class _WebSocketH3Connection:
    """Connection object passed to pywebsocket3.

    pywebsocket3 expects request.connection to look like a mod_python
    connection. This object provides the socket-like fields it reads while the
    WebSocket/H3 stream is handled.
    """

    def __init__(
        self,
        protocol: "WebSocketH3Protocol",
        stream_id: int,
        rfile: BinaryIO,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self._protocol = protocol
        self._stream_id = stream_id
        self._rfile = rfile
        self._loop = loop
        self.remote_addr = ("unknown", 0)

    def read(self, length: int) -> bytes:
        return self._rfile.read(length)

    def write(self, data: bytes) -> None:
        future = asyncio.run_coroutine_threadsafe(
            self._async_write(data), self._loop)
        future.result(timeout=30)

    async def _async_write(self, data: bytes) -> None:
        if self._protocol._http is None:
            return
        self._protocol._http.send_data(
            stream_id=self._stream_id, data=data, end_stream=False)
        self._protocol.transmit()


class _WebSocketH3ResponseHeaders(Dict[_HeaderName, _HeaderValue]):
    """Mutable response headers populated by the H3 handshaker."""

    pass


class _WebSocketH3Request:
    """Request object passed to pywebsocket3.

    pywebsocket3 expects a mod_python-style request. This object provides the
    fields it reads during the WebSocket handshake, using values from the
    HTTP/3 CONNECT request.
    """

    def __init__(
        self,
        headers: H3Headers,
        connection: _WebSocketH3Connection,
    ) -> None:
        self.connection = connection
        self.protocol = "HTTP/3"
        self.uri = headers.get("path", "/")
        self.unparsed_uri = self.uri
        self.method = headers.get("method", "")
        self.headers_in = headers
        self.headers_out = _WebSocketH3ResponseHeaders()
        self._dispatcher: Optional[dispatch.Dispatcher] = None
        self._status = 0

    @property
    def status(self) -> int:
        return self._status

    @status.setter
    def status(self, value: int) -> None:
        self._status = value

    def is_https(self) -> bool:
        return True


class _WebSocketH3Session:
    """Bridge one H3 CONNECT stream to pywebsocket3's blocking API."""

    def __init__(
        self,
        protocol: "WebSocketH3Protocol",
        stream_id: int,
        headers: H3Headers,
        dispatcher: dispatch.Dispatcher,
        loop: asyncio.AbstractEventLoop,
        logger: Optional[logging.Logger] = None,
    ) -> None:
        self.stream_id = stream_id
        self._protocol = protocol
        self._dispatcher = dispatcher
        self._loop = loop
        self._logger = logger if logger is not None else _logger
        self._handler_thread: Optional[threading.Thread] = None

        rfd, wfd = os.pipe()
        self._rfile = os.fdopen(rfd, "rb")
        self._wfile = os.fdopen(wfd, "wb", 0)
        connection = _WebSocketH3Connection(
            protocol, stream_id, self._rfile, loop)
        self._request = _WebSocketH3Request(headers, connection)

    @property
    def request(self) -> _WebSocketH3Request:
        return self._request

    def start(self) -> None:
        self._handler_thread = threading.Thread(
            target=self._run_handler,
            name=f"ws-h3-handler-{self.stream_id}",
            daemon=True)
        self._handler_thread.start()

    def feed_data(self, data: bytes) -> None:
        try:
            self._wfile.write(data)
        except (OSError, ValueError):
            self._logger.debug("WebSocket/H3 stream %d pipe is closed",
                               self.stream_id)

    def close(self) -> None:
        self._close_files()

        if (self._handler_thread is not None and
                self._handler_thread is not threading.current_thread()):
            self._handler_thread.join(timeout=5)

    def _close_files(self) -> None:
        try:
            self._wfile.close()
        except (OSError, ValueError):
            pass

        try:
            self._rfile.close()
        except (OSError, ValueError):
            pass

    def _run_handler(self) -> None:
        try:
            self._dispatcher.transfer_data(self._request)  # type: ignore
        except Exception:
            self._logger.exception(
                "WebSocket/H3 handler failed for stream %d", self.stream_id)

        try:
            future = asyncio.run_coroutine_threadsafe(
                self._async_end_stream(), self._loop)
            future.result(timeout=5)
        except Exception:
            self._logger.debug("WebSocket/H3 stream %d was already closed",
                               self.stream_id)
        finally:
            self._close_files()
            self._loop.call_soon_threadsafe(self._remove_from_protocol)

    async def _async_end_stream(self) -> None:
        if self._protocol._http is None:
            return
        self._protocol._http.send_data(
            stream_id=self.stream_id, data=b"", end_stream=True)
        self._protocol.transmit()

    def _remove_from_protocol(self) -> None:
        if self._protocol._sessions.get(self.stream_id) is self:
            del self._protocol._sessions[self.stream_id]
