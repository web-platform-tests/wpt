from base64 import b64decode
import logging

import pytest
from lomond import constants
from lomond.errors import ProtocolError, HandshakeError
from lomond.events import Binary, Closed, Ping, Pong, Ready, Text
from lomond.message import Close
from lomond.opcode import Opcode
from lomond.response import Response
from lomond.session import WebsocketSession
from lomond.stream import WebsocketStream
from lomond.websocket import WebSocket


class FakeSession(object):
    def __init__(self, *args, **kwargs):
        self.socket_buffer = []
        self.run_called = False
        self._t = 0.0

    def run(self, *args, **kwargs):
        self.run_called = True

    def send(self, opcode, bytes):
        self.socket_buffer.append((opcode, bytes))

    @property
    def session_time(self):
        _t = self._t
        self._t += 1.0
        return _t

    def close(self):
        pass

    def force_disconnect(self):
        pass


@pytest.fixture
def websocket(monkeypatch):
    monkeypatch.setattr(
        'os.urandom', lambda len: b'\x00' * len)

    ws = WebSocket('ws://example.com')
    return ws


@pytest.fixture
def websocket_with_fake_session(monkeypatch):
    monkeypatch.setattr(
        'os.urandom', lambda len: b'\x00' * len)

    ws = WebSocket('ws://example.com')
    ws.state.session = FakeSession()
    return ws


def generate_data(*frames):
    payload = [
        b'HTTP/1.1 101 Switching Protocols\r\n',
        b'Upgrade: websocket\r\n',
        b'Connection: Upgrade\r\n',
        b'User-Agent: Test\r\n',
        b'Sec-WebSocket-Key: AAAAAAAAAAAAAAAAAAAAAA==\r\n',
        b'Sec-WebSocket-Accept: icx+yqv66kxgm0fcwalwlflwtai=\r\n',
        b'\r\n'
    ]
    payload.extend(frames)

    return b''.join(payload)


def test_init(websocket):
    assert isinstance(websocket, WebSocket)
    assert isinstance(websocket.state, WebSocket.State)
    assert websocket.resource == '/'
    assert len(b64decode(websocket.key)) == 16
    assert websocket.session is None
    assert isinstance(websocket.stream, WebsocketStream)


def test_init_with_query():
    ws = WebSocket('ws://example.com/resource?query')
    assert ws.resource == '/resource?query'


def test_repr(websocket):
    assert repr(websocket) == "WebSocket('ws://example.com')"


def test_is_secure(websocket):
    assert websocket.is_secure is False
    assert WebSocket('wss://example.com').is_secure is True


def test_build_request(websocket):
    assert websocket.build_request() == (
        b'GET / HTTP/1.1\r\n'
        b'Host: example.com:80\r\n'
        b'Upgrade: websocket\r\n'
        b'Connection: Upgrade\r\n'
        b'Sec-WebSocket-Key: AAAAAAAAAAAAAAAAAAAAAA==\r\n'
        #                    ^^^^^^^^^^^^^^^^^^^^^^^^
        #                     b64encode('\x00' * 16)
        b'Sec-WebSocket-Version: 13\r\n'
        b'User-Agent: ' + constants.USER_AGENT.encode('utf-8') + b'\r\n'
        b'\r\n'
    )


def test_build_request_custom_headers(websocket):
    with pytest.raises(TypeError):
        websocket.add_header(1, 2)
    with pytest.raises(TypeError):
        websocket.add_header(b'foo', 2)
    websocket.add_header(b'foo', b'bar')
    assert websocket.build_request() == (
        b'GET / HTTP/1.1\r\n'
        b'foo: bar\r\n'
        b'Host: example.com:80\r\n'
        b'Upgrade: websocket\r\n'
        b'Connection: Upgrade\r\n'
        b'Sec-WebSocket-Key: AAAAAAAAAAAAAAAAAAAAAA==\r\n'
        #                    ^^^^^^^^^^^^^^^^^^^^^^^^
        #                     b64encode('\x00' * 16)
        b'Sec-WebSocket-Version: 13\r\n'
        b'User-Agent: ' + constants.USER_AGENT.encode('utf-8') + b'\r\n'
        b'\r\n'
    )


def test_protocol_header_is_optional(websocket):
    request_headers = websocket.build_request()
    assert b'Sec-WebSocket-Protocol' not in request_headers

    websocket_with_protocols = WebSocket(
        'ws://example.com/', protocols=('proto1', 'proto2')
    )
    request_headers = websocket_with_protocols.build_request()
    assert b'Sec-WebSocket-Protocol: proto1, proto2' in request_headers


