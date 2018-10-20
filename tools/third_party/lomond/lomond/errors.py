from __future__ import unicode_literals


class WebSocketError(Exception):
    """Base exception."""
    def __init__(self, msg, *args, **kwargs):
        error_msg = msg.format(*args, **kwargs)
        super(WebSocketError, self).__init__(error_msg)


class FrameBuildError(WebSocketError):
    """Raised when trying to build an invalid websocket frame."""


class HandshakeError(WebSocketError):
    """
    Raised when the server doesn't respond correctly to the websocket
    handshake.

    """


class CompressionParameterError(HandshakeError):
    """
    Raised when the headers contain invalid compression parameters.

    """


class ProtocolError(WebSocketError):
    """Raised in response to a protocol violation."""
    # Results in a a graceful disconnect.


class CriticalProtocolError(WebSocketError):
    """Critical protocol error. An egregious error in the protocol
    resulting in an immediate disconnect.

    """


class PayloadTooLarge(ProtocolError):
    """The payload length field is too large.

    Websocket messages have a maximum payload of 2**63 bytes. In
    practice it may be impossible to generate such a packet for real,
    but its feasible a corrupt packet header could make it appear that
    such a packet was being sent.

    """


class ConnectFail(WebSocketError):
    """An error connecting to a socket."""


class TransportFail(WebSocketError):
    """The transport (socket) failed when sending.

    Likely indicating connectivity issues.

    """


class WebSocketUnavailable(WebSocketError):
    """The websocket can not be used."""


class WebSocketClosed(WebSocketUnavailable):
    """Raised when attempting to send over a closed websocket."""


class WebSocketClosing(WebSocketUnavailable):
    """Raised when attempting to send over a closing websocket."""
