"""

Manage the Websocket 'opcode' enumerations.

Not using enum34 purely to keep dependencies to a minimum.


"""

from __future__ import print_function
from __future__ import unicode_literals


class Opcode(object):
    """Enumeration of websocket opcodes."""

    CONTINUATION = 0
    TEXT = 1
    BINARY = 2
    RESERVED1 = 3
    RESERVED2 = 4
    RESERVED3 = 5
    RESERVED4 = 6
    RESERVED5 = 7
    CLOSE = 8
    PING = 9
    PONG = 0xA
    RESERVED6 = 0xB
    RESERVED7 = 0xC
    RESERVED8 = 0xD
    RESERVED9 = 0xE
    RESERVED10 = 0xF

    @classmethod
    def to_str(cls, opcode):
        if not hasattr(cls, '_opcode_to_str'):
            cls._opcode_to_str = {
                getattr(Opcode, _name): _name
                for _name in dir(Opcode)
                if not _name.startswith('_') and _name.isupper()
            }
        return cls._opcode_to_str.get(opcode, '?')


reserved_opcodes = {
    Opcode.RESERVED1,
    Opcode.RESERVED2,
    Opcode.RESERVED3,
    Opcode.RESERVED4,
    Opcode.RESERVED5,
    Opcode.RESERVED6,
    Opcode.RESERVED7,
    Opcode.RESERVED8,
    Opcode.RESERVED9,
    Opcode.RESERVED10,
}


def is_reserved(opcode):
    """Check if an opcode is reserved."""
    return opcode in reserved_opcodes