def test_connect(websocket_with_fake_session):
    websocket = websocket_with_fake_session
    websocket.connect(session_class=FakeSession)
    # this test uses monkey patched run() function call, and the attribute
    # which simulates that run() was called is only present in this particular
    # class, so it's worth to make sure that we are not actually using a real
    # Session object.
    assert isinstance(websocket.session, FakeSession)
    assert websocket.session.run_called


def test_calling_close_sets_is_closing_flag(websocket_with_fake_session):
    ws = websocket_with_fake_session
    ws.close()
    assert ws.is_closing is True


def test_close(websocket_with_fake_session):
    ws = websocket_with_fake_session
    assert ws.is_closing is False

    data = generate_data(
        b'\x88\x00'
    )

    # we call the list to actually run the generator
    list(ws.feed(data))

    assert ws.is_closing is True


@pytest.mark.parametrize('payload, expected', [
    (b'\x89\x00', Ping),
    (b'\x8a\x00', Pong),
    (b'\x82\x03foo', Binary),
    (b'\x81\x03foo', Text)
])
def test_regular_message(websocket_with_fake_session, payload, expected):
    ws = websocket_with_fake_session

    data = generate_data(payload)

    events = list(ws.feed(data))

    assert len(events) == 2
    assert isinstance(events[0], Ready)
    assert isinstance(events[1], expected)


def test_send_json_invalid():
    ws = WebSocket('ws://example.com/resource?query')
    with pytest.raises(ValueError):
        ws.send_json('foo', baz='egg')


def test_close_with_reserved_code(websocket):
    reserved_message = Close(code=1005, reason='reserved-close-code')
    with pytest.raises(ProtocolError):
        next(websocket._on_close(reserved_message))


@pytest.mark.parametrize('method_name, payload, expected_buffer', [
    ('send_pong', b'PONG', [(Opcode.PONG, b'PONG')]),
    ('send_ping', b'PING', [(Opcode.PING, b'PING')]),
    ('send_binary', b'BIN', [(Opcode.BINARY, b'BIN')]),
    ('send_text', u'TEXT', [(Opcode.TEXT, b'TEXT')]),
    ('send_json', {}, [(Opcode.TEXT, b'{}')])
])
def test_send_methods_functionalities(
        websocket_with_fake_session, method_name, payload, expected_buffer):
    ws = websocket_with_fake_session
    method = getattr(ws, method_name)
    method(payload)
    assert ws.state.session.socket_buffer == expected_buffer


@pytest.mark.parametrize(
    (
        'method_name, payload, expected_exception_class, '
        'expected_exception_string'
    ),
    [
        ("send_pong", u"PONG", TypeError, "data argument must be bytes"),
        ("send_ping", u"PING", TypeError, "data argument must be bytes"),
        ("send_binary", u"BIN", TypeError, "data argument must be bytes"),
        ("send_text", b"BIN", TypeError, "text argument must not be bytes"),
        (
            "send_pong", b'PONG' * 32, ValueError,
            "pong data should be <= 125 bytes"
        ),
        (
            "send_ping", b'PING' * 32, ValueError,
            "ping data should be <= 125 bytes"
        ),
    ]
)
def test_send_methods_parameters_validation(
        websocket_with_fake_session, method_name, payload,
        expected_exception_class, expected_exception_string):
    ws = websocket_with_fake_session
    method = getattr(ws, method_name)

    with pytest.raises(expected_exception_class) as e:
        method(payload)

    assert str(e.value) == expected_exception_string


def test_send_close_needs_open_socket(websocket):
    session = WebsocketSession(websocket)
    websocket.state.session = session
    assert not websocket._send_close(0, 'bye')


def test_calling_close_yields_close_event(websocket_with_fake_session):
    ws = websocket_with_fake_session
    assert ws.is_active is True
    ws.close()
    close_message = Close(1000, b'bye')
    close_events = list(ws._on_close(close_message))
    assert len(close_events) == 1
    assert isinstance(close_events[0], Closed)
    assert ws.is_closed is True
    assert ws.is_closing is False
    assert ws.is_active is False


def test_calling_on_close_when_websocket_is_closed_results_in_noop(
        websocket_with_fake_session):

    ws = websocket_with_fake_session
    ws.close()
    assert ws.is_closing is True
    assert ws.is_closed is False
    close_message = Close(1000, b'bye')
    list(ws._on_close(close_message))
    assert ws.is_closed is True
    assert ws.is_closing is False
    assert len(list(ws._on_close(close_message))) == 0


