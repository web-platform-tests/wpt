from struct import unpack

import pytest
import six
from lomond.errors import ProtocolError
from lomond.frame import CompressedFrame, Frame
from lomond.opcode import Opcode


@pytest.fixture
def frame_factory():
    def inner(opcode=Opcode.TEXT, payload=b'', fin=1):
        return Frame(opcode, payload, fin=fin)

    return inner


def test_constructor():
    frame = Frame(1, b'hello', masking_key=b'mask')
    assert frame.fin
    assert not frame.rsv1
    assert not frame.rsv2
    assert not frame.rsv3
    assert frame.is_masked
    assert frame.is_text
    assert not frame.is_control
    assert not frame.is_binary
    assert not frame.is_continuation
    assert not frame.is_ping
    assert not frame.is_pong
    assert not frame.is_close
    assert frame.to_bytes() == b'\x81\x85mask\x05\x04\x1f\x07\x02'
    frame.validate()


def test_constructor_compressed():
    frame = CompressedFrame(1, b'hello', masking_key=b'mask', rsv1=1)
    assert frame.fin
    assert frame.rsv1
    assert not frame.rsv2
    assert not frame.rsv3
    assert frame.is_masked
    assert frame.is_text
    assert not frame.is_control
    assert not frame.is_binary
    assert not frame.is_continuation
    assert not frame.is_ping
    assert not frame.is_pong
    assert not frame.is_close
    assert frame.to_bytes() == b'\xc1\x85mask\x05\x04\x1f\x07\x02'
    frame.validate()
    with pytest.raises(ProtocolError):
        frame = CompressedFrame(1, b'Hello', rsv1=1, rsv2=1)
        frame.validate()


def test_constructor_no_mask():
    frame = Frame(1, b'hello', mask=False)
    assert frame.to_bytes() == b'\x81\x05hello'


def test_length_of_frame(frame_factory):
    frame = frame_factory(Opcode.TEXT, b'\x00' * 137)
    assert len(frame) == 137


def test_masking_key():
    frame_bytes = Frame.build(
        Opcode.TEXT,
        b'Hello, World',
        masking_key=b'\xaa\xf7\x7f\x00'
    )
    expected = b'\x81\x8c\xaa\xf7\x7f\x00\xe2\x92\x13l\xc5\xdb_W\xc5\x85\x13d'
    assert frame_bytes == expected


def test_repr_of_frame(frame_factory):
    assert repr(frame_factory()) == '<frame TEXT (0 bytes) fin=1>'
    assert repr(
        frame_factory(fin=0)
    ) == '<frame-fragment TEXT (0 bytes) fin=0>'


def test_binary_output_length_smaller_than_126(frame_factory, monkeypatch):
    # please note: we are monkeypatching .frame.make_masking_key because this
    # is where this code gets executed. Basically, at the time this function
    # (this test function which you are reading now) gets executed, the
    # make_masking_key function was already imported, and python created a
    # local reference to it. Thus, we can only monkeypatch the imported
    # reference which is in .frame
    monkeypatch.setattr(
        'lomond.frame.make_masking_key', lambda: b'\x00\x00\x00\x00')
    frame = frame_factory(Opcode.BINARY, payload=b'\x01' * 10)
    frame_binary = frame.to_bytes()

    # ok, here we go, a bit of bitwise arithmetics.
    # the header starts with:
    # fin | rsv{1,2,3} | opcode
    # (1) | (1, 1, 1)  | (4)    (byte's long)
    # so, if we want fin to be the highest significant bit, we have to shift it
    # 7 bits left, like so:
    # fin << 7 which will yield
    # fin 0000000 (7 zeroes)
    # the next 3 bits are zeros and the least significant 4 are the opcode.
    # therefore the first byte should be set to:
    # 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0
    # ^   ^   ^   ^   -------------
    # |   |   |   |         +------  opcode (2 binary is 10)
    # |   |   |   +----------------  rsv3
    # |   |   +--------------------  rsv2
    # |   +------------------------  rsv1
    # +----------------------------  fin

    assert six.indexbytes(frame_binary, 0) == 0b10000010
    # the second byte should be set to mask << 7 | length
    # in our case, the length is 10 (dec) as we have passed '\x01' * 10 as our
    # payload.
    # this is quite elegant solution, because the length has been chosen in
    # such a way that the highest possible value stored in this 7 bits should
    # end with a 1, but note that this can't be 127 (all 1's) because then we
    # wouldn't distinguish it from a value which is much higher than 127 and
    # should be encoded with 16/32/64-bit length
    # so in our case the end result will be :
    # 1 | 0 0 0 1 0 1 0
    # ^   -------------
    # |         +------  length (10 dec)
    # +----------------  masking
    assert six.indexbytes(frame_binary, 1) == 0b10001010
    # the rest of the datagram is very easy. The masking key (4 bytes), but
    # we have set it to '\x00' * 4:
    assert frame_binary[2:6] == b'\x00\x00\x00\x00'
    # and the rest of the frame is the packet:
    assert frame_binary[6:] == frame.payload

    expected_length = 1 + 1 + 4 + 10
    #                 ^   ^   ^   ^
    #                 |   |   |   +--  payload length
    #                 |   |   +------  mask length
    #                 |   +----------  length and mask byte
    #                 +--------------  opcode byte
    assert len(frame_binary) == expected_length


