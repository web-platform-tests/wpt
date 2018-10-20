from lomond import events
import pytest
import six


test_cases = [
    (events.Event(), 'Event()'),
    (events.Text('A' * 25), 'Text(text=%r + 1 chars)' % ('A' * 24)),
    (events.Text('A'), "Text(text='A')"),
    (
        events.Connecting('http://example.com'),
        "Connecting(url='http://example.com')"
    ),
    (
        events.Connected('http://example.org', proxy='foo'),
        "Connected(url='http://example.org', proxy='foo')"
    ),
    (events.ConnectFail('404'), "ConnectFail(reason='404')"),
    (
        events.Rejected(response='401', reason='Insufficient permissions'),
        "Rejected(response='401', reason='Insufficient permissions')"
    ),
    (
        events.Ready('200', 'HTTP', []),
        "Ready(response='200', protocol='HTTP', extensions=[])"
    ),
    (events.Disconnected(), "Disconnected(reason='closed', graceful=False)"),
    (events.Disconnected(reason='error'), "Disconnected(reason='error', graceful=False)"),
    (
        events.Disconnected('bye', graceful=True),
        "Disconnected(reason='bye', graceful=True)"
    ),
    (events.Closed(1, 'closed'), "Closed(code=1, reason='closed')"),
    (events.Closing(1, 'closed'), "Closing(code=1, reason='closed')"),
    (events.UnknownMessage('?.!'), "UnknownMessage()"),
    (events.Ping('o |'), "Ping(data='o |')"),
    (events.Pong('  | o'), "Pong(data='  | o')"),
    (events.BackOff(0.1), "BackOff(delay=0.1)"),
    (events.ProtocolError('error', critical=False), "ProtocolError(error='error', critical=False)")
]

# we are splitting these two test cases into separate branches, because the
# underlying code which implements __repr__ calls __repr__ of the passed
# object. As we all know, Python2 treats b'' as a simple string, however
# Python3 understands it as a different type (bytes) and represents it with a
# leading b''. This could be done in a portable way using six in one line, but
# the code would be somewhat misleading
if six.PY2:
    test_cases.extend([
        (
            events.Binary(b'\xef' * 25),
            "Binary(data='%s' + 1 bytes)" % ('\\xef' * 24)
        ),
        (events.Binary(b'\x01'), "Binary(data='\\x01')"),
    ])
elif six.PY3:
    test_cases.extend([
        (
            events.Binary(b'\xef' * 25),
            "Binary(data=%s + 1 bytes)" % (b'\xef' * 24)
        ),
        (events.Binary(b'\x01'), "Binary(data=b'\\x01')"),
    ])


@pytest.mark.parametrize("event_object, expected", test_cases)
def test_repr(event_object, expected):
    assert isinstance(event_object, events.Event)
    assert repr(event_object) == expected


def test_text_json():
    event = events.Text("""{"foo": "bar"}""")
    assert isinstance(event.json, dict)
    assert event.json == {"foo": "bar"}
