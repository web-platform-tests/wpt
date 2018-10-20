import socket

import pytest
from freezegun import freeze_time
from lomond import errors, events
from lomond import constants
from lomond.session import WebsocketSession, _ForceDisconnect, _SocketFail
from lomond.websocket import WebSocket


@pytest.fixture()
def session(monkeypatch):
    monkeypatch.setattr(
        'os.urandom', b'\xaa'.__mul__
    )
    # ^^ the above line will be significant in the test where we want
    # to validate the headers being sent to the socket. Namely, the
    # websocket key which is based on os.urandom. Obviously, we can't
    # have an actual random call here because the test wouldn't be
    # deterministic, hence this sequence of bytes.

    return WebsocketSession(WebSocket('wss://example.com/'))


class FakeSocket(object):
    def __init__(self, *args, **kwargs):
        self.buffer = b''
        self._sendall = kwargs.get('sendall', None)

    def setsockopt(self, *args):
        pass

    def settimeout(self, *args):
        pass

    def connect(self, *args):
        raise socket.error('fail')

    def fileno(self):
        return 999

    def recv(self, *args, **kwargs):
        raise socket.error('fail')

    def recv_into(self, *args, **kwargs):
        raise socket.error('fail')

    def shutdown(self, *args, **kwargs):
        pass

    def close(self):
        return

    def sendall(self, data):
        self.buffer += data
        if callable(self._sendall):
            self._sendall(data)

    def pending(self):
        return 0


class FakeWebSocket(object):

    sent_close_time = -100

    def send_pong(self, data):
        raise errors.WebSocketClosed('sorry')


class FakeSelector(object):
    def __init__(self, socket):
        pass

    def wait(self, max_bytes, timeout):
        return True, max_bytes

    def wait_readable(self, timeout):
        return True

    def close(self):
        pass


class FakeBrokenSelector(object):
    def __init__(self, socket):
        pass

    def wait_readable(self, timeout):
        raise IOError('broke')

    def close(self):
        pass


def test_write_without_sock_fails(session):
    with pytest.raises(errors.WebSocketUnavailable) as e:
        session.write(b'\x01')

    assert str(e.value) == 'not connected'


def test_write_with_closed_websocket_fails(session):
    session.websocket.state.closed = True
    session._sock = FakeSocket()
    with pytest.raises(errors.WebSocketClosed) as e:
        session.write(b'\x01')
    assert str(e.value) == 'data not sent'


def test_write_with_closing_websocket_fails(session):
    session.websocket.state.closing = True
    session._sock = FakeSocket()
    with pytest.raises(errors.WebSocketClosing) as e:
        session.write(b'\x01')
    assert str(e.value) == 'data not sent'


def test_socket_error_propagates(session):
    def sendall(data):
        raise socket.error('just testing errors')

    session._sock = FakeSocket()
    session._sock.sendall = sendall
    with pytest.raises(errors.TransportFail) as e:
        session.write(b'\x01')

    assert str(e.value) == 'socket fail; just testing errors'


def test_non_network_error_propagates(session):
    def sendall(data):
        raise ValueError('some random exception')

    session._sock = FakeSocket()
    session._sock.sendall = sendall

    with pytest.raises(errors.TransportFail) as e:
        session.write(b'\x01')

    assert str(e.value) == 'socket error; some random exception'


def test_repr(session):
    assert repr(session) == "<ws-session 'wss://example.com/'>"


def test_close_socket(session, mocker):
    session._sock = FakeSocket()

    mocker.spy(FakeSocket, 'shutdown')
    mocker.spy(FakeSocket, 'close')

    session._close_socket()

    assert FakeSocket.shutdown.call_count == 1
    assert FakeSocket.close.call_count == 1


def test_send_request(session):
    session._sock = FakeSocket()
    session._send_request()
    assert session._sock.buffer == (
        b'GET / HTTP/1.1\r\n'
        b'Host: example.com:443\r\n'
        b'Upgrade: websocket\r\n'
        b'Connection: Upgrade\r\n'
        b'Sec-WebSocket-Key: qqqqqqqqqqqqqqqqqqqqqg==\r\n'
        b'Sec-WebSocket-Version: 13\r\n'
        b'User-Agent: ' + constants.USER_AGENT.encode('utf-8') + b'\r\n'
        b'\r\n'
    )