def test_binary_output_length_smaller_or_equal_127(frame_factory, monkeypatch):
    # this unit test is very similar to previous one, the difference being of
    # course the length of the packet in question
    monkeypatch.setattr(
        'lomond.frame.make_masking_key', lambda: b'\x00\x00\x00\x00')
    frame = frame_factory(Opcode.BINARY, payload=b'\x01' * 127)
    frame_binary = frame.to_bytes()

    expected_length = 1 + 1 + 2 + 4 + 127
    #                 ^   ^   ^   ^    ^
    #                 |   |   |   |    +-- payload length     (127 bytes)
    #                 |   |   |   +------- mask length        (4 bytes  )
    #                 |   |   +----------- length as uint16_t (2 bytes  )
    #                 |   +--------------- masking byte
    #                 +------------------- opcode byte
    assert len(frame_binary) == expected_length

    # the first byte doesn't change at all, so please look inside the previous
    # function for in-depth explanation
    assert six.indexbytes(frame_binary, 0) == 0b10000010
    # in the second byte of the header, length field should be set to 126 to
    # indicate a payload of length which should be encoded as uint16_t
    # just for the fun of it, we can decode the actual length value:
    _length = six.indexbytes(frame_binary, 1) & 0b01111111
    assert _length == 126
    assert frame_binary[4:8] == b'\x00\x00\x00\x00'
    assert frame_binary[8:] == frame.payload


def test_binary_output_length_larger_than_127(frame_factory, monkeypatch):
    # even shorter test, as we don't want to repeat ourselves.
    monkeypatch.setattr(
        'lomond.frame.make_masking_key', lambda: b'\x00\x00\x00\x00')
    large_length = 1 << 16
    frame = frame_factory(Opcode.BINARY, payload=b'\x01' * large_length)
    frame_binary = frame.to_bytes()
    expected_length = 1 + 1 + 8 + 4 + large_length
    #                 ^   ^   ^   ^    ^
    #                 |   |   |   |    +-- payload length     (128 bytes)
    #                 |   |   |   +------- mask length        (4 bytes  )
    #                 |   |   +----------- length as uint64_t (4 bytes  )
    #                 |   +--------------- masking byte
    #                 +------------------- opcode byte
    assert len(frame_binary) == expected_length
    assert six.indexbytes(frame_binary, 0) == 0b10000010
    _length = six.indexbytes(frame_binary, 1) & 0b01111111
    assert _length == 127
    # we can decode the real length as well:
    decoded_length = unpack('!Q', frame_binary[2:10])
    assert len(decoded_length) == 1
    assert decoded_length[0] == large_length
    assert frame_binary[10:14] == b'\x00\x00\x00\x00'
    assert frame_binary[14:] == frame.payload


def test_calling_build_close_payload_requires_status():
    assert Frame.build_close_payload(None) == b''


@pytest.mark.parametrize('init_params, expected_error', [
    (
        {'opcode': Opcode.PING, 'payload': b'A' * 126},
        "control frames must be <= 125 bytes in length"
    ),
    (
        {'opcode': Opcode.TEXT, 'payload': b'A', 'rsv1': 1},
        "reserved bits set"
    ),
    (
        {'opcode': Opcode.TEXT, 'payload': b'A', 'rsv2': 1},
        "reserved bits set"
    ),
    (
        {'opcode': Opcode.TEXT, 'payload': b'A', 'rsv3': 1},
        "reserved bits set"
    ),
    (
        {'opcode': Opcode.RESERVED1},
        "opcode is reserved"
    ),
    (
        {'opcode': Opcode.PING, 'fin': 0},
        "control frames may not be fragmented"
    )

])
def test_validate_frame(init_params, expected_error):
    with pytest.raises(ProtocolError) as e:
        frame = Frame(**init_params)
        frame.validate()

    assert str(e.value) == expected_error
