import lomond
from lomond import events
from lomond.session import WebsocketSession
from lomond import selectors


def test_echo():
    """Test against public echo server."""
    # TODO: host our own echo server
    ws = lomond.WebSocket('wss://echo.websocket.org')
    events = []
    for event in ws.connect(poll=60, ping_rate=0, auto_pong=False):
        events.append(event)
        if event.name == 'ready':
            ws.send_text(u'foo')
            ws.send_binary(b'bar')
            ws.close()

    assert len(events) == 8
    assert events[0].name == 'connecting'
    assert events[1].name == 'connected'
    assert events[2].name == 'ready'
    assert events[3].name == 'poll'
    assert events[4].name == 'text'
    assert events[4].text == u'foo'
    assert events[5].name == 'binary'
    assert events[5].data == b'bar'
    assert events[6].name == 'closed'
    assert events[7].name == 'disconnected'
    assert events[7].graceful


def test_echo_no_sni():
    """Test against public echo server."""
    try:
        from lomond import session
        has_sni = session.HAS_SNI
        session.HAS_SNI = False
        ws = lomond.WebSocket('wss://echo.websocket.org')
        events = []
        for event in ws.connect(poll=60, ping_rate=0, auto_pong=False):
            events.append(event)
            if event.name == 'ready':
                ws.send_text(u'foo')
                ws.send_binary(b'bar')
                ws.close()

        assert len(events) == 8
        assert events[0].name == 'connecting'
        assert events[1].name == 'connected'
        assert events[2].name == 'ready'
        assert events[3].name == 'poll'
        assert events[4].name == 'text'
        assert events[4].text == u'foo'
        assert events[5].name == 'binary'
        assert events[5].data == b'bar'
        assert events[6].name == 'closed'
        assert events[7].name == 'disconnected'
        assert events[7].graceful
    finally:
        session.HAS_SNI = has_sni


def test_echo_poll():
    """Test against public echo server."""
    # TODO: host our own echo server
    ws = lomond.WebSocket('wss://echo.websocket.org')
    _events = []
    polls = 0
    for event in ws.connect(poll=1.0, ping_rate=1.0, auto_pong=True):
        _events.append(event)
        if event.name == 'poll':
            polls += 1
            if polls == 1:
                ws.session._on_event(events.Ping(b'foo'))
            elif polls == 2:
                # Covers some lesser used code paths
                ws.state.closed = True
                ws.session._sock.close()


def test_not_ws():
    """Test against a URL that doesn't serve websockets."""
    ws = lomond.WebSocket('wss://www.google.com')
    events = list(ws.connect())
    assert len(events) == 4
    assert events[0].name == 'connecting'
    assert events[1].name == 'connected'
    assert events[2].name == 'rejected'
    assert events[3].name == 'disconnected'
    assert events[3].graceful


class SelectSession(WebsocketSession):
    _selector_cls = selectors.SelectSelector


def test_not_ws_select():
    """Test against a URL that doesn't serve websockets."""
    ws = lomond.WebSocket('wss://www.google.com')
    events = list(ws.connect(session_class=SelectSession))
    assert len(events) == 4
    assert events[0].name == 'connecting'
    assert events[1].name == 'connected'
    assert events[2].name == 'rejected'
    assert events[3].name == 'disconnected'
    assert events[3].graceful


def test_no_url_wss():
    """Test against a URL that doesn't serve websockets."""
    ws = lomond.WebSocket('wss://foo.test')
    events = list(ws.connect())
    assert len(events) == 2
    assert events[0].name == 'connecting'
    assert events[1].name == 'connect_fail'


def test_no_url_ws():
    """Test against a URL that doesn't serve websockets."""
    ws = lomond.WebSocket('ws://foo.test')
    events = list(ws.connect())
    assert len(events) == 2
    assert events[0].name == 'connecting'
    assert events[1].name == 'connect_fail'
