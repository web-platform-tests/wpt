# type: ignore

import asyncio
import importlib.util
import os
import socket
import ssl

import pytest

if importlib.util.find_spec("aioquic"):
    has_aioquic = True
    from aioquic.asyncio import QuicConnectionProtocol
    from aioquic.asyncio.client import connect
    from aioquic.h3.connection import H3_ALPN, FrameType, H3Connection
    from aioquic.h3.events import HeadersReceived, WebTransportStreamDataReceived
    from aioquic.quic.configuration import QuicConfiguration
    from aioquic.quic.events import QuicEvent, ProtocolNegotiated

    from .webtransport_h3_server import WebTransportH3Server
else:
    has_aioquic = False


here = os.path.dirname(__file__)


SERVER_HOST = "127.0.0.1"


def get_free_udp_port():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((SERVER_HOST, 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


if has_aioquic:

    class WebTransportClientProtocol(QuicConnectionProtocol):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._http = None
            self._session_id = None
            self._session_ready = None
            self._stream_data_received = None

        def quic_event_received(self, event: QuicEvent) -> None:
            if isinstance(event, ProtocolNegotiated):
                self._http = H3Connection(self._quic, enable_webtransport=True)

            if self._http is not None:
                for h3_event in self._http.handle_event(event):
                    self._h3_event_received(h3_event)

        def _h3_event_received(self, event):
            if isinstance(event, HeadersReceived):
                headers = dict(event.headers)
                if self._session_ready and not self._session_ready.done():
                    status = int(headers.get(b":status", b"0"))
                    self._session_ready.set_result(status)
            elif isinstance(event, WebTransportStreamDataReceived):
                if self._stream_data_received and not self._stream_data_received.done():
                    self._stream_data_received.set_result(
                        (event.data, event.stream_ended)
                    )

        async def connect_session(self, authority, path):
            assert self._http is not None
            loop = asyncio.get_event_loop()
            self._session_ready = loop.create_future()

            stream_id = self._quic.get_next_available_stream_id()
            self._session_id = stream_id
            self._http.send_headers(
                stream_id=stream_id,
                headers=[
                    (b":method", b"CONNECT"),
                    (b":scheme", b"https"),
                    (b":authority", authority.encode()),
                    (b":path", path.encode()),
                    (b":protocol", b"webtransport"),
                    (b"origin", b"https://localhost"),
                ],
            )
            self.transmit()

            return await asyncio.wait_for(self._session_ready, timeout=5.0)

        async def send_bidi_stream(self, data):
            assert self._http is not None
            assert self._session_id is not None
            loop = asyncio.get_event_loop()
            self._stream_data_received = loop.create_future()

            stream_id = self._http.create_webtransport_stream(
                self._session_id, is_unidirectional=False
            )
            # Workaround: aioquic doesn't register the stream for receiving
            # data after create_webtransport_stream (same issue as server
            # side in webtransport_h3_server.py create_bidirectional_stream).
            stream = self._http._get_or_create_stream(stream_id)
            stream.frame_type = FrameType.WEBTRANSPORT_STREAM
            stream.session_id = self._session_id
            self._quic.send_stream_data(stream_id, data, end_stream=True)
            self.transmit()

            return await asyncio.wait_for(self._stream_data_received, timeout=5.0)


@pytest.mark.skipif(not has_aioquic, reason="aioquic not installed")
class TestWebTransportH3Server:
    def setup_method(self):
        from tools import localpaths

        repo_root = localpaths.repo_root
        self.port = get_free_udp_port()
        self.server = WebTransportH3Server(
            host=SERVER_HOST,
            port=self.port,
            doc_root=os.path.join(here, "docroot"),
            cert_path=os.path.join(
                repo_root, "tools", "certs", "web-platform.test.pem"
            ),
            key_path=os.path.join(repo_root, "tools", "certs", "web-platform.test.key"),
            logger=None,
        )
        self.server.start()

    def teardown_method(self):
        self.server.stop()

    def test_session_establishment(self):
        async def run():
            configuration = QuicConfiguration(
                alpn_protocols=H3_ALPN,
                is_client=True,
                verify_mode=ssl.CERT_NONE,
            )
            async with connect(
                SERVER_HOST,
                self.port,
                configuration=configuration,
                create_protocol=WebTransportClientProtocol,
            ) as protocol:
                authority = f"{SERVER_HOST}:{self.port}"
                status = await protocol.connect_session(authority, "/echo.py")
                assert status == 200

        asyncio.run(run())

    def test_bidi_stream_echo(self):
        async def run():
            configuration = QuicConfiguration(
                alpn_protocols=H3_ALPN,
                is_client=True,
                verify_mode=ssl.CERT_NONE,
            )
            async with connect(
                SERVER_HOST,
                self.port,
                configuration=configuration,
                create_protocol=WebTransportClientProtocol,
            ) as protocol:
                authority = f"{SERVER_HOST}:{self.port}"
                status = await protocol.connect_session(authority, "/echo.py")
                assert status == 200
                data, stream_ended = await protocol.send_bidi_stream(b"hello")
                assert data == b"hello"
                assert stream_ended is True

        asyncio.run(run())
