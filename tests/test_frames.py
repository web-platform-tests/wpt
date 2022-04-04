import codecs
import unittest
import unittest.mock

from websockets.exceptions import PayloadTooBig, ProtocolError
from websockets.frames import *
from websockets.streams import StreamReader

from .utils import GeneratorTestCase


class FramesTestCase(GeneratorTestCase):
    def enforce_mask(self, mask):
        return unittest.mock.patch("secrets.token_bytes", return_value=mask)

    def parse(self, data, mask, max_size=None, extensions=None):
        """
        Parse a frame from a bytestring.

        """
        reader = StreamReader()
        reader.feed_data(data)
        reader.feed_eof()
        parser = Frame.parse(
            reader.read_exact, mask=mask, max_size=max_size, extensions=extensions
        )
        return self.assertGeneratorReturns(parser)

    def assertFrameData(self, frame, data, mask, extensions=None):
        """
        Serializing frame yields data. Parsing data yields frame.

        """
        # Compare frames first, because test failures are easier to read,
        # especially when mask = True.
        parsed = self.parse(data, mask=mask, extensions=extensions)
        self.assertEqual(parsed, frame)

        # Make masking deterministic by reusing the same "random" mask.
        # This has an effect only when mask is True.
        mask_bytes = data[2:6] if mask else b""
        with self.enforce_mask(mask_bytes):
            serialized = frame.serialize(mask=mask, extensions=extensions)
        self.assertEqual(serialized, data)


class FrameTests(FramesTestCase):
    def test_text_unmasked(self):
        self.assertFrameData(
            Frame(True, OP_TEXT, b"Spam"),
            b"\x81\x04Spam",
            mask=False,
        )

    def test_text_masked(self):
        self.assertFrameData(
            Frame(True, OP_TEXT, b"Spam"),
            b"\x81\x84\x5b\xfb\xe1\xa8\x08\x8b\x80\xc5",
            mask=True,
        )

    def test_binary_unmasked(self):
        self.assertFrameData(
            Frame(True, OP_BINARY, b"Eggs"),
            b"\x82\x04Eggs",
            mask=False,
        )

    def test_binary_masked(self):
        self.assertFrameData(
            Frame(True, OP_BINARY, b"Eggs"),
            b"\x82\x84\x53\xcd\xe2\x89\x16\xaa\x85\xfa",
            mask=True,
        )

    def test_non_ascii_text_unmasked(self):
        self.assertFrameData(
            Frame(True, OP_TEXT, "café".encode("utf-8")),
            b"\x81\x05caf\xc3\xa9",
            mask=False,
        )

    def test_non_ascii_text_masked(self):
        self.assertFrameData(
            Frame(True, OP_TEXT, "café".encode("utf-8")),
            b"\x81\x85\x64\xbe\xee\x7e\x07\xdf\x88\xbd\xcd",
            mask=True,
        )

    def test_close(self):
        self.assertFrameData(
            Frame(True, OP_CLOSE, b""),
            b"\x88\x00",
            mask=False,
        )

    def test_ping(self):
        self.assertFrameData(
            Frame(True, OP_PING, b"ping"),
            b"\x89\x04ping",
            mask=False,
        )

    def test_pong(self):
        self.assertFrameData(
            Frame(True, OP_PONG, b"pong"),
            b"\x8a\x04pong",
            mask=False,
        )

    def test_long(self):
        self.assertFrameData(
            Frame(True, OP_BINARY, 126 * b"a"),
            b"\x82\x7e\x00\x7e" + 126 * b"a",
            mask=False,
        )

    def test_very_long(self):
        self.assertFrameData(
            Frame(True, OP_BINARY, 65536 * b"a"),
            b"\x82\x7f\x00\x00\x00\x00\x00\x01\x00\x00" + 65536 * b"a",
            mask=False,
        )

    def test_payload_too_big(self):
        with self.assertRaises(PayloadTooBig):
            self.parse(b"\x82\x7e\x04\x01" + 1025 * b"a", mask=False, max_size=1024)

    def test_bad_reserved_bits(self):
        for data in [b"\xc0\x00", b"\xa0\x00", b"\x90\x00"]:
            with self.subTest(data=data):
                with self.assertRaises(ProtocolError):
                    self.parse(data, mask=False)

    def test_good_opcode(self):
        for opcode in list(range(0x00, 0x03)) + list(range(0x08, 0x0B)):
            data = bytes([0x80 | opcode, 0])
            with self.subTest(data=data):
                self.parse(data, mask=False)  # does not raise an exception

    def test_bad_opcode(self):
        for opcode in list(range(0x03, 0x08)) + list(range(0x0B, 0x10)):
            data = bytes([0x80 | opcode, 0])
            with self.subTest(data=data):
                with self.assertRaises(ProtocolError):
                    self.parse(data, mask=False)

    def test_mask_flag(self):
        # Mask flag correctly set.
        self.parse(b"\x80\x80\x00\x00\x00\x00", mask=True)
        # Mask flag incorrectly unset.
        with self.assertRaises(ProtocolError):
            self.parse(b"\x80\x80\x00\x00\x00\x00", mask=False)
        # Mask flag correctly unset.
        self.parse(b"\x80\x00", mask=False)
        # Mask flag incorrectly set.
        with self.assertRaises(ProtocolError):
            self.parse(b"\x80\x00", mask=True)

    def test_control_frame_max_length(self):
        # At maximum allowed length.
        self.parse(b"\x88\x7e\x00\x7d" + 125 * b"a", mask=False)
        # Above maximum allowed length.
        with self.assertRaises(ProtocolError):
            self.parse(b"\x88\x7e\x00\x7e" + 126 * b"a", mask=False)

    def test_fragmented_control_frame(self):
        # Fin bit correctly set.
        self.parse(b"\x88\x00", mask=False)
        # Fin bit incorrectly unset.
        with self.assertRaises(ProtocolError):
            self.parse(b"\x08\x00", mask=False)

    def test_extensions(self):
        class Rot13:
            @staticmethod
            def encode(frame):
                assert frame.opcode == OP_TEXT
                text = frame.data.decode()
                data = codecs.encode(text, "rot13").encode()
                return frame._replace(data=data)

            # This extensions is symmetrical.
            @staticmethod
            def decode(frame, *, max_size=None):
                return Rot13.encode(frame)

        self.assertFrameData(
            Frame(True, OP_TEXT, b"hello"),
            b"\x81\x05uryyb",
            mask=False,
            extensions=[Rot13()],
        )


