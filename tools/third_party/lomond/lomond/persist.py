"""
Maintains a persistent websocket connection.

"""

from __future__ import unicode_literals

from random import random
import threading

from . import events


def persist(websocket, poll=5,
            min_wait=5, max_wait=30,
            ping_rate=30, ping_timeout=None,
            exit_event=None):
    """Run a websocket, with a retry mechanism and exponential back-off.

    :param websocket: A :class:`~lomond.websocket.Websocket` instance.
    :param float poll: The websocket poll rate, in seconds.
    :param float min_wait: The minimum time to wait between reconnect
        attempts (seconds).
    :param float max_wait: The maximum time to wait between reconnect
        attempts (seconds).
    :param float ping_rate: Delay between pings (seconds), or `0` for no
        auto ping.
    :param float ping_timeout: Maximum time in seconds to wait for a
        pong response before disconnecting. Set to `None` (default) to
        disable. If set, double `ping_rate` would be a good starting
        point.
    :param exit_event: A threading event object, which can be used to
        exit the persist loop if it is set. Set to `None` to use an
        internal event object.

    """
    if exit_event is None:
        exit_event = threading.Event()
    retries = 0
    random_wait = max_wait - min_wait
    while True:
        retries += 1
        for event in websocket.connect(
                poll=poll, ping_rate=ping_rate, ping_timeout=ping_timeout):
            if event.name == 'ready':
                # The server accepted the WS upgrade.
                retries = 0
            yield event
        wait_for = min_wait + random() * min(random_wait, 2**retries)
        yield events.BackOff(wait_for)
        if exit_event.wait(wait_for):
            break


if __name__ == "__main__":  # pragma: no cover
    # Test with wstest -m broadcastserver -w ws://127.0.0.1:9001 -d

    from .websocket import WebSocket

    ws = WebSocket('ws://127.0.0.1:9001/')
    for event in persist(ws):
        print(event)
        if isinstance(event, events.Poll):
            ws.send_text('Hello, World')
            ws.send_binary(b'hello world in binary')
            ws.send_ping(b'test')
