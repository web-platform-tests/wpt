from __future__ import unicode_literals

from lomond.stream import WebsocketStream
from lomond.errors import CriticalProtocolError, ProtocolError
from lomond.response import Response
import pytest


@pytest.fixture
def stream():
    return WebsocketStream()



def test_bad_header():
    """Test with stupidly large headers."""
    data = b'HTTP/1.1 200 OK\r\nConnection:Keep-Alive\r\nUser-Agent:Test\r\n'
    data += b'F' * 16384
    stream = WebsocketStream()
    with pytest.raises(CriticalProtocolError):
        list(stream.feed(data))


def test_feed_with_chunked_data():
    stream = None
    data = (
        b'HTTP/1.1 200 OK\r\nConnection:Keep-Alive\r\nUser-Agent:Test\r\n\r\n'
        b'\x81\x01A'
        # the first \x81 designates a type TEXT and some magic masks set
        # the second \x81 stands for XOR masking being used, and a length of 1
        # the following 4 \x00 are the XOR masking key, and lastly, a letter
        # A is inserted as the actual payload
        #
        # for in-depth explanation what the above bytes mean, please refer to
        # test_frame_parser.py
    )

    for chunk_size in range(1, len(data)):
        stream = WebsocketStream()
        frames = []

        i = 0
        while i < len(data):
            frames.extend(stream.feed(data[i:i + chunk_size]))
            i += chunk_size

        # regardless of how we chunk up the data, there should be only 2
        # frames at the end. They are exactly the same like the ones in the
        # test method above, so please refer to the description there for more
        # detailed explanation.
        assert len(frames) == 2
        # the feed method is expected to produce the http response object and
        # the binary payload.
        assert isinstance(frames[0], Response)
        # validate Response
        assert frames[0].http_ver == 'HTTP/1.1'
        assert frames[0].status_code == 200
        assert frames[0].status == 'OK'
        assert frames[0].get('user-agent') == 'Test'
        assert frames[0].get('connection') == 'Keep-Alive'
        # decoded payload
        # one could also use isinstance(frames[1], Text) here
        assert frames[1].is_text
        assert frames[1].text == 'A'


def test_feed_without_headers_results_in_noop(stream):
    # please refer to test_feed for meaning of these bytes
    data = b'\x81\x81\x00\x00\x00\x00A'

    # without the header present, the feeder should stop, regardless of the
    # payload
    assert len(list(stream.feed(data))) == 0


def test_continuation_frames_validation(stream):
    data = (
        b'Connection:Keep-Alive\r\nUser-Agent:Test\r\n\r\n'
        b'\x01\x01A\x81\x01A'
        # the most significant bit in first byte of the binary message means
        # that FIN=0 and therefore this is supposed to be a continuation frame
        # however, the second part of bytes (which starts right after the first
        # letter A has a byte combination which state that this is a TEXT
        # message. Therefore the parser cannot continue previous frame and should
        # fail with an explicit message)
        #
        # please refer to test_frame_parser for in-depth explanation of all
        # bits and bytes of the websocket payloads
    )

    with pytest.raises(ProtocolError) as e:
        list(stream.feed(data))

    assert str(e.value) == 'continuation frame expected'