def test_run_with_socket_open_error(session):
    def connect_which_raises_error():
        raise ValueError('fail')

    session._connect = connect_which_raises_error

    _events = list(session.run())

    assert len(_events) == 2

    assert isinstance(_events[0], events.Connecting)
    assert _events[0].url == 'wss://example.com/'

    assert isinstance(_events[1], events.ConnectFail)
    assert str(_events[1]) == "ConnectFail(reason='fail')"


def test_run_with_send_request_raising_transport_error(session):
    # _send_request can raise TransportFail inside write() call
    # in order to do that, the socket has to be opened and raise
    # either socket.error or Exception during sendall() call.
    # let's do just that. First of all, the method in question:
    def sendall_which_raises_error(data):
        raise socket.error('error during sendall')

    # here's where the plot thickens. socket connection is established
    # during self._connect, so we have to substitude this method so that
    # it returns our FakeSocket object.

    def return_fake_socket():
        return FakeSocket(sendall=sendall_which_raises_error), None

    session._connect = return_fake_socket

    _events = list(session.run())

    assert isinstance(_events[-1], events.ConnectFail)
    assert str(_events[-1]) == (
        "ConnectFail(reason='request failed; socket fail; error during sendall')"
    )


def test_that_on_ping_responds_with_pong(session, mocker):
    # we don't actually care that much for the whole stack underneath,
    # we only want to check whether a certain method was called..
    send_pong = mocker.patch(
        'lomond.websocket.WebSocket.send_pong'
    )

    session._send_pong(events.Ping(b'\x00'))

    assert send_pong.called_with(b'\x00')


def test_error_on_close_socket(caplog, session):
    def close_which_raises_error():
        raise ValueError('a problem occurred')

    session._sock = FakeSocket()
    session._sock.close = close_which_raises_error

    session._close_socket()

    import logging

    assert caplog.record_tuples[-1] == (
        'lomond',
        logging.WARNING,
        'error closing socket; a problem occurred'
    )


def test_check_poll(session):
    session._on_ready()
    assert session._check_poll(60, 61)
    assert not session._check_poll(60, 59)


def test_check_auto_ping(session, mocker):
    session._on_ready()

    mocker.patch.object(session.websocket, 'send_ping')
    assert session.websocket.send_ping.call_count == 0
    session._check_auto_ping(10, 12)
    assert session.websocket.send_ping.call_count == 1
    session._check_auto_ping(10, 15)
    assert session.websocket.send_ping.call_count == 1


def test_check_ping_timeout(session, mocker):
    session._on_ready()
    assert not session._check_ping_timeout(10, 5)
    assert session._check_ping_timeout(10, 11)


def test_recv_no_sock(session):
    session._sock = None
    assert session._recv(1) == b''


def test_on_pong(session):
    session._on_ready()
    session._on_pong(events.Pong(b'foo'))
    assert session.session_time - session._last_pong < 0.01


def test_context_manager():
    ws = WebSocket('ws://example.com/')
    session = WebsocketSession(ws)
    session._selector_cls = FakeSelector
    session._on_ready()
    with ws:
        for event in ws:
            pass


def test_connect_sock_fail_socket(monkeypatch, session):
    def fail_socket(*args):
        raise socket.error('foo')
    monkeypatch.setattr('socket.socket', fail_socket)

    with pytest.raises(_SocketFail):
        session._connect_sock('google.com', 80)


def test_connect_sock_fail_connect(monkeypatch, session):
    monkeypatch.setattr('socket.socket', lambda *args: FakeSocket())

    with pytest.raises(_SocketFail):
        session._connect_sock('google.com', 80)


def test_sock_recv(session):
    session._sock = FakeSocket()
    with pytest.raises(_SocketFail):
        session._recv(128)


def test_send_pong(session):
    session.websocket = FakeWebSocket()
    session._send_pong(events.Ping(b'foo'))


def test_check_close_timeout(session):
    session._on_ready()
    session.websocket = FakeWebSocket()
    session.websocket.sent_close_time = 10
    session._check_close_timeout(10, 19)
    with pytest.raises(_ForceDisconnect):
        session._check_close_timeout(10, 21)
