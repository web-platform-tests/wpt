# mypy: allow-untyped-defs

import importlib.util
import unittest
from io import BytesIO
from types import SimpleNamespace
from unittest import mock

import pytest


if importlib.util.find_spec('aioquic'):
    has_aioquic = True
    from aioquic.h3.connection import H3Connection
    from aioquic.quic.events import ConnectionTerminated
    from aioquic.quic.events import StreamReset

    from .. import h3_wptserve_adapter
    from .. import websocket_h3_server
    from .. import websocket_h3_session
else:
    has_aioquic = False


class _FakeH3:
    def __init__(self):
        self.headers = []
        self.data = []

    def send_headers(self, stream_id, headers, end_stream):
        self.headers.append((stream_id, headers, end_stream))

    def send_data(self, stream_id, data, end_stream):
        self.data.append((stream_id, data, end_stream))


class _FakeProtocol:
    def __init__(self):
        self._http = _FakeH3()
        self._sessions = {}
        self.transmits = 0

    def transmit(self):
        self.transmits += 1


def _make_headers_event(stream_id, method, protocol=None):
    headers = [(b':method', method)]
    if protocol is not None:
        headers.append((b':protocol', protocol))
    return SimpleNamespace(stream_id=stream_id, headers=headers)


def _make_websocket_connect_event():
    return SimpleNamespace(
        stream_id=7,
        headers=[
            (b':method', b'CONNECT'),
            (b':protocol', b'websocket'),
            (b':authority', b'web-platform.test:11001'),
            (b':path', b'/echo'),
            (b'sec-websocket-version', b'13'),
        ])


def _make_websocket_h3_protocol():
    return object.__new__(websocket_h3_server.WebSocketH3Protocol)


def _make_protocol_for_websocket_connect():
    protocol = _make_websocket_h3_protocol()
    protocol._http = _FakeH3()
    protocol._sessions = {}
    protocol._ws_doc_root = ''
    protocol._logger = mock.Mock()
    protocol.transmit = mock.Mock()
    return protocol


def _make_mock_websocket_session():
    return SimpleNamespace(feed_data=mock.Mock(), close=mock.Mock())


