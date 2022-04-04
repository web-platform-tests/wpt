import unittest.mock

from websockets.connection import *
from websockets.exceptions import InvalidState, PayloadTooBig, ProtocolError
from websockets.frames import (
    OP_BINARY,
    OP_CLOSE,
    OP_CONT,
    OP_PING,
    OP_PONG,
    OP_TEXT,
    Frame,
    serialize_close,
)

from .extensions.utils import Rsv2Extension
from .test_frames import FramesTestCase


class ConnectionTestCase(FramesTestCase):
    def assertFrameSent(self, connection, frame, eof=False):
        """
        Outgoing data for ``connection`` contains the given frame.

        ``frame`` may be ``None`` if no frame is expected.

        When ``eof`` is ``True``, the end of the stream is also expected.

        """
        frames_sent = [
            None
            if write is SEND_EOF
            else self.parse(
                write,
                mask=connection.side is Side.CLIENT,
                extensions=connection.extensions,
            )
            for write in connection.data_to_send()
        ]
        frames_expected = [] if frame is None else [frame]
        if eof:
            frames_expected += [None]
        self.assertEqual(frames_sent, frames_expected)

    def assertFrameReceived(self, connection, frame):
        """
        Incoming data for ``connection`` contains the given frame.

        ``frame`` may be ``None`` if no frame is expected.

        """
        frames_received = connection.events_received()
        frames_expected = [] if frame is None else [frame]
        self.assertEqual(frames_received, frames_expected)

    def assertConnectionClosing(self, connection, code=None, reason=""):
        """
        Incoming data caused the "Start the WebSocket Closing Handshake" process.

        """
        close_frame = Frame(
            True,
            OP_CLOSE,
            b"" if code is None else serialize_close(code, reason),
        )
        # A close frame was received.
        self.assertFrameReceived(connection, close_frame)
        # A close frame and possibly the end of stream were sent.
        self.assertFrameSent(
            connection, close_frame, eof=connection.side is Side.SERVER
        )

    def assertConnectionFailing(self, connection, code=None, reason=""):
        """
        Incoming data caused the "Fail the WebSocket Connection" process.

        """
        close_frame = Frame(
            True,
            OP_CLOSE,
            b"" if code is None else serialize_close(code, reason),
        )
        # No frame was received.
        self.assertFrameReceived(connection, None)
        # A close frame and the end of stream were sent.
        self.assertFrameSent(connection, close_frame, eof=True)


