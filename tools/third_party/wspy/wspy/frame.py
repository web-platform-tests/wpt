import struct
import socket
from os import urandom
from string import printable


OPCODE_CONTINUATION = 0x0
OPCODE_TEXT = 0x1
OPCODE_BINARY = 0x2
OPCODE_CLOSE = 0x8
OPCODE_PING = 0x9
OPCODE_PONG = 0xA

CLOSE_NORMAL = 1000
CLOSE_GOING_AWAY = 1001
CLOSE_PROTOCOL_ERROR = 1002
CLOSE_NOACCEPT_DTYPE = 1003
CLOSE_INVALID_DATA = 1007
CLOSE_POLICY = 1008
CLOSE_MESSAGE_TOOBIG = 1009
CLOSE_MISSING_EXTENSIONS = 1010
CLOSE_UNABLE = 1011

line_printable = [c for c in printable if c not in '\r\n\x0b\x0c']


def printstr(s):
    return ''.join(c if c in line_printable else '.' for c in str(s))


class Frame(object):
    """
    A Frame instance represents a web socket data frame as defined in RFC 6455.
    To encoding a frame for sending it over a socket, use Frame.pack(). To
    receive and decode a frame from a socket, use receive_frame().
    """
    def __init__(self, opcode, payload, masking_key='', mask=False, final=True,
            rsv1=False, rsv2=False, rsv3=False):
        """
        Create a new frame.

        `opcode` is one of the constants as defined above.

        `payload` is a string of bytes containing the data sendt in the frame.

        `masking_key` is an optional custom key to use for masking, or `mask`
        can be used instead to let this constructor generate a random masking
        key.

        `final` is a boolean indicating whether this frame is the last in a
        chain of fragments.

        `rsv1`, `rsv2` and `rsv3` are booleans indicating bit values for RSV1,
        RVS2 and RSV3, which are only non-zero if defined so by extensions.
        """
        if mask and not masking_key:
            masking_key = urandom(4)

        if len(masking_key) not in (0, 4):
            raise ValueError('invalid masking key "%s"' % masking_key)

        self.final = final
        self.rsv1 = rsv1
        self.rsv2 = rsv2
        self.rsv3 = rsv3
        self.opcode = opcode
        self.masking_key = masking_key
        self.payload = payload

    def pack(self):
        """
        Pack the frame into a string according to the following scheme:

        +-+-+-+-+-------+-+-------------+-------------------------------+
        |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
        |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
        |N|V|V|V|       |S|             |   (if payload len==126/127)   |
        | |1|2|3|       |K|             |                               |
        +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
        |     Extended payload length continued, if payload len == 127  |
        + - - - - - - - - - - - - - - - +-------------------------------+
        |                               |Masking-key, if MASK set to 1  |
        +-------------------------------+-------------------------------+
        | Masking-key (continued)       |          Payload Data         |
        +-------------------------------- - - - - - - - - - - - - - - - +
        :                     Payload Data continued ...                :
        + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
        |                     Payload Data continued ...                |
        +---------------------------------------------------------------+
        """
        header = struct.pack('!B', (self.final << 7) | (self.rsv1 << 6)
                                   | (self.rsv2 << 5) | (self.rsv3 << 4)
                                   | (self.opcode & 0xf))
        mask = bool(self.masking_key) << 7
        payload_len = len(self.payload)

        if payload_len <= 125:
            header += struct.pack('!B', mask | payload_len)
        elif payload_len < (1 << 16):
            header += struct.pack('!BH', mask | 126, payload_len)
        elif payload_len < (1 << 63):
            header += struct.pack('!BQ', mask | 127, payload_len)
        else:
            # FIXME: RFC 6455 defines an action for this...
            raise Exception('the payload length is too damn high!')

        if mask:
            return header + self.masking_key + self.mask_payload()

        return header + self.payload

    def mask_payload(self):
        return mask(self.masking_key, self.payload)

    def fragment(self, fragment_size, mask=False):
        """
        Fragment the frame into a chain of fragment frames:
        - An initial frame with non-zero opcode
        - Zero or more frames with opcode = 0 and final = False
        - A final frame with opcode = 0 and final = True

        The first and last frame may be the same frame, having a non-zero
        opcode and final = True. Thus, this function returns a list containing
        at least a single frame.

        `fragment_size` indicates the maximum payload size of each fragment.
        The payload of the original frame is split into one or more parts, and
        each part is converted to a Frame instance.

        `mask` is a boolean (default False) indicating whether the payloads
        should be masked. If True, each frame is assigned a randomly generated
        masking key.
        """
        frames = []

        for start in xrange(0, len(self.payload), fragment_size):
            payload = self.payload[start:start + fragment_size]
            frames.append(Frame(OPCODE_CONTINUATION, payload, mask=mask,
                                final=False))

        frames[0].opcode = self.opcode
        frames[-1].final = True

        return frames

    def is_fragmented(self):
        return not self.final or self.opcode == OPCODE_CONTINUATION

    def __str__(self):
        s = '<%s opcode=0x%X len=%d' \
            % (self.__class__.__name__, self.opcode, len(self.payload))

        if self.masking_key:
            s += ' masking_key=%4s' % printstr(self.masking_key)

        max_pl_disp = 30
        pl = printstr(self.payload)[:max_pl_disp]

        if len(self.payload) > max_pl_disp:
            pl += '...'

        s += ' payload=%s' % pl

        if self.rsv1:
            s += ' rsv1'

        if self.rsv2:
            s += ' rsv2'

        if self.rsv3:
            s += ' rsv3'

        return s + '>'