class WebSocketH3ServerTest(unittest.TestCase):
    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_local_settings_enable_extended_connect(self):
        """The H3 connection advertises support for WebSocket CONNECT streams."""
        connection = object.__new__(
            websocket_h3_server.H3ConnectionForWebSocket)

        with mock.patch.object(H3Connection, '_get_local_settings',
                               return_value={}):
            settings = (
                websocket_h3_server.H3ConnectionForWebSocket
                ._get_local_settings(connection))

        self.assertEqual(
            settings[
                websocket_h3_server
                .H3ConnectionForWebSocket.ENABLE_CONNECT_PROTOCOL],
            1)

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_response_writer_sends_h3_headers_and_data(self):
        """The wptserve response writer sends response headers and body as H3."""
        protocol = _FakeProtocol()
        handler = SimpleNamespace(h3_protocol=protocol, h3_stream_id=3)
        request = SimpleNamespace(method='GET')
        response = SimpleNamespace(request=request, encoding='utf8')
        writer = h3_wptserve_adapter.H3ResponseWriter(handler, response)

        writer.write_headers([
            ('Content-Type', 'text/plain'),
            ('connection', 'keep-alive'),
        ], 200)
        writer.write_data(BytesIO(b'payload'), last=True)

        self.assertEqual(protocol._http.headers, [(
            3,
            [(b':status', b'200'), (b'content-type', b'text/plain')],
            False,
        )])
        self.assertEqual(protocol._http.data, [(3, b'payload', True)])

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_websocket_connect_sends_handshake_response(self):
        """A WebSocket CONNECT request sends the handshake response and starts."""
        protocol = _make_protocol_for_websocket_connect()
        dispatcher = SimpleNamespace(get_handler_suite=lambda path: object())

        class FakeHandshaker:
            def __init__(self, request, dispatcher):
                self.request = request

            def do_handshake(self):
                self.request.status = 200
                self.request.headers_out['sec-websocket-protocol'] = 'chat'

        with mock.patch.object(websocket_h3_server.dispatch, 'Dispatcher',
                               return_value=dispatcher), \
             mock.patch.object(websocket_h3_server.asyncio,
                               'get_running_loop',
                               return_value=mock.Mock()), \
             mock.patch.object(websocket_h3_server, 'WsH3Handshaker',
                               FakeHandshaker), \
             mock.patch.object(
                 websocket_h3_session._WebSocketH3Session, 'start') as start:
            websocket_h3_server.WebSocketH3Protocol._handle_websocket_connect(
                protocol, _make_websocket_connect_event())

        self.assertEqual(protocol._http.headers, [(
            7,
            [
                (b':status', b'200'),
                (b'server', b'websocket-h3-server'),
                (b'sec-websocket-protocol', b'chat'),
            ],
            False,
        )])
        self.assertIn(7, protocol._sessions)
        start.assert_called_once_with()
        protocol._sessions[7].close()

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_websocket_connect_without_handler_returns_404(self):
        """A WebSocket CONNECT request without a handler returns 404."""
        protocol = _make_protocol_for_websocket_connect()
        dispatcher = SimpleNamespace(get_handler_suite=lambda path: None)

        with mock.patch.object(websocket_h3_server.dispatch, 'Dispatcher',
                               return_value=dispatcher):
            websocket_h3_server.WebSocketH3Protocol._handle_websocket_connect(
                protocol, _make_websocket_connect_event())

        self.assertEqual(protocol._http.headers, [(
            7,
            [
                (b':status', b'404'),
                (b'server', b'websocket-h3-server'),
            ],
            True,
        )])
        protocol.transmit.assert_called_once_with()

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_request_headers_are_routed_by_method_and_protocol(self):
        """Request headers select the WebSocket, HTTP, or error path."""
        protocol = _make_websocket_h3_protocol()
        protocol._handle_websocket_connect = mock.Mock()
        protocol._handle_request = mock.Mock()
        protocol._send_error = mock.Mock()

        websocket_event = _make_headers_event(1, b'CONNECT', b'websocket')
        get_event = _make_headers_event(2, b'GET')
        head_event = _make_headers_event(3, b'HEAD')
        connect_event = _make_headers_event(4, b'CONNECT', b'other')
        post_event = _make_headers_event(5, b'POST')

        for event in (
                websocket_event,
                get_event,
                head_event,
                connect_event,
                post_event):
            websocket_h3_server.WebSocketH3Protocol._handle_headers(
                protocol, event)

        protocol._handle_websocket_connect.assert_called_once_with(
            websocket_event)
        protocol._handle_request.assert_has_calls([
            mock.call(get_event),
            mock.call(head_event),
        ])
        self.assertEqual(protocol._send_error.mock_calls, [
            mock.call(4, 501),
            mock.call(5, 405),
        ])

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_stream_reset_and_connection_termination_close_sessions(self):
        """Stream reset closes one session; connection termination closes all."""
        protocol = _make_websocket_h3_protocol()
        protocol._http = SimpleNamespace(
            handle_event=mock.Mock(return_value=[]))
        reset_session = _make_mock_websocket_session()
        first_remaining_session = _make_mock_websocket_session()
        second_remaining_session = _make_mock_websocket_session()
        protocol._sessions = {
            1: reset_session,
            3: first_remaining_session,
            5: second_remaining_session,
        }

        websocket_h3_server.WebSocketH3Protocol.quic_event_received(
            protocol, StreamReset(error_code=0, stream_id=1))

        reset_session.close.assert_called_once_with()
        first_remaining_session.close.assert_not_called()
        second_remaining_session.close.assert_not_called()
        self.assertEqual(protocol._sessions, {
            3: first_remaining_session,
            5: second_remaining_session,
        })

        websocket_h3_server.WebSocketH3Protocol.quic_event_received(
            protocol,
            ConnectionTerminated(
                error_code=0, frame_type=None, reason_phrase=''))

        first_remaining_session.close.assert_called_once_with()
        second_remaining_session.close.assert_called_once_with()
        self.assertEqual(protocol._sessions, {})

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_multiple_websocket_streams_are_tracked_independently(self):
        """H3 DATA is delivered only to the session for the matching stream."""
        protocol = _make_websocket_h3_protocol()
        first_session = _make_mock_websocket_session()
        second_session = _make_mock_websocket_session()
        protocol._sessions = {
            1: first_session,
            3: second_session,
        }

        websocket_h3_server.WebSocketH3Protocol._handle_data(
            protocol,
            SimpleNamespace(stream_id=3, data=b'frame', stream_ended=False))

        first_session.feed_data.assert_not_called()
        second_session.feed_data.assert_called_once_with(b'frame')
        first_session.close.assert_not_called()
        second_session.close.assert_not_called()
        self.assertEqual(protocol._sessions, {
            1: first_session,
            3: second_session,
        })

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_websocket_data_is_forwarded_to_session(self):
        """Incoming H3 DATA is forwarded to the matching WebSocket session."""
        protocol = _make_websocket_h3_protocol()
        session = _make_mock_websocket_session()
        protocol._sessions = {7: session}

        websocket_h3_server.WebSocketH3Protocol._handle_data(
            protocol,
            SimpleNamespace(stream_id=7, data=b'frame', stream_ended=True))
        session.feed_data.assert_called_once_with(b'frame')
        session.close.assert_called_once_with()
        self.assertEqual(protocol._sessions, {})

    @pytest.mark.skipif(not has_aioquic, reason='not having aioquic')
    def test_start_surfaces_startup_errors(self):
        """Server startup raises certificate loading errors to the caller."""
        server = websocket_h3_server.WebSocketH3Server(
            host='127.0.0.1',
            port=0,
            ws_doc_root='',
            cert_path='missing-cert.pem',
            key_path='missing-key.pem',
            logger=mock.Mock())

        with self.assertRaises(OSError):
            server.start()

        self.assertFalse(server.started)
        self.assertIsNotNone(server.server_thread)
        self.assertFalse(server.server_thread.is_alive())


if __name__ == '__main__':
    unittest.main()
