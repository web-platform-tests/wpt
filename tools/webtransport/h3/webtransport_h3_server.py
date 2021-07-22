import asyncio
import logging
import os
import signal
import sys
import traceback
from urllib.parse import urlparse
from typing import Any, Dict, List, Optional, Tuple, Set

from aioquic.asyncio import QuicConnectionProtocol, serve
from aioquic.h3.connection import H3_ALPN, H3Connection
from aioquic.h3.events import H3Event, HeadersReceived, WebTransportStreamDataReceived, DatagramReceived
from aioquic.quic.configuration import QuicConfiguration
from aioquic.quic.connection import stream_is_unidirectional
from aioquic.quic.events import QuicEvent, ProtocolNegotiated, StreamDataReceived, StreamReset
from aioquic.tls import SessionTicket
from aioquic.quic.packet import QuicErrorCode

SERVER_NAME = 'webtransport-h3-server'
logger = logging.getLogger(__name__)

handlers_path = ''


class WebTransportH3Protocol(QuicConnectionProtocol):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._handler: Optional[EventHandler] = None
        self._http: Optional[H3Connection] = None

        self._bidirectional_streams: Set[int] = set()

        def handle_signal(*_):
            self.close()
            sys.exit(0)
        signal.signal(signal.SIGTERM, handle_signal)
        signal.signal(signal.SIGINT, handle_signal)

    def quic_event_received(self, event: QuicEvent) -> None:
        if isinstance(event, ProtocolNegotiated):
            self._http = H3Connection(self._quic, enable_webtransport=True)

        # TODO(bashi): Remove this once aioquic fixes a bug.
        if isinstance(event, StreamDataReceived):
            if event.stream_id in self._bidirectional_streams:
                self._handler.stream_data_received(
                    stream_id=event.stream_id, data=event.data, stream_ended=event.end_stream)

        if self._http is not None:
            for http_event in self._http.handle_event(event):
                self._h3_event_received(http_event)

    def _h3_event_received(self, event: H3Event) -> None:
        if isinstance(event, HeadersReceived):
            # Convert from List[Tuple[bytes, bytes]] to Dict[bytes, bytes]
            headers = {}
            for header, value in event.headers:
                headers[header] = value

            method = headers.get(b":method")
            protocol = headers.get(b":protocol")
            if method == b"CONNECT" and protocol == b"webtransport":
                self._handshake_webtransport(event.stream_id, headers)
            else:
                self._send_error_response(event.stream_id, 400)
        elif isinstance(event, WebTransportStreamDataReceived):
            self._handler.stream_data_received(
                stream_id=event.stream_id, data=event.data, stream_ended=event.stream_ended)
        elif isinstance(event, DatagramReceived):
            self._handler.datagram_received(data=event.data)

    def _send_error_response(self, stream_id: int, status_code: int) -> None:
        headers = [
            (b"server", SERVER_NAME.encode()),
            (b":status", str(status_code).encode())]
        self._http.send_headers(
            stream_id=stream_id, headers=headers, end_stream=True)

    def _handshake_webtransport(self, stream_id: int, request_headers: Dict[bytes, bytes]) -> None:
        authority = request_headers.get(b":authority")
        path = request_headers.get(b":path")
        if authority is None or path is None:
            # `:authority` and `:path` must be provided.
            self._send_error_response(stream_id, 400)
            return

        # Create a handler using `:path`.
        try:
            self._handler = self._create_event_handler(
                session_id=stream_id, path=path, request_headers=request_headers)
        except IOError:
            self._send_error_response(stream_id, 404)
            return

        response_headers = [
            (b"server", SERVER_NAME.encode()),
        ]
        self._handler.connect_received(
            path=path, response_headers=response_headers)

        status = any(
            header[0] == b":status" for header in response_headers)
        if not status:
            response_headers.append((b":status", b"200"))
        self._http.send_headers(
            stream_id=stream_id, headers=response_headers)

        self._handler.session_established()

    def _create_event_handler(self, session_id: int, path: bytes, request_headers: Dict[bytes, bytes]):
        parsed = urlparse(path.decode())
        file_path = os.path.join(handlers_path, parsed.path.lstrip('/'))
        callbacks = {"__file__": file_path}
        with open(file_path) as f:
            exec(compile(f.read(), path, "exec"), callbacks)
        session = WebTransportSession(self, session_id, request_headers)
        return EventHandler(session, callbacks)


