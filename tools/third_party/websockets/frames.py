"""
Parse and serialize WebSocket frames.

"""

import enum
import io
import secrets
import struct
from typing import Callable, Generator, NamedTuple, Optional, Sequence, Tuple

from .exceptions import PayloadTooBig, ProtocolError
from .typing import Data


try:
    from .speedups import apply_mask
except ImportError:  # pragma: no cover
    from .utils import apply_mask


__all__ = [
    "Opcode",
    "OP_CONT",
    "OP_TEXT",
    "OP_BINARY",
    "OP_CLOSE",
    "OP_PING",
    "OP_PONG",
    "DATA_OPCODES",
    "CTRL_OPCODES",
    "Frame",
    "prepare_data",
    "prepare_ctrl",
    "parse_close",
    "serialize_close",
]


class Opcode(enum.IntEnum):
    CONT, TEXT, BINARY = 0x00, 0x01, 0x02
    CLOSE, PING, PONG = 0x08, 0x09, 0x0A


OP_CONT = Opcode.CONT
OP_TEXT = Opcode.TEXT
OP_BINARY = Opcode.BINARY
OP_CLOSE = Opcode.CLOSE
OP_PING = Opcode.PING
OP_PONG = Opcode.PONG

DATA_OPCODES = OP_CONT, OP_TEXT, OP_BINARY
CTRL_OPCODES = OP_CLOSE, OP_PING, OP_PONG

# Close code that are allowed in a close frame.
# Using a set optimizes `code in EXTERNAL_CLOSE_CODES`.
EXTERNAL_CLOSE_CODES = {
    1000,
    1001,
    1002,
    1003,
    1007,
    1008,
    1009,
    1010,
    1011,
    1012,
    1013,
    1014,
}


# Consider converting to a dataclass when dropping support for Python < 3.7.


class Frame(NamedTuple):
    """
    WebSocket frame.

    :param bool fin: FIN bit
    :param bool rsv1: RSV1 bit
    :param bool rsv2: RSV2 bit
    :param bool rsv3: RSV3 bit
    :param int opcode: opcode
    :param bytes data: payload data

    Only these fields are needed. The MASK bit, payload length and masking-key
    are handled on the fly by :func:`parse_frame` and :meth:`serialize_frame`.

    """

    fin: bool
    opcode: Opcode
    data: bytes
    rsv1: bool = False
    rsv2: bool = False
    rsv3: bool = False

    @classmethod
    def parse(
        cls,
        read_exact: Callable[[int], Generator[None, None, bytes]],
        *,
        mask: bool,
        max_size: Optional[int] = None,
        extensions: Optional[Sequence["extensions.Extension"]] = None,
    ) -> Generator[None, None, "Frame"]:
        """
        Read a WebSocket frame.

        :param read_exact: generator-based coroutine that reads the requested
            number of bytes or raises an exception if there isn't enough data
        :param mask: whether the frame should be masked i.e. whether the read
            happens on the server side
        :param max_size: maximum payload size in bytes
        :param extensions: list of classes with a ``decode()`` method that
            transforms the frame and return a new frame; extensions are applied
            in reverse order
        :raises ~websockets.exceptions.PayloadTooBig: if the frame exceeds
            ``max_size``
        :raises ~websockets.exceptions.ProtocolError: if the frame
            contains incorrect values

        """
        # Read the header.
        data = yield from read_exact(2)
        head1, head2 = struct.unpack("!BB", data)

        # While not Pythonic, this is marginally faster than calling bool().
        fin = True if head1 & 0b10000000 else False
        rsv1 = True if head1 & 0b01000000 else False
        rsv2 = True if head1 & 0b00100000 else False
        rsv3 = True if head1 & 0b00010000 else False

        try:
            opcode = Opcode(head1 & 0b00001111)
        except ValueError as exc:
            raise ProtocolError("invalid opcode") from exc

        if (True if head2 & 0b10000000 else False) != mask:
            raise ProtocolError("incorrect masking")

        length = head2 & 0b01111111
        if length == 126:
            data = yield from read_exact(2)
            (length,) = struct.unpack("!H", data)
        elif length == 127:
            data = yield from read_exact(8)
            (length,) = struct.unpack("!Q", data)
        if max_size is not None and length > max_size:
            raise PayloadTooBig(f"over size limit ({length} > {max_size} bytes)")
        if mask:
            mask_bytes = yield from read_exact(4)

        # Read the data.
        data = yield from read_exact(length)
        if mask:
            data = apply_mask(data, mask_bytes)

        frame = cls(fin, opcode, data, rsv1, rsv2, rsv3)

        if extensions is None:
            extensions = []
        for extension in reversed(extensions):
            frame = extension.decode(frame, max_size=max_size)

        frame.check()

        return frame

    def serialize(
        self,
        *,
        mask: bool,
        extensions: Optional[Sequence["extensions.Extension"]] = None,
    ) -> bytes:
        """
        Write a WebSocket frame.

        :param frame: frame to write
        :param mask: whether the frame should be masked i.e. whether the write
            happens on the client side
        :param extensions: list of classes with an ``encode()`` method that
            transform the frame and return a new frame; extensions are applied
            in order
        :raises ~websockets.exceptions.ProtocolError: if the frame
            contains incorrect values

        """
        self.check()

        if extensions is None:
            extensions = []
        for extension in extensions:
            self = extension.encode(self)

        output = io.BytesIO()

        # Prepare the header.
        head1 = (
            (0b10000000 if self.fin else 0)
            | (0b01000000 if self.rsv1 else 0)
            | (0b00100000 if self.rsv2 else 0)
            | (0b00010000 if self.rsv3 else 0)
            | self.opcode
        )

        head2 = 0b10000000 if mask else 0

        length = len(self.data)
        if length < 126:
            output.write(struct.pack("!BB", head1, head2 | length))
        elif length < 65536:
            output.write(struct.pack("!BBH", head1, head2 | 126, length))
        else:
            output.write(struct.pack("!BBQ", head1, head2 | 127, length))

        if mask:
            mask_bytes = secrets.token_bytes(4)
            output.write(mask_bytes)

        # Prepare the data.
        if mask:
            data = apply_mask(self.data, mask_bytes)
        else:
            data = self.data
        output.write(data)

        return output.getvalue()

    def check(self) -> None:
        """
        Check that reserved bits and opcode have acceptable values.

        :raises ~websockets.exceptions.ProtocolError: if a reserved
            bit or the opcode is invalid

        """
        if self.rsv1 or self.rsv2 or self.rsv3:
            raise ProtocolError("reserved bits must be 0")

        if self.opcode in CTRL_OPCODES:
            if len(self.data) > 125:
                raise ProtocolError("control frame too long")
            if not self.fin:
                raise ProtocolError("fragmented control frame")