class PrepareDataTests(unittest.TestCase):
    def test_prepare_data_str(self):
        self.assertEqual(
            prepare_data("café"),
            (OP_TEXT, b"caf\xc3\xa9"),
        )

    def test_prepare_data_bytes(self):
        self.assertEqual(
            prepare_data(b"tea"),
            (OP_BINARY, b"tea"),
        )

    def test_prepare_data_bytearray(self):
        self.assertEqual(
            prepare_data(bytearray(b"tea")),
            (OP_BINARY, bytearray(b"tea")),
        )

    def test_prepare_data_memoryview(self):
        self.assertEqual(
            prepare_data(memoryview(b"tea")),
            (OP_BINARY, memoryview(b"tea")),
        )

    def test_prepare_data_list(self):
        with self.assertRaises(TypeError):
            prepare_data([])

    def test_prepare_data_none(self):
        with self.assertRaises(TypeError):
            prepare_data(None)


class PrepareCtrlTests(unittest.TestCase):
    def test_prepare_ctrl_str(self):
        self.assertEqual(prepare_ctrl("café"), b"caf\xc3\xa9")

    def test_prepare_ctrl_bytes(self):
        self.assertEqual(prepare_ctrl(b"tea"), b"tea")

    def test_prepare_ctrl_bytearray(self):
        self.assertEqual(prepare_ctrl(bytearray(b"tea")), b"tea")

    def test_prepare_ctrl_memoryview(self):
        self.assertEqual(prepare_ctrl(memoryview(b"tea")), b"tea")

    def test_prepare_ctrl_list(self):
        with self.assertRaises(TypeError):
            prepare_ctrl([])

    def test_prepare_ctrl_none(self):
        with self.assertRaises(TypeError):
            prepare_ctrl(None)


class ParseAndSerializeCloseTests(unittest.TestCase):
    def assertCloseData(self, code, reason, data):
        """
        Serializing code / reason yields data. Parsing data yields code / reason.

        """
        serialized = serialize_close(code, reason)
        self.assertEqual(serialized, data)
        parsed = parse_close(data)
        self.assertEqual(parsed, (code, reason))

    def test_parse_close_and_serialize_close(self):
        self.assertCloseData(1000, "", b"\x03\xe8")
        self.assertCloseData(1000, "OK", b"\x03\xe8OK")

    def test_parse_close_empty(self):
        self.assertEqual(parse_close(b""), (1005, ""))

    def test_parse_close_errors(self):
        with self.assertRaises(ProtocolError):
            parse_close(b"\x03")
        with self.assertRaises(ProtocolError):
            parse_close(b"\x03\xe7")
        with self.assertRaises(UnicodeDecodeError):
            parse_close(b"\x03\xe8\xff\xff")

    def test_serialize_close_errors(self):
        with self.assertRaises(ProtocolError):
            serialize_close(999, "")
