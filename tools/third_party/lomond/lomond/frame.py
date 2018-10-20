"""
Manages individual Websocket frames.

A websocket 'message' may consist of several of these frames.

"""

from __future__ import print_function
from __future__ import unicode_literals

import struct

from . import errors
from .mask import make_masking_key, mask_payload
from .opcode import is_reserved, Opcode


class Frame(object):
    """A raw websocket frame."""

    __slots__ = [
        'opcode',
        'payload',
        'fin',
        'rsv1',
        'rsv2',
        'rsv3',
        'mask',
        'masking_key',
    ]

    def __init__(self, opcode, payload=b'',
                 fin=1, rsv1=0, rsv2=0, rsv3=0,
                 mask=True, masking_key=None):
        self.opcode = opcode
        self.payload = payload
        self.fin = fin
        self.rsv1 = rsv1
        self.rsv2 = rsv2
        self.rsv3 = rsv3
        self.mask = mask
        self.masking_key = masking_key

    def __repr__(self):
        opcode_name = Opcode.to_str(self.opcode)
        frame_type = "frame" if self.fin else "frame-fragment"
        return "<{} {} ({} bytes) fin={!r}>".format(
            'compressed-' + frame_type if self.rsv1 else frame_type,
            opcode_name,
            len(self),
            self.fin
        )

    def __len__(self):
        return len(self.payload)

    # Use struct module to pack ws frame header
    _pack8 = struct.Struct(b'!BB').pack  # 8 bit length field
    _pack16 = struct.Struct(b'!BBH').pack  # 16 bit length field
    _pack64 = struct.Struct(b'!BBQ').pack  # 64 bit length field
    _pack_mask = struct.Struct(b'4s').pack  # 4 byte string
    _pack_close_code = struct.Struct(b'!H').pack

    @classmethod
    def build(cls, opcode, payload=b'',
              fin=1, rsv1=0, rsv2=0, rsv3=0,
              mask=True, masking_key=None):
        """Build a WS frame."""
        # https://tools.ietf.org/html/rfc6455#section-5.2
        payload = bytearray(payload) if isinstance(payload, bytes) else payload
        mask_bit = 1 << 7 if mask else 0
        byte0 = fin << 7 | rsv1 << 6 | rsv2 << 5 | rsv3 << 4 | opcode
        length = len(payload)
        if length < 126:
            header_bytes = cls._pack8(byte0, mask_bit | length)
        elif length < (1 << 16):
            header_bytes = cls._pack16(byte0, mask_bit | 126, length)
        elif length < (1 << 63):
            header_bytes = cls._pack64(byte0, mask_bit | 127, length)
        else:  # pragma: no cover
            # Can't send a payload > 2**63 bytes
            raise errors.FrameBuildError(
                'payload is too large for a single frame'
            )
        if mask:
            masking_key = (
                make_masking_key()
                if masking_key is None
                else masking_key
            )
            mask_payload(masking_key, payload)
            frame_bytes = b''.join((
                header_bytes,
                cls._pack_mask(masking_key),
                bytes(payload)
            ))
        else:
            frame_bytes = header_bytes + bytes(payload)
        return frame_bytes

    @classmethod
    def build_close_payload(cls, status, reason=''):
        """Build a close frame."""
        if not isinstance(reason, bytes):
            reason = reason.encode('utf-8', errors='replace')
        if status is None:
            return b''
        payload_bytes = cls._pack_close_code(status) + reason
        return payload_bytes

    def to_bytes(self):
        """Return binary encoding of WS frame."""
        frame_bytes = self.build(
            self.opcode,
            payload=self.payload,
            rsv1=self.rsv1,
            rsv2=self.rsv2,
            rsv3=self.rsv3,
            mask=self.mask,
            masking_key=self.masking_key
        )
        return frame_bytes

    def validate(self):
        """Check the frame and raise any errors."""
        if self.is_control and len(self.payload) > 125:
            raise errors.ProtocolError(
                "control frames must be <= 125 bytes in length"
            )
        self.validate_reserved_bits()
        if is_reserved(self.opcode):
            raise errors.ProtocolError(
                "opcode is reserved"
            )
        if not self.fin and self.is_control:
            raise errors.ProtocolError(
                "control frames may not be fragmented"
            )

    def validate_reserved_bits(self):
        """Check reserved bits."""
        if self.rsv1 or self.rsv2 or self.rsv3:
            raise errors.ProtocolError(
                "reserved bits set"
            )

    @property
    def is_masked(self):
        """Check if this frame is masked."""
        return self.mask

    @property
    def is_control(self):
        """Check if this frame has a control opcode."""
        return self.opcode >= 8

    @property
    def is_text(self):
        """Check if this is a text frame."""
        return self.opcode == Opcode.TEXT

    @property
    def is_binary(self):
        """Check if this is a binary frame."""
        return self.opcode == Opcode.BINARY

    @property
    def is_continuation(self):
        """Check if this is a continuation."""
        return self.opcode == Opcode.CONTINUATION

    @property
    def is_ping(self):
        """Check if this is a ping frame."""
        return self.opcode == Opcode.PING

    @property
    def is_pong(self):
        """Check if this is a pong frame."""
        return self.opcode == Opcode.PONG

    @property
    def is_close(self):
        """Check if this is a close frame."""
        return self.opcode == Opcode.CLOSE


class CompressedFrame(Frame):
    """A frame that may be compressed."""

    def validate_reserved_bits(self):
        """Check reserved bits."""
        if self.rsv2 or self.rsv3:
            raise errors.ProtocolError(
                "reserved bits set"
            )


if __name__ == "__main__":  # pragma: no cover
    print(Frame(Opcode.BINARY, b'Hello, World', fin=0))
    print(Frame(Opcode.TEXT, b'Hello, World', fin=1))
