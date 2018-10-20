from lomond.constants import WS_KEY, WS_VERSION, USER_AGENT


def test_ws_key():
    # this is a constant, which, if changed to something else, will break
    # the websocket handshake
    # https://tools.ietf.org/html/rfc6455#page-7
    assert WS_KEY == b'258EAFA5-E914-47DA-95CA-C5AB0DC85B11'


def test_ws_version():
    assert WS_VERSION == 13


def test_user_agent():
    assert USER_AGENT.startswith('Lomond')
