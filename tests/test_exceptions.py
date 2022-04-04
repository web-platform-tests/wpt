import unittest

from websockets.datastructures import Headers
from websockets.exceptions import *
from websockets.frames import Close
from websockets.http11 import Response


class ExceptionsTests(unittest.TestCase):
    def test_str(self):
        for exception, exception_str in [
            # fmt: off
            (
                WebSocketException("something went wrong"),
                "something went wrong",
            ),
            (
                ConnectionClosed(Close(1000, ""), Close(1000, ""), True),
                "received 1000 (OK); then sent 1000 (OK)",
            ),
            (
                ConnectionClosed(Close(1001, "Bye!"), Close(1001, "Bye!"), False),
                "sent 1001 (going away) Bye!; then received 1001 (going away) Bye!",
            ),
            (
                ConnectionClosed(Close(1000, "race"), Close(1000, "cond"), True),
                "received 1000 (OK) race; then sent 1000 (OK) cond",
            ),
            (
                ConnectionClosed(Close(1000, "cond"), Close(1000, "race"), False),
                "sent 1000 (OK) race; then received 1000 (OK) cond",
            ),
            (
                ConnectionClosed(None, Close(1009, ""), None),
                "sent 1009 (message too big); no close frame received",
            ),
            (
                ConnectionClosed(Close(1002, ""), None, None),
                "received 1002 (protocol error); no close frame sent",
            ),
            (
                ConnectionClosedOK(Close(1000, ""), Close(1000, ""), True),
                "received 1000 (OK); then sent 1000 (OK)",
            ),
            (
                ConnectionClosedError(None, None, None),
                "no close frame received or sent"
            ),
            (
                InvalidHandshake("invalid request"),
                "invalid request",
            ),
            (
                SecurityError("redirect from WSS to WS"),
                "redirect from WSS to WS",
            ),
            (
                InvalidMessage("malformed HTTP message"),
                "malformed HTTP message",
            ),
            (
                InvalidHeader("Name"),
                "missing Name header",
            ),
            (
                InvalidHeader("Name", None),
                "missing Name header",
            ),
            (
                InvalidHeader("Name", ""),
                "empty Name header",
            ),
            (
                InvalidHeader("Name", "Value"),
                "invalid Name header: Value",
            ),
            (
                InvalidHeaderFormat(
                    "Sec-WebSocket-Protocol", "expected token", "a=|", 3
                ),
                "invalid Sec-WebSocket-Protocol header: "
                "expected token at 3 in a=|",
            ),
            (
                InvalidHeaderValue("Sec-WebSocket-Version", "42"),
                "invalid Sec-WebSocket-Version header: 42",
            ),
            (
                InvalidOrigin("http://bad.origin"),
                "invalid Origin header: http://bad.origin",
            ),
            (
                InvalidUpgrade("Upgrade"),
                "missing Upgrade header",
            ),
            (
                InvalidUpgrade("Connection", "websocket"),
                "invalid Connection header: websocket",
            ),
            (
                InvalidStatus(Response(401, "Unauthorized", Headers())),
                "server rejected WebSocket connection: HTTP 401",
            ),
            (
                InvalidStatusCode(403, Headers()),
                "server rejected WebSocket connection: HTTP 403",
            ),
            (
                NegotiationError("unsupported subprotocol: spam"),
                "unsupported subprotocol: spam",
            ),
            (
                DuplicateParameter("a"),
                "duplicate parameter: a",
            ),
            (
                InvalidParameterName("|"),
                "invalid parameter name: |",
            ),
            (
                InvalidParameterValue("a", None),
                "missing value for parameter a",
            ),
            (
                InvalidParameterValue("a", ""),
                "empty value for parameter a",
            ),
            (
                InvalidParameterValue("a", "|"),
                "invalid value for parameter a: |",
            ),
            (
                AbortHandshake(200, Headers(), b"OK\n"),
                "HTTP 200, 0 headers, 3 bytes",
            ),
            (
                RedirectHandshake("wss://example.com"),
                "redirect to wss://example.com",
            ),
            (
                InvalidState("WebSocket connection isn't established yet"),
                "WebSocket connection isn't established yet",
            ),
            (
                InvalidURI("|", "not at all!"),
                "| isn't a valid URI: not at all!",
            ),
            (
                PayloadTooBig("payload length exceeds limit: 2 > 1 bytes"),
                "payload length exceeds limit: 2 > 1 bytes",
            ),
            (
                ProtocolError("invalid opcode: 7"),
                "invalid opcode: 7",
            ),
            # fmt: on
        ]:
            with self.subTest(exception=exception):
                self.assertEqual(str(exception), exception_str)
