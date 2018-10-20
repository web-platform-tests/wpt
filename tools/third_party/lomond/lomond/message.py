"""

A message class, built from 1 or more websocket frames.

"""

from __future__ import unicode_literals

import logging
import struct

from . import errors
from .opcode import Opcode
from .utf8validator import Utf8Validator


log = logging.getLogger('lomond')


class Message(object):
    """Base class for a websocket message.

    :param opcode: A message opcode defined in
        :class:`~lomond.opcode.Opcode`.

    """

    __slots__ = ['opcode']
    _unpack16 = struct.Struct(b'!H').unpack

    def __init__(self, opcode):
        self.opcode = opcode

    def __repr__(self):
        return "<message {}>".format(Opcode.to_str(self.opcode))

    @classmethod
    def build(cls, frames, decompress=None):
        """Build a message from a sequence of frames."""
        first_frame = frames[0]
        opcode = first_frame.opcode
        if first_frame.rsv1 and decompress:
            payload = cls.decompress_frames(frames, decompress)
        else:
            payload = b''.join(bytes(frame.payload) for frame in frames)
        if opcode == Opcode.BINARY:
            return Binary(payload)
        elif opcode == Opcode.TEXT:
            return Text.from_payload(payload)
        elif opcode == Opcode.CLOSE:
            return Close.from_payload(payload)
        elif opcode == Opcode.PING:
            return Ping(payload)
        elif opcode == Opcode.PONG:
            return Pong(payload)
        else:
            return Message(opcode)

    @classmethod
    def decompress_frames(cls, frames, decompress):
        """Decompress data and report errors."""
        try:
            return decompress(frames)
        except Exception as error:
            log.exception('error decompressing payload')
            raise errors.CriticalProtocolError(
                'unable to decompress payload'
            )

    @property
    def is_text(self):
        """Check if the message is text."""
        return self.opcode == Opcode.TEXT

    @property
    def is_binary(self):
        """Check if the message is binary."""
        return self.opcode == Opcode.BINARY

    @property
    def is_close(self):
        """Check if this is a close message."""
        return self.opcode == Opcode.CLOSE

    @property
    def is_ping(self):
        """Check if this is a ping message."""
        return self.opcode == Opcode.PING

    @property
    def is_pong(self):
        """Check if this is a pong message."""
        return self.opcode == Opcode.PONG


class Binary(Message):
    """Binary application data.

    :param bytes data: The message data.

    """
    __slots__ = ['data']

    def __init__(self, data):
        self.data = data
        super(Binary, self).__init__(Opcode.BINARY)

    def __repr__(self):
        return "<message BINARY {!r}>".format(self.data)


class Text(Message):
    """Text application data.

    :param str text: The message text.

    """
    __slots__ = ['text']

    def __init__(self, text):
        self.text = text
        super(Text, self).__init__(Opcode.TEXT)

    @classmethod
    def from_payload(cls, payload):
        try:
            text = payload.decode('utf-8')
        except UnicodeDecodeError as error:
            raise errors.CriticalProtocolError(
                'payload contains invalid utf-8; {}',
                error
            )
        return cls(text)

    def __repr__(self):
        return "<message TEXT {!r}>".format(self.text)


class Close(Message):
    """Connection close control message.

    :param int code: Close code.
    :param str reason: Close reason.

    """
    __slots__ = ['code', 'reason']

    def __init__(self, code, reason):
        self.code = code
        self.reason = reason
        super(Close, self).__init__(Opcode.CLOSE)

    @classmethod
    def from_payload(cls, payload):
        """Decode the error 'code' and 'reason'."""
        code = None
        reason = ''
        if len(payload) == 1:
            raise errors.ProtocolError(
                'invalid close frame payload'
            )
        elif len(payload) >= 2:
            (code,) = cls._unpack16(payload[:2])
            reason_bytes = payload[2:]
            is_valid, _, _, _ = Utf8Validator().validate(reason_bytes)
            if not is_valid:
                raise errors.CriticalProtocolError(
                    'close frame contains invalid utf-8'
                )
            try:
                reason = reason_bytes.decode('utf-8')
            except UnicodeDecodeError as error:
                raise errors.CriticalProtocolError(
                    'invalid utf-8 in close reason ({})',
                    error
                )
        return cls(code, reason)

    def __repr__(self):
        return "<message CLOSE {}, {!r}>".format(self.code, self.reason)


class Ping(Message):
    """Ping message.

    :param bytes data: Ping data.

    """
    __slots__ = ['data']

    def __init__(self, data):
        self.data = data
        super(Ping, self).__init__(Opcode.PING)

    def __repr__(self):
        return "<message PING {!r}>".format(self.data)


class Pong(Message):
    """Pong message.

    :param bytes data: Pong data.

    """
    __slots__ = ['data']

    def __init__(self, data):
        self.data = data
        super(Pong, self).__init__(Opcode.PONG)

    def __repr__(self):
        return "<message PONG {!r}>".format(self.data)
