from __future__ import unicode_literals

import json
import time


class Event(object):
    """Base class for a websocket 'event'."""
    __slots__ = ['received_time']

    def __init__(self):
        self.received_time = time.time()

    def __repr__(self):
        return "{}()".format(self.__class__.__name__)

    @classmethod
    def _summarize_bytes(cls, data, max_len=24):
        """Avoid spamming logs by truncating byte strings in repr."""
        if len(data) > max_len:
            return "{!r} + {} bytes".format(
                data[:max_len],
                len(data) - max_len
            )
        return repr(data)

    @classmethod
    def _summarize_text(cls, text, max_len=24):
        """Avoid spamming logs by truncating text."""
        if len(text) > max_len:
            return "{!r} + {} chars".format(
                text[:max_len],
                len(text) - max_len
            )
        return repr(text)


class Poll(Event):
    """A generated poll event."""
    name = 'poll'


class Connecting(Event):
    """
    Generated prior to establishing a websocket connection to a server.

    :param url: The websocket URL the websocket is connecting to.

    """
    __slots__ = ['url']
    name = 'connecting'

    def __init__(self, url):
        self.url = url
        super(Connecting, self).__init__()

    def __repr__(self):
        return "{}(url='{}')".format(self.__class__.__name__, self.url)


class ConnectFail(Event):
    """
    Generate when Lomond was unable to connect to a Websocket server.

    :param reason: A short description of the reason for the
        failure.
    :type reason: str

    """
    __slots__ = ['reason']
    name = 'connect_fail'

    def __init__(self, reason):
        self.reason = reason
        super(ConnectFail, self).__init__()

    def __repr__(self):
        return "{}(reason='{}')".format(
            self.__class__.__name__,
            self.reason,
        )


class Connected(Event):
    """Generated when Lomond has connected to a server but not yet
    negotiated the websocket upgrade.

    :param str url: The websocket URL connected to.
    :param str proxy: The proxy URL connected to (or None).

    """
    __slots__ = ['url', 'proxy']
    name = 'connected'

    def __init__(self, url, proxy=None):
        self.url = url
        self.proxy = proxy
        super(Connected, self).__init__()

    def __repr__(self):
        _class = self.__class__.__name__
        return (
            "{}(url='{}')".format(_class, self.url)
            if self.proxy is None else
            "{}(url='{}', proxy='{}')".format(
                _class, self.url, self.proxy
            )
        )


class Rejected(Event):
    """Server rejected WS connection."""
    __slots__ = ['response', 'reason']
    name = 'rejected'

    def __init__(self, response, reason):
        """
        Generated when Lomond is connected to the server, but the
        websocket upgrade failed.

        :param response: The response returned by the server.
        :param str reason: A description of why the connection was
            rejects.

        """
        self.response = response
        self.reason = reason
        super(Rejected, self).__init__()

    def __repr__(self):
        return "{}(response={!r}, reason='{}')".format(
            self.__class__.__name__,
            self.response,
            self.reason
        )


class Ready(Event):
    """Generated when Lomond has connected to the server,
    and successfully negotiated the websocket upgrade.

    :param response: A :class:`~lomond.response.Response` object.
    :param str protocol: A websocket protocol or ``None`` if no protocol
        was supplied.
    :param set extensions: A set of negotiated websocket extensions.
        Currently only the ``'permessage-deflate'`` extension is supported.

    """
    __slots__ = ['response', 'protocol', 'extensions']
    name = 'ready'

    def __init__(self, response, protocol, extensions):
        self.response = response
        self.protocol = protocol
        self.extensions = extensions
        super(Ready, self).__init__()

    def __repr__(self):
        return '{}(response={!r}, protocol={!r}, extensions={!r})'.format(
            self.__class__.__name__,
            self.response,
            self.protocol,
            self.extensions
        )


class ProtocolError(Event):
    """Generated when the server deviates from the protocol.

    :param str error: A description of the error.
    :param bool critical: Indicates if the error is considered
        'critical'. If ``True``, Lomond will disconnect immediately.
        If ``False``, Lomond will send a close message to the server.

    """
    __slots__ = ['error', 'critical']
    name = 'protocol_error'

    def __init__(self, error, critical):
        self.error = error
        self.critical = critical
        super(ProtocolError, self).__init__()

    def __repr__(self):
        return "{}(error='{}', critical={!r})".format(
            self.__class__.__name__,
            self.error,
            self.critical
        )


class Unresponsive(Event):
    """The server has not responding to pings within `ping_timeout`
    seconds.

    Will be followed by a :class:`~lomond.events.Disconnected` event.

    """
    name = 'unresponsive'


