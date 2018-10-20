import pytest

from pyppeteer import Connection, ConnectionError

def test_open_twice(chrome):
    connection = Connection(chrome['port'], chrome['webSocketDebuggerUrl'])

    try:
        connection.open()

        with pytest.raises(ConnectionError):
            connection.open()
    finally:
        connection.close()

def test_close_unopened(chrome):
    connection = Connection(chrome['port'], chrome['webSocketDebuggerUrl'])

    with pytest.raises(ConnectionError):
        connection.close()

def test_close_twice(chrome):
    connection = Connection(chrome['port'], chrome['webSocketDebuggerUrl'])

    connection.open()

    connection.close()

    with pytest.raises(ConnectionError):
        connection.close()

def test_send(chrome):
    connection = Connection(chrome['port'], chrome['webSocketDebuggerUrl'])

    try:
        connection.open()
        result = connection.send('Browser.getVersion')
        assert isinstance(result, object)
        assert 'revision' in result
    finally:
        connection.close()

def test_send_before_open(chrome):
    connection = Connection(chrome['port'], chrome['webSocketDebuggerUrl'])

    with pytest.raises(ConnectionError):
        connection.send('Browser.getVersion')

def test_send_after_close(chrome):
    connection = Connection(chrome['port'], chrome['webSocketDebuggerUrl'])

    connection.open()
    connection.close()

    with pytest.raises(ConnectionError):
        connection.send('Browser.getVersion')