def prepare_data(data: Data) -> Tuple[int, bytes]:
    """
    Convert a string or byte-like object to an opcode and a bytes-like object.

    This function is designed for data frames.

    If ``data`` is a :class:`str`, return ``OP_TEXT`` and a :class:`bytes`
    object encoding ``data`` in UTF-8.

    If ``data`` is a bytes-like object, return ``OP_BINARY`` and a bytes-like
    object.

    :raises TypeError: if ``data`` doesn't have a supported type

    """
    if isinstance(data, str):
        return OP_TEXT, data.encode("utf-8")
    elif isinstance(data, (bytes, bytearray, memoryview)):
        return OP_BINARY, data
    else:
        raise TypeError("data must be bytes-like or str")


def prepare_ctrl(data: Data) -> bytes:
    """
    Convert a string or byte-like object to bytes.

    This function is designed for ping and pong frames.

    If ``data`` is a :class:`str`, return a :class:`bytes` object encoding
    ``data`` in UTF-8.

    If ``data`` is a bytes-like object, return a :class:`bytes` object.

    :raises TypeError: if ``data`` doesn't have a supported type

    """
    if isinstance(data, str):
        return data.encode("utf-8")
    elif isinstance(data, (bytes, bytearray, memoryview)):
        return bytes(data)
    else:
        raise TypeError("data must be bytes-like or str")


def parse_close(data: bytes) -> Tuple[int, str]:
    """
    Parse the payload from a close frame.

    Return ``(code, reason)``.

    :raises ~websockets.exceptions.ProtocolError: if data is ill-formed
    :raises UnicodeDecodeError: if the reason isn't valid UTF-8

    """
    length = len(data)
    if length >= 2:
        (code,) = struct.unpack("!H", data[:2])
        check_close(code)
        reason = data[2:].decode("utf-8")
        return code, reason
    elif length == 0:
        return 1005, ""
    else:
        assert length == 1
        raise ProtocolError("close frame too short")


def serialize_close(code: int, reason: str) -> bytes:
    """
    Serialize the payload for a close frame.

    This is the reverse of :func:`parse_close`.

    """
    check_close(code)
    return struct.pack("!H", code) + reason.encode("utf-8")


def check_close(code: int) -> None:
    """
    Check that the close code has an acceptable value for a close frame.

    :raises ~websockets.exceptions.ProtocolError: if the close code
        is invalid

    """
    if not (code in EXTERNAL_CLOSE_CODES or 3000 <= code < 5000):
        raise ProtocolError("invalid status code")


# at the bottom to allow circular import, because Extension depends on Frame
from . import extensions  # isort:skip # noqa