@pytest.mark.parametrize('payload, expected_error', [
    (b'', 'Websocket upgrade failed (code=None)'),
    (b'HTTP/1.1 200 OK', 'Websocket upgrade failed (code=200)'),
    (b'HTTP/1.1 101 Switching protocols', "Can't upgrade to <header missing>"),
    (b'HTTP/1.1 101 Switching protocols\r\nUpgrade: 1', "Can't upgrade to 1"),
    (
        (
            b'HTTP/1.1 101 Switching protocols\r\n'
            b'Upgrade: websocket\r\n'
        ),
        "No Sec-WebSocket-Accept header"
    ),
    (
        (
            b'HTTP/1.1 101 Switching protocols\r\n'
            b'Upgrade: websocket\r\n'
            b'Sec-WebSocket-Accept: AA='
        ),
        "Sec-WebSocket-Accept challenge failed"
    )
])
def test_calling_on_response_with_invalid_response_headers(
        websocket, payload, expected_error):
    response = Response(payload)
    with pytest.raises(HandshakeError) as e:
        websocket.on_response(response)

    assert str(e.value) == expected_error


def test_calling_feed_on_closed_websocket_results_in_noop(websocket, mocker):
    websocket.state.closed = True
    mocker.spy(websocket.stream, 'feed')
    list(websocket.feed(b''))
    assert websocket.stream.feed.call_count == 0


@pytest.mark.parametrize('input_data, expected_log', [
    # the way for stream.feed to raise CriticalProtocolError is to push invalid
    # utf-8 code to parse. I have found an example list of utf-8 bytes here:
    # http://stackoverflow.com/questions/1301402/example-invalid-utf8-string
    # which linked to this document:
    # http://www.cl.cam.ac.uk/~mgk25/ucs/examples/UTF-8-test.txt
    # which states that a last possible sequence of bytes (for 1-byte utf-8) is
    # \x7f. Therefore we're passing \x8f to force this utf-8 invalid sequence
    # error
    (b'\x81\x01\x8f', 'critical protocol error; invalid utf8'),
    # here we're passing an invalid initial frame. 0x80 means that the 4 least
    # significant bits are set to 0, which means opcode=CONTINUATION, however
    # because this is an initial frame, there is nothing to continue; thus we
    # are expecting the stream to throw an error here
    (
        b'\x80\x01\x00',
        'protocol error; continuation frame has nothing to continue'
    )
])
def test_stream_feed_raising_exceptions(
        websocket_with_fake_session, caplog, input_data, expected_log):
    ws = websocket_with_fake_session
    with caplog.at_level(logging.DEBUG):
        data = generate_data(input_data)
        list(ws.feed(data))
        assert caplog.record_tuples[-1] == (
            'lomond', logging.DEBUG, expected_log
        )


def test_generator_exit(websocket_with_fake_session, caplog):
    # http://stackoverflow.com/questions/30862196/generatorexit-in-python-generator
    #
    # caplog stants for capture-log - we can't change the name of this fixture
    # as it is pytest plugin for capturing logging library output
    data = b'\x81\x01\xf7\x81\x01\x7f'
    ws = websocket_with_fake_session
    with caplog.at_level(logging.DEBUG):
        data = generate_data(data)
        _generator_object = ws.feed(data)
        next(_generator_object)
        del _generator_object
        assert caplog.record_tuples[-1] == (
            'lomond', logging.WARNING, 'disconnecting websocket'
        )


def test_calling_close_on_closed_websocket_results_in_noop(websocket, caplog):
    with caplog.at_level(logging.DEBUG):
        websocket.state.closed = True
        websocket.close(0, b'bye')
        assert caplog.record_tuples[-1] == (
            'lomond', logging.DEBUG,
            "WebSocket('ws://example.com') already closed"
        )


def test_closing_websocket_between_frames_iterations(websocket):
    data = generate_data(b'\x81\x01\xf7\x81\x01\x7f')
    _generator_object = websocket.feed(data)
    next(_generator_object)
    websocket.state.closed = True
    with pytest.raises(StopIteration):
        next(_generator_object)


def test_yielding_events_from_on_close(websocket):
    data = generate_data(b'\x88\x00')
    websocket.state.closing = True
    events = list(websocket.feed(data))
    assert len(events) == 2
    assert isinstance(events[1], Closed)