class Disconnected(Event):
    """Generated when a websocket connection has
    been dropped.

    :param str reason: A description of why the websocket was closed.
    :param bool graceful: Flag indicating if the connection was dropped
        gracefully (`True`), or disconnected due to a socket failure
        (`False`) or other problem.

    """
    __slots__ = ['graceful', 'reason']
    name = 'disconnected'

    def __init__(self, reason='closed', graceful=False):
        self.reason = reason
        self.graceful = graceful
        super(Disconnected, self).__init__()

    def __repr__(self):
        return "{}(reason='{}', graceful={!r})".format(
            self.__class__.__name__,
            self.reason,
            self.graceful
        )


class Closed(Event):
    """Generated when the websocket was closed. The websocket may no
    longer send packets after this event has been received. This event
    will be followed by :class:`~lomond.events.Disconnected`.

    :param code: The closed code returned from the server.
    :param str reason: An optional description why the websocket was
        closed, as returned from the server.

    """
    __slots__ = ['code', 'reason']
    name = 'closed'

    def __init__(self, code, reason):
        self.code = code
        self.reason = reason
        super(Closed, self).__init__()

    def __repr__(self):
        return '{}(code={!r}, reason={!r})'.format(
            self.__class__.__name__,
            self.code,
            self.reason,
        )


class Closing(Event):
    """Generated when the server is closing the connection.

    No more messages will be received from the server, but you may still
    send messages while handling this event. A
    :class:`~lomond.events.Disconnected` event should be generated
    shortly after this event.

    :param code: The closed code returned from the server.
    :param str reason: An optional description why the websocket was
        closed, as returned from the server.

    """
    __slots__ = ['code', 'reason']
    name = 'closing'

    def __init__(self, code, reason):
        self.code = code
        self.reason = reason
        super(Closing, self).__init__()

    def __repr__(self):
        return '{}(code={!r}, reason={!r})'.format(
            self.__class__.__name__,
            self.code,
            self.reason,
        )


class UnknownMessage(Event):
    """
    An application message was received, with an unknown opcode.

    """
    __slots__ = ['message']
    name = 'unknown'

    def __init__(self, message):
        self.message = message
        super(UnknownMessage, self).__init__()


class Ping(Event):
    """Generated when Lomond received a ping packet from the server.

    :param bytes data: Ping payload data.

    """
    __slots__ = ['data']
    name = 'ping'

    def __init__(self, data):
        self.data = data
        super(Ping, self).__init__()

    def __repr__(self):
        return "{}(data={!r})".format(self.__class__.__name__, self.data)


class Pong(Event):
    """Generated when Lomond receives a pong packet from the server.

    :param bytes data: The pong payload data.

    """
    __slots__ = ['data']
    name = 'pong'

    def __init__(self, data):
        self.data = data
        super(Pong, self).__init__()

    def __repr__(self):
        return "{}(data={!r})".format(self.__class__.__name__, self.data)


class Text(Event):
    """Generated when Lomond receives a text message from the server.

    :param str text: The text payload.

    """
    __slots__ = ['text', '_json']
    name = 'text'

    def __init__(self, text):
        self.text = text
        self._json = None
        super(Text, self).__init__()

    @property
    def json(self):
        """Text decoded as JSON.

        Calls ``json.loads`` to decode the ``text`` attribute, and may
        throw the same exceptions if the text is not valid json.

        """
        if self._json is None:
            self._json = json.loads(self.text)
        return self._json

    def __repr__(self):
        return "{}(text={})".format(
            self.__class__.__name__,
            self._summarize_text(self.text)
        )


class Binary(Event):
    """Generated when Lomond receives a binary message from the server.

    :param bytes data: The binary payload.

    """
    __slots__ = ['data']
    name = 'binary'

    def __init__(self, data):
        self.data = data
        super(Binary, self).__init__()

    def __repr__(self):
        return "{}(data={})".format(
            self.__class__.__name__,
            self._summarize_bytes(self.data)
        )


class BackOff(Event):
    """Generated when a persistent connection has to wait before re-
    attempting a connection.

    :param float delay: The delay (in seconds) before Lomond will re-
        attempt to connect.

    """
    __slots__ = ['delay']
    name = 'back_off'

    def __init__(self, delay):
        self.delay = delay
        super(BackOff, self).__init__()

    def __repr__(self):
        return "{}(delay={:0.1f})".format(
            self.__class__.__name__,
            self.delay
        )