class MaskingTests(ConnectionTestCase):
    """
    Test frame masking.

    5.1.  Overview

    """

    unmasked_text_frame_date = b"\x81\x04Spam"
    masked_text_frame_data = b"\x81\x84\x00\xff\x00\xff\x53\x8f\x61\x92"

    def test_client_sends_masked_frame(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\xff\x00\xff"):
            client.send_text(b"Spam", True)
        self.assertEqual(client.data_to_send(), [self.masked_text_frame_data])

    def test_server_sends_unmasked_frame(self):
        server = Connection(Side.SERVER)
        server.send_text(b"Spam", True)
        self.assertEqual(server.data_to_send(), [self.unmasked_text_frame_date])

    def test_client_receives_unmasked_frame(self):
        client = Connection(Side.CLIENT)
        client.receive_data(self.unmasked_text_frame_date)
        self.assertFrameReceived(
            client,
            Frame(True, OP_TEXT, b"Spam"),
        )

    def test_server_receives_masked_frame(self):
        server = Connection(Side.SERVER)
        server.receive_data(self.masked_text_frame_data)
        self.assertFrameReceived(
            server,
            Frame(True, OP_TEXT, b"Spam"),
        )

    def test_client_receives_masked_frame(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(self.masked_text_frame_data)
        self.assertEqual(str(raised.exception), "incorrect masking")
        self.assertConnectionFailing(client, 1002, "incorrect masking")

    def test_server_receives_unmasked_frame(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(self.unmasked_text_frame_date)
        self.assertEqual(str(raised.exception), "incorrect masking")
        self.assertConnectionFailing(server, 1002, "incorrect masking")


class ContinuationTests(ConnectionTestCase):
    """
    Test continuation frames without text or binary frames.

    """

    def test_client_sends_unexpected_continuation(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.send_continuation(b"", fin=False)
        self.assertEqual(str(raised.exception), "unexpected continuation frame")

    def test_server_sends_unexpected_continuation(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.send_continuation(b"", fin=False)
        self.assertEqual(str(raised.exception), "unexpected continuation frame")

    def test_client_receives_unexpected_continuation(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x00\x00")
        self.assertEqual(str(raised.exception), "unexpected continuation frame")
        self.assertConnectionFailing(client, 1002, "unexpected continuation frame")

    def test_server_receives_unexpected_continuation(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x00\x80\x00\x00\x00\x00")
        self.assertEqual(str(raised.exception), "unexpected continuation frame")
        self.assertConnectionFailing(server, 1002, "unexpected continuation frame")

    def test_client_sends_continuation_after_sending_close(self):
        client = Connection(Side.CLIENT)
        # Since it isn't possible to send a close frame in a fragmented
        # message (see test_client_send_close_in_fragmented_message), in fact,
        # this is the same test as test_client_sends_unexpected_continuation.
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_close(1001)
        self.assertEqual(client.data_to_send(), [b"\x88\x82\x00\x00\x00\x00\x03\xe9"])
        with self.assertRaises(ProtocolError) as raised:
            client.send_continuation(b"", fin=False)
        self.assertEqual(str(raised.exception), "unexpected continuation frame")

    def test_server_sends_continuation_after_sending_close(self):
        # Since it isn't possible to send a close frame in a fragmented
        # message (see test_server_send_close_in_fragmented_message), in fact,
        # this is the same test as test_server_sends_unexpected_continuation.
        server = Connection(Side.SERVER)
        server.send_close(1000)
        self.assertEqual(server.data_to_send(), [b"\x88\x02\x03\xe8", b""])
        with self.assertRaises(ProtocolError) as raised:
            server.send_continuation(b"", fin=False)
        self.assertEqual(str(raised.exception), "unexpected continuation frame")

    def test_client_receives_continuation_after_receiving_close(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x02\x03\xe8")
        self.assertConnectionClosing(client, 1000)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x00\x00")
        self.assertEqual(str(raised.exception), "data frame after close frame")

    def test_server_receives_continuation_after_receiving_close(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x82\x00\x00\x00\x00\x03\xe9")
        self.assertConnectionClosing(server, 1001)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x00\x80\x00\xff\x00\xff")
        self.assertEqual(str(raised.exception), "data frame after close frame")


class TextTests(ConnectionTestCase):
    """
    Test text frames and continuation frames.

    """

    def test_client_sends_text(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_text("😀".encode())
        self.assertEqual(
            client.data_to_send(), [b"\x81\x84\x00\x00\x00\x00\xf0\x9f\x98\x80"]
        )

    def test_server_sends_text(self):
        server = Connection(Side.SERVER)
        server.send_text("😀".encode())
        self.assertEqual(server.data_to_send(), [b"\x81\x04\xf0\x9f\x98\x80"])

    def test_client_receives_text(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x81\x04\xf0\x9f\x98\x80")
        self.assertFrameReceived(
            client,
            Frame(True, OP_TEXT, "😀".encode()),
        )

    def test_server_receives_text(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x81\x84\x00\x00\x00\x00\xf0\x9f\x98\x80")
        self.assertFrameReceived(
            server,
            Frame(True, OP_TEXT, "😀".encode()),
        )

    def test_client_receives_text_over_size_limit(self):
        client = Connection(Side.CLIENT, max_size=3)
        with self.assertRaises(PayloadTooBig) as raised:
            client.receive_data(b"\x81\x04\xf0\x9f\x98\x80")
        self.assertEqual(str(raised.exception), "over size limit (4 > 3 bytes)")
        self.assertConnectionFailing(client, 1009, "over size limit (4 > 3 bytes)")

    def test_server_receives_text_over_size_limit(self):
        server = Connection(Side.SERVER, max_size=3)
        with self.assertRaises(PayloadTooBig) as raised:
            server.receive_data(b"\x81\x84\x00\x00\x00\x00\xf0\x9f\x98\x80")
        self.assertEqual(str(raised.exception), "over size limit (4 > 3 bytes)")
        self.assertConnectionFailing(server, 1009, "over size limit (4 > 3 bytes)")

    def test_client_receives_text_without_size_limit(self):
        client = Connection(Side.CLIENT, max_size=None)
        client.receive_data(b"\x81\x04\xf0\x9f\x98\x80")
        self.assertFrameReceived(
            client,
            Frame(True, OP_TEXT, "😀".encode()),
        )

    def test_server_receives_text_without_size_limit(self):
        server = Connection(Side.SERVER, max_size=None)
        server.receive_data(b"\x81\x84\x00\x00\x00\x00\xf0\x9f\x98\x80")
        self.assertFrameReceived(
            server,
            Frame(True, OP_TEXT, "😀".encode()),
        )

    def test_client_sends_fragmented_text(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_text("😀".encode()[:2], fin=False)
        self.assertEqual(client.data_to_send(), [b"\x01\x82\x00\x00\x00\x00\xf0\x9f"])
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_continuation("😀😀".encode()[2:6], fin=False)
        self.assertEqual(
            client.data_to_send(), [b"\x00\x84\x00\x00\x00\x00\x98\x80\xf0\x9f"]
        )
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_continuation("😀".encode()[2:], fin=True)
        self.assertEqual(client.data_to_send(), [b"\x80\x82\x00\x00\x00\x00\x98\x80"])

    def test_server_sends_fragmented_text(self):
        server = Connection(Side.SERVER)
        server.send_text("😀".encode()[:2], fin=False)
        self.assertEqual(server.data_to_send(), [b"\x01\x02\xf0\x9f"])
        server.send_continuation("😀😀".encode()[2:6], fin=False)
        self.assertEqual(server.data_to_send(), [b"\x00\x04\x98\x80\xf0\x9f"])
        server.send_continuation("😀".encode()[2:], fin=True)
        self.assertEqual(server.data_to_send(), [b"\x80\x02\x98\x80"])

    def test_client_receives_fragmented_text(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x01\x02\xf0\x9f")
        self.assertFrameReceived(
            client,
            Frame(False, OP_TEXT, "😀".encode()[:2]),
        )
        client.receive_data(b"\x00\x04\x98\x80\xf0\x9f")
        self.assertFrameReceived(
            client,
            Frame(False, OP_CONT, "😀😀".encode()[2:6]),
        )
        client.receive_data(b"\x80\x02\x98\x80")
        self.assertFrameReceived(
            client,
            Frame(True, OP_CONT, "😀".encode()[2:]),
        )

    def test_server_receives_fragmented_text(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x01\x82\x00\x00\x00\x00\xf0\x9f")
        self.assertFrameReceived(
            server,
            Frame(False, OP_TEXT, "😀".encode()[:2]),
        )
        server.receive_data(b"\x00\x84\x00\x00\x00\x00\x98\x80\xf0\x9f")
        self.assertFrameReceived(
            server,
            Frame(False, OP_CONT, "😀😀".encode()[2:6]),
        )
        server.receive_data(b"\x80\x82\x00\x00\x00\x00\x98\x80")
        self.assertFrameReceived(
            server,
            Frame(True, OP_CONT, "😀".encode()[2:]),
        )

    def test_client_receives_fragmented_text_over_size_limit(self):
        client = Connection(Side.CLIENT, max_size=3)
        client.receive_data(b"\x01\x02\xf0\x9f")
        self.assertFrameReceived(
            client,
            Frame(False, OP_TEXT, "😀".encode()[:2]),
        )
        with self.assertRaises(PayloadTooBig) as raised:
            client.receive_data(b"\x80\x02\x98\x80")
        self.assertEqual(str(raised.exception), "over size limit (2 > 1 bytes)")
        self.assertConnectionFailing(client, 1009, "over size limit (2 > 1 bytes)")

    def test_server_receives_fragmented_text_over_size_limit(self):
        server = Connection(Side.SERVER, max_size=3)
        server.receive_data(b"\x01\x82\x00\x00\x00\x00\xf0\x9f")
        self.assertFrameReceived(
            server,
            Frame(False, OP_TEXT, "😀".encode()[:2]),
        )
        with self.assertRaises(PayloadTooBig) as raised:
            server.receive_data(b"\x80\x82\x00\x00\x00\x00\x98\x80")
        self.assertEqual(str(raised.exception), "over size limit (2 > 1 bytes)")
        self.assertConnectionFailing(server, 1009, "over size limit (2 > 1 bytes)")

    def test_client_receives_fragmented_text_without_size_limit(self):
        client = Connection(Side.CLIENT, max_size=None)
        client.receive_data(b"\x01\x02\xf0\x9f")
        self.assertFrameReceived(
            client,
            Frame(False, OP_TEXT, "😀".encode()[:2]),
        )
        client.receive_data(b"\x00\x04\x98\x80\xf0\x9f")
        self.assertFrameReceived(
            client,
            Frame(False, OP_CONT, "😀😀".encode()[2:6]),
        )
        client.receive_data(b"\x80\x02\x98\x80")
        self.assertFrameReceived(
            client,
            Frame(True, OP_CONT, "😀".encode()[2:]),
        )

    def test_server_receives_fragmented_text_without_size_limit(self):
        server = Connection(Side.SERVER, max_size=None)
        server.receive_data(b"\x01\x82\x00\x00\x00\x00\xf0\x9f")
        self.assertFrameReceived(
            server,
            Frame(False, OP_TEXT, "😀".encode()[:2]),
        )
        server.receive_data(b"\x00\x84\x00\x00\x00\x00\x98\x80\xf0\x9f")
        self.assertFrameReceived(
            server,
            Frame(False, OP_CONT, "😀😀".encode()[2:6]),
        )
        server.receive_data(b"\x80\x82\x00\x00\x00\x00\x98\x80")
        self.assertFrameReceived(
            server,
            Frame(True, OP_CONT, "😀".encode()[2:]),
        )

    def test_client_sends_unexpected_text(self):
        client = Connection(Side.CLIENT)
        client.send_text(b"", fin=False)
        with self.assertRaises(ProtocolError) as raised:
            client.send_text(b"", fin=False)
        self.assertEqual(str(raised.exception), "expected a continuation frame")

    def test_server_sends_unexpected_text(self):
        server = Connection(Side.SERVER)
        server.send_text(b"", fin=False)
        with self.assertRaises(ProtocolError) as raised:
            server.send_text(b"", fin=False)
        self.assertEqual(str(raised.exception), "expected a continuation frame")

    def test_client_receives_unexpected_text(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x01\x00")
        self.assertFrameReceived(
            client,
            Frame(False, OP_TEXT, b""),
        )
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x01\x00")
        self.assertEqual(str(raised.exception), "expected a continuation frame")
        self.assertConnectionFailing(client, 1002, "expected a continuation frame")

    def test_server_receives_unexpected_text(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x01\x80\x00\x00\x00\x00")
        self.assertFrameReceived(
            server,
            Frame(False, OP_TEXT, b""),
        )
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x01\x80\x00\x00\x00\x00")
        self.assertEqual(str(raised.exception), "expected a continuation frame")
        self.assertConnectionFailing(server, 1002, "expected a continuation frame")

    def test_client_sends_text_after_sending_close(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_close(1001)
        self.assertEqual(client.data_to_send(), [b"\x88\x82\x00\x00\x00\x00\x03\xe9"])
        with self.assertRaises(InvalidState):
            client.send_text(b"")

    def test_server_sends_text_after_sending_close(self):
        server = Connection(Side.SERVER)
        server.send_close(1000)
        self.assertEqual(server.data_to_send(), [b"\x88\x02\x03\xe8", b""])
        with self.assertRaises(InvalidState):
            server.send_text(b"")

    def test_client_receives_text_after_receiving_close(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x02\x03\xe8")
        self.assertConnectionClosing(client, 1000)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x81\x00")
        self.assertEqual(str(raised.exception), "data frame after close frame")

    def test_server_receives_text_after_receiving_close(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x82\x00\x00\x00\x00\x03\xe9")
        self.assertConnectionClosing(server, 1001)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x81\x80\x00\xff\x00\xff")
        self.assertEqual(str(raised.exception), "data frame after close frame")


class BinaryTests(ConnectionTestCase):
    """
    Test binary frames and continuation frames.

    """

    def test_client_sends_binary(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_binary(b"\x01\x02\xfe\xff")
        self.assertEqual(
            client.data_to_send(), [b"\x82\x84\x00\x00\x00\x00\x01\x02\xfe\xff"]
        )

    def test_server_sends_binary(self):
        server = Connection(Side.SERVER)
        server.send_binary(b"\x01\x02\xfe\xff")
        self.assertEqual(server.data_to_send(), [b"\x82\x04\x01\x02\xfe\xff"])

    def test_client_receives_binary(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x82\x04\x01\x02\xfe\xff")
        self.assertFrameReceived(
            client,
            Frame(True, OP_BINARY, b"\x01\x02\xfe\xff"),
        )

    def test_server_receives_binary(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x82\x84\x00\x00\x00\x00\x01\x02\xfe\xff")
        self.assertFrameReceived(
            server,
            Frame(True, OP_BINARY, b"\x01\x02\xfe\xff"),
        )

    def test_client_receives_binary_over_size_limit(self):
        client = Connection(Side.CLIENT, max_size=3)
        with self.assertRaises(PayloadTooBig) as raised:
            client.receive_data(b"\x82\x04\x01\x02\xfe\xff")
        self.assertEqual(str(raised.exception), "over size limit (4 > 3 bytes)")
        self.assertConnectionFailing(client, 1009, "over size limit (4 > 3 bytes)")

    def test_server_receives_binary_over_size_limit(self):
        server = Connection(Side.SERVER, max_size=3)
        with self.assertRaises(PayloadTooBig) as raised:
            server.receive_data(b"\x82\x84\x00\x00\x00\x00\x01\x02\xfe\xff")
        self.assertEqual(str(raised.exception), "over size limit (4 > 3 bytes)")
        self.assertConnectionFailing(server, 1009, "over size limit (4 > 3 bytes)")

    def test_client_sends_fragmented_binary(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_binary(b"\x01\x02", fin=False)
        self.assertEqual(client.data_to_send(), [b"\x02\x82\x00\x00\x00\x00\x01\x02"])
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_continuation(b"\xee\xff\x01\x02", fin=False)
        self.assertEqual(
            client.data_to_send(), [b"\x00\x84\x00\x00\x00\x00\xee\xff\x01\x02"]
        )
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_continuation(b"\xee\xff", fin=True)
        self.assertEqual(client.data_to_send(), [b"\x80\x82\x00\x00\x00\x00\xee\xff"])

    def test_server_sends_fragmented_binary(self):
        server = Connection(Side.SERVER)
        server.send_binary(b"\x01\x02", fin=False)
        self.assertEqual(server.data_to_send(), [b"\x02\x02\x01\x02"])
        server.send_continuation(b"\xee\xff\x01\x02", fin=False)
        self.assertEqual(server.data_to_send(), [b"\x00\x04\xee\xff\x01\x02"])
        server.send_continuation(b"\xee\xff", fin=True)
        self.assertEqual(server.data_to_send(), [b"\x80\x02\xee\xff"])

    def test_client_receives_fragmented_binary(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x02\x02\x01\x02")
        self.assertFrameReceived(
            client,
            Frame(False, OP_BINARY, b"\x01\x02"),
        )
        client.receive_data(b"\x00\x04\xfe\xff\x01\x02")
        self.assertFrameReceived(
            client,
            Frame(False, OP_CONT, b"\xfe\xff\x01\x02"),
        )
        client.receive_data(b"\x80\x02\xfe\xff")
        self.assertFrameReceived(
            client,
            Frame(True, OP_CONT, b"\xfe\xff"),
        )

    def test_server_receives_fragmented_binary(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x02\x82\x00\x00\x00\x00\x01\x02")
        self.assertFrameReceived(
            server,
            Frame(False, OP_BINARY, b"\x01\x02"),
        )
        server.receive_data(b"\x00\x84\x00\x00\x00\x00\xee\xff\x01\x02")
        self.assertFrameReceived(
            server,
            Frame(False, OP_CONT, b"\xee\xff\x01\x02"),
        )
        server.receive_data(b"\x80\x82\x00\x00\x00\x00\xfe\xff")
        self.assertFrameReceived(
            server,
            Frame(True, OP_CONT, b"\xfe\xff"),
        )

    def test_client_receives_fragmented_binary_over_size_limit(self):
        client = Connection(Side.CLIENT, max_size=3)
        client.receive_data(b"\x02\x02\x01\x02")
        self.assertFrameReceived(
            client,
            Frame(False, OP_BINARY, b"\x01\x02"),
        )
        with self.assertRaises(PayloadTooBig) as raised:
            client.receive_data(b"\x80\x02\xfe\xff")
        self.assertEqual(str(raised.exception), "over size limit (2 > 1 bytes)")
        self.assertConnectionFailing(client, 1009, "over size limit (2 > 1 bytes)")

    def test_server_receives_fragmented_binary_over_size_limit(self):
        server = Connection(Side.SERVER, max_size=3)
        server.receive_data(b"\x02\x82\x00\x00\x00\x00\x01\x02")
        self.assertFrameReceived(
            server,
            Frame(False, OP_BINARY, b"\x01\x02"),
        )
        with self.assertRaises(PayloadTooBig) as raised:
            server.receive_data(b"\x80\x82\x00\x00\x00\x00\xfe\xff")
        self.assertEqual(str(raised.exception), "over size limit (2 > 1 bytes)")
        self.assertConnectionFailing(server, 1009, "over size limit (2 > 1 bytes)")

    def test_client_sends_unexpected_binary(self):
        client = Connection(Side.CLIENT)
        client.send_binary(b"", fin=False)
        with self.assertRaises(ProtocolError) as raised:
            client.send_binary(b"", fin=False)
        self.assertEqual(str(raised.exception), "expected a continuation frame")

    def test_server_sends_unexpected_binary(self):
        server = Connection(Side.SERVER)
        server.send_binary(b"", fin=False)
        with self.assertRaises(ProtocolError) as raised:
            server.send_binary(b"", fin=False)
        self.assertEqual(str(raised.exception), "expected a continuation frame")

    def test_client_receives_unexpected_binary(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x02\x00")
        self.assertFrameReceived(
            client,
            Frame(False, OP_BINARY, b""),
        )
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x02\x00")
        self.assertEqual(str(raised.exception), "expected a continuation frame")
        self.assertConnectionFailing(client, 1002, "expected a continuation frame")

    def test_server_receives_unexpected_binary(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x02\x80\x00\x00\x00\x00")
        self.assertFrameReceived(
            server,
            Frame(False, OP_BINARY, b""),
        )
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x02\x80\x00\x00\x00\x00")
        self.assertEqual(str(raised.exception), "expected a continuation frame")
        self.assertConnectionFailing(server, 1002, "expected a continuation frame")

    def test_client_sends_binary_after_sending_close(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_close(1001)
        self.assertEqual(client.data_to_send(), [b"\x88\x82\x00\x00\x00\x00\x03\xe9"])
        with self.assertRaises(InvalidState):
            client.send_binary(b"")

    def test_server_sends_binary_after_sending_close(self):
        server = Connection(Side.SERVER)
        server.send_close(1000)
        self.assertEqual(server.data_to_send(), [b"\x88\x02\x03\xe8", b""])
        with self.assertRaises(InvalidState):
            server.send_binary(b"")

    def test_client_receives_binary_after_receiving_close(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x02\x03\xe8")
        self.assertConnectionClosing(client, 1000)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x82\x00")
        self.assertEqual(str(raised.exception), "data frame after close frame")

    def test_server_receives_binary_after_receiving_close(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x82\x00\x00\x00\x00\x03\xe9")
        self.assertConnectionClosing(server, 1001)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x82\x80\x00\xff\x00\xff")
        self.assertEqual(str(raised.exception), "data frame after close frame")


class CloseTests(ConnectionTestCase):
    """
    Test close frames. See 5.5.1. Close in RFC 6544.

    """

    def test_client_sends_close(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x3c\x3c\x3c\x3c"):
            client.send_close()
        self.assertEqual(client.data_to_send(), [b"\x88\x80\x3c\x3c\x3c\x3c"])
        self.assertIs(client.state, State.CLOSING)

    def test_server_sends_close(self):
        server = Connection(Side.SERVER)
        server.send_close()
        self.assertEqual(server.data_to_send(), [b"\x88\x00", b""])
        self.assertIs(server.state, State.CLOSING)

    def test_client_receives_close(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x3c\x3c\x3c\x3c"):
            client.receive_data(b"\x88\x00")
        self.assertEqual(client.events_received(), [Frame(True, OP_CLOSE, b"")])
        self.assertEqual(client.data_to_send(), [b"\x88\x80\x3c\x3c\x3c\x3c"])
        self.assertIs(client.state, State.CLOSING)

    def test_server_receives_close(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x80\x3c\x3c\x3c\x3c")
        self.assertEqual(server.events_received(), [Frame(True, OP_CLOSE, b"")])
        self.assertEqual(server.data_to_send(), [b"\x88\x00", b""])
        self.assertIs(server.state, State.CLOSING)

    def test_client_sends_close_then_receives_close(self):
        # Client-initiated close handshake on the client side.
        client = Connection(Side.CLIENT)

        client.send_close()
        self.assertFrameReceived(client, None)
        self.assertFrameSent(client, Frame(True, OP_CLOSE, b""))

        client.receive_data(b"\x88\x00")
        self.assertFrameReceived(client, Frame(True, OP_CLOSE, b""))
        self.assertFrameSent(client, None)

        client.receive_eof()
        self.assertFrameReceived(client, None)
        self.assertFrameSent(client, None, eof=True)

    def test_server_sends_close_then_receives_close(self):
        # Server-initiated close handshake on the server side.
        server = Connection(Side.SERVER)

        server.send_close()
        self.assertFrameReceived(server, None)
        self.assertFrameSent(server, Frame(True, OP_CLOSE, b""), eof=True)

        server.receive_data(b"\x88\x80\x3c\x3c\x3c\x3c")
        self.assertFrameReceived(server, Frame(True, OP_CLOSE, b""))
        self.assertFrameSent(server, None)

        server.receive_eof()
        self.assertFrameReceived(server, None)
        self.assertFrameSent(server, None)

    def test_client_receives_close_then_sends_close(self):
        # Server-initiated close handshake on the client side.
        client = Connection(Side.CLIENT)

        client.receive_data(b"\x88\x00")
        self.assertFrameReceived(client, Frame(True, OP_CLOSE, b""))
        self.assertFrameSent(client, Frame(True, OP_CLOSE, b""))

        client.receive_eof()
        self.assertFrameReceived(client, None)
        self.assertFrameSent(client, None, eof=True)

    def test_server_receives_close_then_sends_close(self):
        # Client-initiated close handshake on the server side.
        server = Connection(Side.SERVER)

        server.receive_data(b"\x88\x80\x3c\x3c\x3c\x3c")
        self.assertFrameReceived(server, Frame(True, OP_CLOSE, b""))
        self.assertFrameSent(server, Frame(True, OP_CLOSE, b""), eof=True)

        server.receive_eof()
        self.assertFrameReceived(server, None)
        self.assertFrameSent(server, None)

    def test_client_sends_close_with_code(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_close(1001)
        self.assertEqual(client.data_to_send(), [b"\x88\x82\x00\x00\x00\x00\x03\xe9"])
        self.assertIs(client.state, State.CLOSING)

    def test_server_sends_close_with_code(self):
        server = Connection(Side.SERVER)
        server.send_close(1000)
        self.assertEqual(server.data_to_send(), [b"\x88\x02\x03\xe8", b""])
        self.assertIs(server.state, State.CLOSING)

    def test_client_receives_close_with_code(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x02\x03\xe8")
        self.assertConnectionClosing(client, 1000, "")
        self.assertIs(client.state, State.CLOSING)

    def test_server_receives_close_with_code(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x82\x00\x00\x00\x00\x03\xe9")
        self.assertConnectionClosing(server, 1001, "")
        self.assertIs(server.state, State.CLOSING)

    def test_client_sends_close_with_code_and_reason(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_close(1001, "going away")
        self.assertEqual(
            client.data_to_send(), [b"\x88\x8c\x00\x00\x00\x00\x03\xe9going away"]
        )
        self.assertIs(client.state, State.CLOSING)

    def test_server_sends_close_with_code_and_reason(self):
        server = Connection(Side.SERVER)
        server.send_close(1000, "OK")
        self.assertEqual(server.data_to_send(), [b"\x88\x04\x03\xe8OK", b""])
        self.assertIs(server.state, State.CLOSING)

    def test_client_receives_close_with_code_and_reason(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x04\x03\xe8OK")
        self.assertConnectionClosing(client, 1000, "OK")
        self.assertIs(client.state, State.CLOSING)

    def test_server_receives_close_with_code_and_reason(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x8c\x00\x00\x00\x00\x03\xe9going away")
        self.assertConnectionClosing(server, 1001, "going away")
        self.assertIs(server.state, State.CLOSING)

    def test_client_sends_close_with_reason_only(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ValueError) as raised:
            client.send_close(reason="going away")
        self.assertEqual(str(raised.exception), "cannot send a reason without a code")

    def test_server_sends_close_with_reason_only(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ValueError) as raised:
            server.send_close(reason="OK")
        self.assertEqual(str(raised.exception), "cannot send a reason without a code")

    def test_client_receives_close_with_truncated_code(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x88\x01\x03")
        self.assertEqual(str(raised.exception), "close frame too short")
        self.assertConnectionFailing(client, 1002, "close frame too short")
        self.assertIs(client.state, State.CLOSING)

    def test_server_receives_close_with_truncated_code(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x88\x81\x00\x00\x00\x00\x03")
        self.assertEqual(str(raised.exception), "close frame too short")
        self.assertConnectionFailing(server, 1002, "close frame too short")
        self.assertIs(server.state, State.CLOSING)

    def test_client_receives_close_with_non_utf8_reason(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(UnicodeDecodeError) as raised:
            client.receive_data(b"\x88\x04\x03\xe8\xff\xff")
        self.assertEqual(
            str(raised.exception),
            "'utf-8' codec can't decode byte 0xff in position 0: invalid start byte",
        )
        self.assertConnectionFailing(client, 1007, "invalid start byte at position 0")
        self.assertIs(client.state, State.CLOSING)

    def test_server_receives_close_with_non_utf8_reason(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(UnicodeDecodeError) as raised:
            server.receive_data(b"\x88\x84\x00\x00\x00\x00\x03\xe9\xff\xff")
        self.assertEqual(
            str(raised.exception),
            "'utf-8' codec can't decode byte 0xff in position 0: invalid start byte",
        )
        self.assertConnectionFailing(server, 1007, "invalid start byte at position 0")
        self.assertIs(server.state, State.CLOSING)


class PingTests(ConnectionTestCase):
    """
    Test ping. See 5.5.2. Ping in RFC 6544.

    """

    def test_client_sends_ping(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x44\x88\xcc"):
            client.send_ping(b"")
        self.assertEqual(client.data_to_send(), [b"\x89\x80\x00\x44\x88\xcc"])

    def test_server_sends_ping(self):
        server = Connection(Side.SERVER)
        server.send_ping(b"")
        self.assertEqual(server.data_to_send(), [b"\x89\x00"])

    def test_client_receives_ping(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x89\x00")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PING, b""),
        )
        self.assertFrameSent(
            client,
            Frame(True, OP_PONG, b""),
        )

    def test_server_receives_ping(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x89\x80\x00\x44\x88\xcc")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PING, b""),
        )
        self.assertFrameSent(
            server,
            Frame(True, OP_PONG, b""),
        )

    def test_client_sends_ping_with_data(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x44\x88\xcc"):
            client.send_ping(b"\x22\x66\xaa\xee")
        self.assertEqual(
            client.data_to_send(), [b"\x89\x84\x00\x44\x88\xcc\x22\x22\x22\x22"]
        )

    def test_server_sends_ping_with_data(self):
        server = Connection(Side.SERVER)
        server.send_ping(b"\x22\x66\xaa\xee")
        self.assertEqual(server.data_to_send(), [b"\x89\x04\x22\x66\xaa\xee"])

    def test_client_receives_ping_with_data(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x89\x04\x22\x66\xaa\xee")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PING, b"\x22\x66\xaa\xee"),
        )
        self.assertFrameSent(
            client,
            Frame(True, OP_PONG, b"\x22\x66\xaa\xee"),
        )

    def test_server_receives_ping_with_data(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x89\x84\x00\x44\x88\xcc\x22\x22\x22\x22")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PING, b"\x22\x66\xaa\xee"),
        )
        self.assertFrameSent(
            server,
            Frame(True, OP_PONG, b"\x22\x66\xaa\xee"),
        )

    def test_client_sends_fragmented_ping_frame(self):
        client = Connection(Side.CLIENT)
        # This is only possible through a private API.
        with self.assertRaises(ProtocolError) as raised:
            client.send_frame(Frame(False, OP_PING, b""))
        self.assertEqual(str(raised.exception), "fragmented control frame")

    def test_server_sends_fragmented_ping_frame(self):
        server = Connection(Side.SERVER)
        # This is only possible through a private API.
        with self.assertRaises(ProtocolError) as raised:
            server.send_frame(Frame(False, OP_PING, b""))
        self.assertEqual(str(raised.exception), "fragmented control frame")

    def test_client_receives_fragmented_ping_frame(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x09\x00")
        self.assertEqual(str(raised.exception), "fragmented control frame")
        self.assertConnectionFailing(client, 1002, "fragmented control frame")

    def test_server_receives_fragmented_ping_frame(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x09\x80\x3c\x3c\x3c\x3c")
        self.assertEqual(str(raised.exception), "fragmented control frame")
        self.assertConnectionFailing(server, 1002, "fragmented control frame")

    def test_client_sends_ping_after_sending_close(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_close(1001)
        self.assertEqual(client.data_to_send(), [b"\x88\x82\x00\x00\x00\x00\x03\xe9"])
        # The spec says: "An endpoint MAY send a Ping frame any time (...)
        # before the connection is closed" but websockets doesn't support
        # sending a Ping frame after a Close frame.
        with self.assertRaises(InvalidState) as raised:
            client.send_ping(b"")
        self.assertEqual(
            str(raised.exception), "cannot write to a WebSocket in the CLOSING state"
        )

    def test_server_sends_ping_after_sending_close(self):
        server = Connection(Side.SERVER)
        server.send_close(1000)
        self.assertEqual(server.data_to_send(), [b"\x88\x02\x03\xe8", b""])
        # The spec says: "An endpoint MAY send a Ping frame any time (...)
        # before the connection is closed" but websockets doesn't support
        # sending a Ping frame after a Close frame.
        with self.assertRaises(InvalidState) as raised:
            server.send_ping(b"")
        self.assertEqual(
            str(raised.exception), "cannot write to a WebSocket in the CLOSING state"
        )

    def test_client_receives_ping_after_receiving_close(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x02\x03\xe8")
        self.assertConnectionClosing(client, 1000)
        client.receive_data(b"\x89\x04\x22\x66\xaa\xee")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PING, b"\x22\x66\xaa\xee"),
        )
        self.assertFrameSent(client, None)

    def test_server_receives_ping_after_receiving_close(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x82\x00\x00\x00\x00\x03\xe9")
        self.assertConnectionClosing(server, 1001)
        server.receive_data(b"\x89\x84\x00\x44\x88\xcc\x22\x22\x22\x22")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PING, b"\x22\x66\xaa\xee"),
        )
        self.assertFrameSent(server, None)


class PongTests(ConnectionTestCase):
    """
    Test pong frames. See 5.5.3. Pong in RFC 6544.

    """

    def test_client_sends_pong(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x44\x88\xcc"):
            client.send_pong(b"")
        self.assertEqual(client.data_to_send(), [b"\x8a\x80\x00\x44\x88\xcc"])

    def test_server_sends_pong(self):
        server = Connection(Side.SERVER)
        server.send_pong(b"")
        self.assertEqual(server.data_to_send(), [b"\x8a\x00"])

    def test_client_receives_pong(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x8a\x00")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PONG, b""),
        )

    def test_server_receives_pong(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x8a\x80\x00\x44\x88\xcc")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PONG, b""),
        )

    def test_client_sends_pong_with_data(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x44\x88\xcc"):
            client.send_pong(b"\x22\x66\xaa\xee")
        self.assertEqual(
            client.data_to_send(), [b"\x8a\x84\x00\x44\x88\xcc\x22\x22\x22\x22"]
        )

    def test_server_sends_pong_with_data(self):
        server = Connection(Side.SERVER)
        server.send_pong(b"\x22\x66\xaa\xee")
        self.assertEqual(server.data_to_send(), [b"\x8a\x04\x22\x66\xaa\xee"])

    def test_client_receives_pong_with_data(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x8a\x04\x22\x66\xaa\xee")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PONG, b"\x22\x66\xaa\xee"),
        )

    def test_server_receives_pong_with_data(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x8a\x84\x00\x44\x88\xcc\x22\x22\x22\x22")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PONG, b"\x22\x66\xaa\xee"),
        )

    def test_client_sends_fragmented_pong_frame(self):
        client = Connection(Side.CLIENT)
        # This is only possible through a private API.
        with self.assertRaises(ProtocolError) as raised:
            client.send_frame(Frame(False, OP_PONG, b""))
        self.assertEqual(str(raised.exception), "fragmented control frame")

    def test_server_sends_fragmented_pong_frame(self):
        server = Connection(Side.SERVER)
        # This is only possible through a private API.
        with self.assertRaises(ProtocolError) as raised:
            server.send_frame(Frame(False, OP_PONG, b""))
        self.assertEqual(str(raised.exception), "fragmented control frame")

    def test_client_receives_fragmented_pong_frame(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x0a\x00")
        self.assertEqual(str(raised.exception), "fragmented control frame")
        self.assertConnectionFailing(client, 1002, "fragmented control frame")

    def test_server_receives_fragmented_pong_frame(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x0a\x80\x3c\x3c\x3c\x3c")
        self.assertEqual(str(raised.exception), "fragmented control frame")
        self.assertConnectionFailing(server, 1002, "fragmented control frame")

    def test_client_sends_pong_after_sending_close(self):
        client = Connection(Side.CLIENT)
        with self.enforce_mask(b"\x00\x00\x00\x00"):
            client.send_close(1001)
        self.assertEqual(client.data_to_send(), [b"\x88\x82\x00\x00\x00\x00\x03\xe9"])
        # websockets doesn't support sending a Pong frame after a Close frame.
        with self.assertRaises(InvalidState):
            client.send_pong(b"")

    def test_server_sends_pong_after_sending_close(self):
        server = Connection(Side.SERVER)
        server.send_close(1000)
        self.assertEqual(server.data_to_send(), [b"\x88\x02\x03\xe8", b""])
        # websockets doesn't support sending a Pong frame after a Close frame.
        with self.assertRaises(InvalidState):
            server.send_pong(b"")

    def test_client_receives_pong_after_receiving_close(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x02\x03\xe8")
        self.assertConnectionClosing(client, 1000)
        client.receive_data(b"\x8a\x04\x22\x66\xaa\xee")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PONG, b"\x22\x66\xaa\xee"),
        )

    def test_server_receives_pong_after_receiving_close(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x82\x00\x00\x00\x00\x03\xe9")
        self.assertConnectionClosing(server, 1001)
        server.receive_data(b"\x8a\x84\x00\x44\x88\xcc\x22\x22\x22\x22")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PONG, b"\x22\x66\xaa\xee"),
        )


class FragmentationTests(ConnectionTestCase):
    """
    Test message fragmentation.

    See 5.4. Fragmentation in RFC 6544.

    """

    def test_client_send_ping_pong_in_fragmented_message(self):
        client = Connection(Side.CLIENT)
        client.send_text(b"Spam", fin=False)
        self.assertFrameSent(client, Frame(False, OP_TEXT, b"Spam"))
        client.send_ping(b"Ping")
        self.assertFrameSent(client, Frame(True, OP_PING, b"Ping"))
        client.send_continuation(b"Ham", fin=False)
        self.assertFrameSent(client, Frame(False, OP_CONT, b"Ham"))
        client.send_pong(b"Pong")
        self.assertFrameSent(client, Frame(True, OP_PONG, b"Pong"))
        client.send_continuation(b"Eggs", fin=True)
        self.assertFrameSent(client, Frame(True, OP_CONT, b"Eggs"))

    def test_server_send_ping_pong_in_fragmented_message(self):
        server = Connection(Side.SERVER)
        server.send_text(b"Spam", fin=False)
        self.assertFrameSent(server, Frame(False, OP_TEXT, b"Spam"))
        server.send_ping(b"Ping")
        self.assertFrameSent(server, Frame(True, OP_PING, b"Ping"))
        server.send_continuation(b"Ham", fin=False)
        self.assertFrameSent(server, Frame(False, OP_CONT, b"Ham"))
        server.send_pong(b"Pong")
        self.assertFrameSent(server, Frame(True, OP_PONG, b"Pong"))
        server.send_continuation(b"Eggs", fin=True)
        self.assertFrameSent(server, Frame(True, OP_CONT, b"Eggs"))

    def test_client_receive_ping_pong_in_fragmented_message(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x01\x04Spam")
        self.assertFrameReceived(
            client,
            Frame(False, OP_TEXT, b"Spam"),
        )
        client.receive_data(b"\x89\x04Ping")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PING, b"Ping"),
        )
        self.assertFrameSent(
            client,
            Frame(True, OP_PONG, b"Ping"),
        )
        client.receive_data(b"\x00\x03Ham")
        self.assertFrameReceived(
            client,
            Frame(False, OP_CONT, b"Ham"),
        )
        client.receive_data(b"\x8a\x04Pong")
        self.assertFrameReceived(
            client,
            Frame(True, OP_PONG, b"Pong"),
        )
        client.receive_data(b"\x80\x04Eggs")
        self.assertFrameReceived(
            client,
            Frame(True, OP_CONT, b"Eggs"),
        )

    def test_server_receive_ping_pong_in_fragmented_message(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x01\x84\x00\x00\x00\x00Spam")
        self.assertFrameReceived(
            server,
            Frame(False, OP_TEXT, b"Spam"),
        )
        server.receive_data(b"\x89\x84\x00\x00\x00\x00Ping")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PING, b"Ping"),
        )
        self.assertFrameSent(
            server,
            Frame(True, OP_PONG, b"Ping"),
        )
        server.receive_data(b"\x00\x83\x00\x00\x00\x00Ham")
        self.assertFrameReceived(
            server,
            Frame(False, OP_CONT, b"Ham"),
        )
        server.receive_data(b"\x8a\x84\x00\x00\x00\x00Pong")
        self.assertFrameReceived(
            server,
            Frame(True, OP_PONG, b"Pong"),
        )
        server.receive_data(b"\x80\x84\x00\x00\x00\x00Eggs")
        self.assertFrameReceived(
            server,
            Frame(True, OP_CONT, b"Eggs"),
        )

    def test_client_send_close_in_fragmented_message(self):
        client = Connection(Side.CLIENT)
        client.send_text(b"Spam", fin=False)
        self.assertFrameSent(client, Frame(False, OP_TEXT, b"Spam"))
        # The spec says: "An endpoint MUST be capable of handling control
        # frames in the middle of a fragmented message." However, since the
        # endpoint must not send a data frame after a close frame, a close
        # frame can't be "in the middle" of a fragmented message.
        with self.assertRaises(ProtocolError) as raised:
            client.send_close(1001)
        self.assertEqual(str(raised.exception), "expected a continuation frame")
        client.send_continuation(b"Eggs", fin=True)

    def test_server_send_close_in_fragmented_message(self):
        server = Connection(Side.CLIENT)
        server.send_text(b"Spam", fin=False)
        self.assertFrameSent(server, Frame(False, OP_TEXT, b"Spam"))
        # The spec says: "An endpoint MUST be capable of handling control
        # frames in the middle of a fragmented message." However, since the
        # endpoint must not send a data frame after a close frame, a close
        # frame can't be "in the middle" of a fragmented message.
        with self.assertRaises(ProtocolError) as raised:
            server.send_close(1000)
        self.assertEqual(str(raised.exception), "expected a continuation frame")

    def test_client_receive_close_in_fragmented_message(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x01\x04Spam")
        self.assertFrameReceived(
            client,
            Frame(False, OP_TEXT, b"Spam"),
        )
        # The spec says: "An endpoint MUST be capable of handling control
        # frames in the middle of a fragmented message." However, since the
        # endpoint must not send a data frame after a close frame, a close
        # frame can't be "in the middle" of a fragmented message.
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\x88\x02\x03\xe8")
        self.assertEqual(str(raised.exception), "incomplete fragmented message")
        self.assertConnectionFailing(client, 1002, "incomplete fragmented message")

    def test_server_receive_close_in_fragmented_message(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x01\x84\x00\x00\x00\x00Spam")
        self.assertFrameReceived(
            server,
            Frame(False, OP_TEXT, b"Spam"),
        )
        # The spec says: "An endpoint MUST be capable of handling control
        # frames in the middle of a fragmented message." However, since the
        # endpoint must not send a data frame after a close frame, a close
        # frame can't be "in the middle" of a fragmented message.
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\x88\x82\x00\x00\x00\x00\x03\xe9")
        self.assertEqual(str(raised.exception), "incomplete fragmented message")
        self.assertConnectionFailing(server, 1002, "incomplete fragmented message")


class EOFTests(ConnectionTestCase):
    """
    Test connection termination.

    """

    def test_client_receives_eof(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x00")
        self.assertConnectionClosing(client)
        client.receive_eof()  # does not raise an exception

    def test_server_receives_eof(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x80\x3c\x3c\x3c\x3c")
        self.assertConnectionClosing(server)
        server.receive_eof()  # does not raise an exception

    def test_client_receives_eof_between_frames(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(EOFError) as raised:
            client.receive_eof()
        self.assertEqual(str(raised.exception), "unexpected end of stream")

    def test_server_receives_eof_between_frames(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(EOFError) as raised:
            server.receive_eof()
        self.assertEqual(str(raised.exception), "unexpected end of stream")

    def test_client_receives_eof_inside_frame(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x81")
        with self.assertRaises(EOFError) as raised:
            client.receive_eof()
        self.assertEqual(
            str(raised.exception), "stream ends after 1 bytes, expected 2 bytes"
        )

    def test_server_receives_eof_inside_frame(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x81")
        with self.assertRaises(EOFError) as raised:
            server.receive_eof()
        self.assertEqual(
            str(raised.exception), "stream ends after 1 bytes, expected 2 bytes"
        )

    def test_client_receives_data_after_exception(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\xff\xff")
        self.assertEqual(str(raised.exception), "invalid opcode")
        with self.assertRaises(RuntimeError) as raised:
            client.receive_data(b"\x00\x00")
        self.assertEqual(
            str(raised.exception), "cannot receive data or EOF after an error"
        )

    def test_server_receives_data_after_exception(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\xff\xff")
        self.assertEqual(str(raised.exception), "invalid opcode")
        with self.assertRaises(RuntimeError) as raised:
            server.receive_data(b"\x00\x00")
        self.assertEqual(
            str(raised.exception), "cannot receive data or EOF after an error"
        )

    def test_client_receives_eof_after_exception(self):
        client = Connection(Side.CLIENT)
        with self.assertRaises(ProtocolError) as raised:
            client.receive_data(b"\xff\xff")
        self.assertEqual(str(raised.exception), "invalid opcode")
        with self.assertRaises(RuntimeError) as raised:
            client.receive_eof()
        self.assertEqual(
            str(raised.exception), "cannot receive data or EOF after an error"
        )

    def test_server_receives_eof_after_exception(self):
        server = Connection(Side.SERVER)
        with self.assertRaises(ProtocolError) as raised:
            server.receive_data(b"\xff\xff")
        self.assertEqual(str(raised.exception), "invalid opcode")
        with self.assertRaises(RuntimeError) as raised:
            server.receive_eof()
        self.assertEqual(
            str(raised.exception), "cannot receive data or EOF after an error"
        )

    def test_client_receives_data_after_eof(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x00")
        self.assertConnectionClosing(client)
        client.receive_eof()
        with self.assertRaises(EOFError) as raised:
            client.receive_data(b"\x88\x00")
        self.assertEqual(str(raised.exception), "stream ended")

    def test_server_receives_data_after_eof(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x80\x3c\x3c\x3c\x3c")
        self.assertConnectionClosing(server)
        server.receive_eof()
        with self.assertRaises(EOFError) as raised:
            server.receive_data(b"\x88\x80\x00\x00\x00\x00")
        self.assertEqual(str(raised.exception), "stream ended")

    def test_client_receives_eof_after_eof(self):
        client = Connection(Side.CLIENT)
        client.receive_data(b"\x88\x00")
        self.assertConnectionClosing(client)
        client.receive_eof()
        with self.assertRaises(EOFError) as raised:
            client.receive_eof()
        self.assertEqual(str(raised.exception), "stream ended")

    def test_server_receives_eof_after_eof(self):
        server = Connection(Side.SERVER)
        server.receive_data(b"\x88\x80\x3c\x3c\x3c\x3c")
        self.assertConnectionClosing(server)
        server.receive_eof()
        with self.assertRaises(EOFError) as raised:
            server.receive_eof()
        self.assertEqual(str(raised.exception), "stream ended")


class ErrorTests(ConnectionTestCase):
    """
    Test other error cases.

    """

    def test_client_hits_internal_error_reading_frame(self):
        client = Connection(Side.CLIENT)
        # This isn't supposed to happen, so we're simulating it.
        with unittest.mock.patch("struct.unpack", side_effect=RuntimeError("BOOM")):
            with self.assertRaises(RuntimeError) as raised:
                client.receive_data(b"\x81\x00")
            self.assertEqual(str(raised.exception), "BOOM")
        self.assertConnectionFailing(client, 1011, "")

    def test_server_hits_internal_error_reading_frame(self):
        server = Connection(Side.SERVER)
        # This isn't supposed to happen, so we're simulating it.
        with unittest.mock.patch("struct.unpack", side_effect=RuntimeError("BOOM")):
            with self.assertRaises(RuntimeError) as raised:
                server.receive_data(b"\x81\x80\x00\x00\x00\x00")
            self.assertEqual(str(raised.exception), "BOOM")
        self.assertConnectionFailing(server, 1011, "")


class ExtensionsTests(ConnectionTestCase):
    """
    Test how extensions affect frames.

    """

    def test_client_extension_encodes_frame(self):
        client = Connection(Side.CLIENT)
        client.extensions = [Rsv2Extension()]
        with self.enforce_mask(b"\x00\x44\x88\xcc"):
            client.send_ping(b"")
        self.assertEqual(client.data_to_send(), [b"\xa9\x80\x00\x44\x88\xcc"])

    def test_server_extension_encodes_frame(self):
        server = Connection(Side.SERVER)
        server.extensions = [Rsv2Extension()]
        server.send_ping(b"")
        self.assertEqual(server.data_to_send(), [b"\xa9\x00"])

    def test_client_extension_decodes_frame(self):
        client = Connection(Side.CLIENT)
        client.extensions = [Rsv2Extension()]
        client.receive_data(b"\xaa\x00")
        self.assertEqual(client.events_received(), [Frame(True, OP_PONG, b"")])

    def test_server_extension_decodes_frame(self):
        server = Connection(Side.SERVER)
        server.extensions = [Rsv2Extension()]
        server.receive_data(b"\xaa\x80\x00\x44\x88\xcc")
        self.assertEqual(server.events_received(), [Frame(True, OP_PONG, b"")])
