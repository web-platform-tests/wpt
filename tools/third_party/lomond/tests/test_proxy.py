from __future__ import unicode_literals

import os
import subprocess
import pytest
import time

from lomond import WebSocket, proxy


def test_build_request():
    request_bytes = proxy.build_request(
        'ws://example.org', 8888, proxy_username='foo'
    )
    expected = (
        b'CONNECT ws://example.org:8888 HTTP/1.1\r\n'
        b'Host: ws://example.org\r\n'
        b'Proxy-Connection: keep-alive\r\n'
        b'Connection: keep-alive\r\n'
        b'Proxy-Authorization:: Basic Zm9v\r\n\r\n'
    )
    assert request_bytes == expected


def test_parser():
    response = [
        b'HTTP/1.1 200 Connection established\r\n',
        b'foo: bar\r\n',
        b'\r\n',
    ]
    proxy_parser = proxy.ProxyParser()
    for line in response:
        for response in proxy_parser.feed(line):
            break

    assert response.status == 'Connection established'
    assert response.status_code == 200
    assert response.headers['foo'] == 'bar'


def test_parser_fail():
    """Test non-success response from proxy."""
    response = [
        b'HTTP/1.1 407 auth required\r\n',
        b'foo: bar\r\n\r\n'
    ]
    proxy_parser = proxy.ProxyParser()
    with pytest.raises(proxy.ProxyFail):
        for line in response:
            for response in proxy_parser.feed(line):
                break


def test_parser_fail_nodata():
    """Test no response from proxy."""
    proxy_parser = proxy.ProxyParser()
    with pytest.raises(proxy.ProxyFail):
        for response in proxy_parser.feed(b''):
            break


def test_proxy():
    proc = subprocess.Popen(['proxy.py', '--port', '8888'])
    try:
        time.sleep(1)
        ws = WebSocket(
            'wss://echo.websocket.org',
            proxies={'https': 'http://127.0.0.1:8888'}
        )
        events = []
        for event in ws:
            events.append(event)
            if event.name == 'ready':
                ws.close()

        assert len(events) == 6
        assert events[0].name == 'connecting'
        assert events[1].name == 'connected'
        assert events[1].proxy == 'http://127.0.0.1:8888'
        assert events[2].name == 'ready'
        assert events[3].name == 'poll'
        assert events[4].name == 'closed'
        assert events[5].name == 'disconnected'
    finally:
        os.kill(proc.pid, 3)


def test_bad_proxy():
    proc = subprocess.Popen(['proxy.py', '--port', '8888'])
    try:
        time.sleep(0.1)
        ws = WebSocket(
            'wss://echo.websocket.org',
            proxies={'https': 'http://bad.test:8888'}
        )
        events = []
        for event in ws:
            events.append(event)
            if event.name == 'ready':
                ws.close()

        assert len(events) == 2
        assert events[0].name == 'connecting'
        assert events[1].name == 'connect_fail'
    finally:
        os.kill(proc.pid, 3)