class ControlFrame(Frame):
    """
    A control frame is a frame with an opcode OPCODE_CLOSE, OPCODE_PING or
    OPCODE_PONG. These frames must be handled as defined by RFC 6455, and
    """
    def fragment(self, fragment_size, mask=False):
        """
        Control frames must not be fragmented.
        """
        raise TypeError('control frames must not be fragmented')

    def pack(self):
        """
        Same as Frame.pack(), but asserts that the payload size does not exceed
        125 bytes.
        """
        if len(self.payload) > 125:
            raise ValueError('control frames must not be larger than 125 '
                             'bytes')

        return Frame.pack(self)

    def unpack_close(self):
        """
        Unpack a close message into a status code and a reason. If no payload
        is given, the code is None and the reason is an empty string.
        """
        if self.payload:
            code = struct.unpack('!H', str(self.payload[:2]))[0]
            reason = str(self.payload[2:])
        else:
            code = None
            reason = ''

        return code, reason


def decode_frame(reader):
    b1, b2 = struct.unpack('!BB', reader.readn(2))

    final = bool(b1 & 0x80)
    rsv1 = bool(b1 & 0x40)
    rsv2 = bool(b1 & 0x20)
    rsv3 = bool(b1 & 0x10)
    opcode = b1 & 0x0F

    masked = bool(b2 & 0x80)
    payload_len = b2 & 0x7F

    #struct.unpack result is a tuple even if it contains exactly one item
    #so we can't use strunct.unpack result direct when only one value,
    #must add another un-used var to get the first value
    if payload_len == 126:
        payload_len, = struct.unpack('!H', reader.readn(2))
    elif payload_len == 127:
        payload_len, = struct.unpack('!Q', reader.readn(8))

    if masked:
        masking_key = reader.readn(4)
        payload = mask(masking_key, reader.readn(payload_len))
    else:
        masking_key = ''
        payload = reader.readn(payload_len)

    # Control frames have most significant bit 1
    cls = ControlFrame if opcode & 0x8 else Frame

    return cls(opcode, payload, masking_key=masking_key, final=final,
               rsv1=rsv1, rsv2=rsv2, rsv3=rsv3)


def receive_frame(sock):
    return decode_frame(SocketReader(sock))


def read_frame(data):
    reader = BufferReader(data)
    frame = decode_frame(reader)
    return frame, reader.offset


def pop_frame(data):
    frame, size = read_frame(data)
    return frame, data[size:]


class BufferReader(object):
    def __init__(self, data):
        self.data = data
        self.offset = 0

    def readn(self, n):
        assert len(self.data) - self.offset >= n
        self.offset += n
        return self.data[self.offset - n:self.offset]


class SocketReader(object):
    def __init__(self, sock):
        self.sock = sock

    def readn(self, n):
        """
        Keep receiving data until exactly `n` bytes have been read.
        """
        data = ''

        while len(data) < n:
            received = self.sock.recv(n - len(data))

            if not len(received):
                raise socket.error('no data read from socket')

            data += received

        return data


def contains_frame(data):
    """
    Read the frame length from the start of `data` and check if the data is
    long enough to contain the entire frame.
    """
    if len(data) < 2:
        return False

    b2 = struct.unpack('!B', data[1])[0]
    payload_len = b2 & 0x7F
    payload_start = 2

    if payload_len == 126:
        if len(data) > 4:
            payload_len = struct.unpack('!H', data[2:4])[0]

        payload_start = 4
    elif payload_len == 127:
        if len(data) > 12:
            payload_len = struct.unpack('!Q', data[4:12])[0]

        payload_start = 12

    return len(data) >= payload_len + payload_start


def mask(key, original):
    """
    Mask an octet string using the given masking key.
    The following masking algorithm is used, as defined in RFC 6455:

    for each octet:
        j = i MOD 4
        transformed-octet-i = original-octet-i XOR masking-key-octet-j
    """
    if len(key) != 4:
        raise ValueError('invalid masking key "%s"' % key)

    key = map(ord, key)
    masked = bytearray(original)

    for i in xrange(len(masked)):
        masked[i] ^= key[i % 4]

    return masked


def create_close_frame(code, reason):
    payload = '' if code is None else struct.pack('!H', code) + reason
    return ControlFrame(OPCODE_CLOSE, payload)