class WebTransportSession(object):
    """
    A WebTransport session.
    """

    def __init__(self, protocol: WebTransportH3Protocol, session_id: int, request_headers: Dict[bytes, bytes]) -> None:
        self.session_id = session_id
        self.request_headers = request_headers

        self._protocol: WebTransportH3Protocol = protocol
        self._http: H3Connection = protocol._http

    def stream_is_unidirectional(self, stream_id: int) -> bool:
        """Returns True if the stream is unidirectional."""
        return stream_is_unidirectional(stream_id)

    def close(self, error_code: int = QuicErrorCode.NO_ERROR) -> None:
        """
        Close the session.

        :param error_code: An error code indicating why the session is
                           being closed.
        """
        self._http._quic.close(error_code=error_code)

    def create_unidirectional_stream(self) -> int:
        """
        Create a unidirectional WebTransport stream and return the stream ID.
        """
        return self._http.create_webtransport_stream(session_id=self.session_id, is_unidirectional=True)

    def create_bidirectional_stream(self) -> int:
        """
        Create a bidirectional WebTransport stream and return the stream ID.
        """
        stream_id = self._http.create_webtransport_stream(
            session_id=self.session_id, is_unidirectional=False)
        self._protocol._bidirectional_streams.add(stream_id)
        return stream_id

    def send_stream_data(self, stream_id: int, data: bytes, end_stream: bool = False) -> None:
        """
        Send data on the specific stream.

        :param stream_id: The stream ID on which to send the data.
        :param data: The data to send.
        :param end_stream: If set to True, the stream will be closed.
        """
        self._http._quic.send_stream_data(
            stream_id=stream_id, data=data, end_stream=end_stream)

    def send_datagram(self, data: bytes) -> None:
        """
        Send data using a datagram frame.

        :param data: The data to send.
        """
        self._http.send_datagram(flow_id=self.session_id, data=data)


class EventHandler(object):
    def __init__(self, session: WebTransportSession, callbacks: Dict[str, Any]) -> None:
        self._session = session
        self._callbacks = callbacks

    def _run_callback(self, callback_name: str, *args, **kwargs) -> None:
        if callback_name not in self._callbacks:
            return
        try:
            self._callbacks[callback_name](*args, **kwargs)
        except Exception as e:
            logger.warn(str(e))
            traceback.print_exc()

    def connect_received(self, path: str, response_headers: List[Tuple[bytes, bytes]]) -> None:
        self._run_callback("connect_received", path, response_headers)

    def session_established(self) -> None:
        self._run_callback("session_established", self._session)

    def stream_data_received(self, stream_id: int, data: bytes, stream_ended: bool) -> None:
        self._run_callback("stream_data_received",
                           self._session, stream_id, data, stream_ended)

    def datagram_received(self, data: bytes) -> None:
        self._run_callback("datagram_received",
                           self._session, data)


class SessionTicketStore:
    """
    Simple in-memory store for session tickets.
    """

    def __init__(self) -> None:
        self.tickets: Dict[bytes, SessionTicket] = {}

    def add(self, ticket: SessionTicket) -> None:
        self.tickets[ticket.ticket] = ticket

    def pop(self, label: bytes) -> Optional[SessionTicket]:
        return self.tickets.pop(label, None)


def start(**kwargs: Any) -> None:
    configuration = QuicConfiguration(
        alpn_protocols=H3_ALPN,
        is_client=False,
        max_datagram_frame_size=65536,
    )

    global handlers_path
    handlers_path = os.path.abspath(os.path.expanduser(
        kwargs['handlers_path']))
    logger.info('port = %s', kwargs['port'])
    logger.info('handlers path = %s', handlers_path)

    # load SSL certificate and key
    configuration.load_cert_chain(kwargs['certificate'], kwargs['private_key'])

    ticket_store = SessionTicketStore()

    loop = asyncio.get_event_loop()
    loop.run_until_complete(
        serve(
            kwargs['host'],
            kwargs['port'],
            configuration=configuration,
            create_protocol=WebTransportH3Protocol,
            session_ticket_fetcher=ticket_store.pop,
            session_ticket_handler=ticket_store.add,
        )
    )
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
