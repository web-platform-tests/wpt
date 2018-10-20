# -*- coding: utf-8 -*-

import pytest

from lomond.frame import Frame
from lomond.frame_parser import ClientFrameParser, FrameParser
from lomond.opcode import Opcode
from lomond.parser import ParseError
from lomond.errors import PayloadTooLarge, ProtocolError


def test_default_constructor():
    # not really profound, but nevertheless .
    parser = FrameParser()
    str(parser)
    assert isinstance(parser, FrameParser)


def test_parse_valid_frames():
    # let's construct a very simple frame, with Opcode.TEXT, of length=1
    # so:
    # 1   0 0 0   0001 | 1 000001 |
    # -   -----   ----   - ------
    # |     |       |    |   +----- Payload length
    # |     |       |    +--------- Masking bit
    # |     |       +-------------- Opcode
    # |     +---------------------- RSV{1,2,3}
    # +---------------------------- FIN
    #
    # 00000000 00000000 00000000 00000000 | 01000001
    # -----------------------------------   --------
    #                   |                      +---- Payload (letter A)
    #                   +--------------------------- Mask
    # the above frame yields 7 bytes:

    data = b'\x81\x81\x00\x00\x00\x00A'
    parser = FrameParser(parse_headers=False, validate=False)
    parsed = list(parser.feed(data))

    assert len(parsed) == 1
    assert parsed[0].opcode == Opcode.TEXT
    assert len(parsed[0]) == 1
    assert parsed[0].payload == b'A'


def test_frame_with_length_gt_125():
    # the frame will start exactly the same
    data = b'\x81\xfe\x00\x7e\x00\x00\x00\x00'
    #              ^   ^^^^^
    #              |     +--  126, encoded as uint16_t
    #              +--------  1 << 7 | 126, then turned into hex
    # we also append the actual payload
    data += b'\x41' * 126

    parser = FrameParser(parse_headers=False, validate=False)
    parsed = list(parser.feed(data))

    assert len(parsed) == 1
    assert parsed[0].opcode == Opcode.TEXT
    assert len(parsed[0]) == 126
    assert parsed[0].payload == b'A' * 126


def test_frame_with_length_gt_2__16():
    # please note that we don't actually *have to* construct a payload with
    # length greater than 2**16, we simply need to encode the length as
    # uint64_t for the code to work.
    data = b'\x81\xff\x00\x00\x00\x00\x00\x00\x00\x7e\x00\x00\x00\x00'
    #              ^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    #              |     +----------------  126, encoded as uint64_t
    #              +----------------------  1 << 7 | 127, then turned into hex
    # we also append the actual payload
    data += b'\x41' * 126
    parser = FrameParser(parse_headers=False, validate=False)
    parsed = list(parser.feed(data))
    assert len(parsed) == 1
    assert parsed[0].opcode == Opcode.TEXT
    assert len(parsed[0]) == 126
    assert parsed[0].payload == b'A' * 126


def test_too_large_payload():
    # here we construct the header with 2**63 which is above the limit allowed
    # by the spec.
    data = b'\x81\xff\x80\x00\x00\x00\x00\x00\x00\x00'
    #              ^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    #              |     +----------------  1 << 63, encoded as uint64_t
    #              +----------------------  1 << 7 | 127, then turned into hex
    # the payload above is missing the mas bytes, but we don't have to worry
    # about that because the parser will discard the length anyway
    with pytest.raises(PayloadTooLarge):
        parser = FrameParser(parse_headers=False, validate=False)
        list(parser.feed(data))


def test_payload_with_headers():
    data = b'Connection:Keep-Alive\r\nUser-Agent:Test\r\n\r\n\x81\x81\x00\x00\x00\x00A'  # noqa
    parser = FrameParser(validate=False)
    parsed = list(parser.feed(data))

    assert len(parsed) == 2
    assert parsed[0] == b'Connection:Keep-Alive\r\nUser-Agent:Test\r\n\r\n'
    assert parsed[1].opcode == Opcode.TEXT
    assert len(parsed[1]) == 1
    assert parsed[1].payload == b'A'


def test_payload_without_masking_key_set():
    data = b'\x81\x01A'
    parser = FrameParser(parse_headers=False, validate=False)
    parsed = list(parser.feed(data))

    assert len(parsed) == 1
    assert parsed[0].opcode == Opcode.TEXT
    assert parsed[0].payload == b'A'


def test_prohibit_masked_frames():
    parser = ClientFrameParser()
    frame = Frame(1, b'hello')
    with pytest.raises(ProtocolError):
        parser.on_frame(frame)
