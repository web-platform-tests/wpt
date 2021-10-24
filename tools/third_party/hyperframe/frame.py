# -*- coding: utf-8 -*-
"""
hyperframe/frame
~~~~~~~~~~~~~~~~

Defines framing logic for HTTP/2. Provides both classes to represent framed
data and logic for aiding the connection when it comes to reading from the
socket.
"""
import collections
import struct
import binascii

from .exceptions import (
    UnknownFrameError, InvalidPaddingError, InvalidFrameError
)
from .flags import Flag, Flags

# The maximum initial length of a frame. Some frames have shorter maximum lengths.
FRAME_MAX_LEN = (2 ** 14)

# The maximum allowed length of a frame.
FRAME_MAX_ALLOWED_LEN = (2 ** 24) - 1


class Frame(object):
    """
    The base class for all HTTP/2 frames.
    """
    #: The flags defined on this type of frame.
    defined_flags = []

    #: The byte used to define the type of the frame.
    type = None

    # If 'has-stream', the frame's stream_id must be non-zero. If 'no-stream',
    # it must be zero. If 'either', it's not checked.
    stream_association = None

    def __init__(self, stream_id, flags=()):
        #: The stream identifier for the stream this frame was received on.
        #: Set to 0 for frames sent on the connection (stream-id 0).
        self.stream_id = stream_id

        #: The flags set for this frame.
        self.flags = Flags(self.defined_flags)

        #: The frame length, excluding the nine-byte header.
        self.body_len = 0

        for flag in flags:
            self.flags.add(flag)

        if self.stream_association == 'has-stream' and not self.stream_id:
            raise ValueError('Stream ID must be non-zero')
        if self.stream_association == 'no-stream' and self.stream_id:
            raise ValueError('Stream ID must be zero')

    def __repr__(self):
        flags = ", ".join(self.flags) or "None"
        body = binascii.hexlify(self.serialize_body()).decode('ascii')
        if len(body) > 20:
            body = body[:20] + "..."
        return (
            "{type}(Stream: {stream}; Flags: {flags}): {body}"
        ).format(type=type(self).__name__, stream=self.stream_id, flags=flags, body=body)

    @staticmethod
    def parse_frame_header(header):
        """
        Takes a 9-byte frame header and returns a tuple of the appropriate
        Frame object and the length that needs to be read from the socket.

        This populates the flags field, and determines how long the body is.

        :raises hyperframe.exceptions.UnknownFrameError: If a frame of unknown
            type is received.
        """
        try:
            fields = struct.unpack("!HBBBL", header)
        except struct.error:
            raise InvalidFrameError("Invalid frame header")

        # First 24 bits are frame length.
        length = (fields[0] << 8) + fields[1]
        type = fields[2]
        flags = fields[3]
        stream_id = fields[4]

        if type not in FRAMES:
            raise UnknownFrameError(type, length)

        frame = FRAMES[type](stream_id)
        frame.parse_flags(flags)
        return (frame, length)

    def parse_flags(self, flag_byte):
        for flag, flag_bit in self.defined_flags:
            if flag_byte & flag_bit:
                self.flags.add(flag)

        return self.flags

    def serialize(self):
        """
        Convert a frame into a bytestring, representing the serialized form of
        the frame.
        """
        body = self.serialize_body()
        self.body_len = len(body)

        # Build the common frame header.
        # First, get the flags.
        flags = 0

        for flag, flag_bit in self.defined_flags:
            if flag in self.flags:
                flags |= flag_bit

        header = struct.pack(
            "!HBBBL",
            (self.body_len & 0xFFFF00) >> 8,  # Length is spread over top 24 bits
            self.body_len & 0x0000FF,
            self.type,
            flags,
            self.stream_id & 0x7FFFFFFF  # Stream ID is 32 bits.
        )

        return header + body

    def serialize_body(self):
        raise NotImplementedError()

    def parse_body(self, data):
        """
        Given the body of a frame, parses it into frame data. This populates
        the non-header parts of the frame: that is, it does not populate the
        stream ID or flags.

        :param data: A memoryview object containing the body data of the frame.
                     Must not contain *more* data than the length returned by
                     :meth:`parse_frame_header
                     <hyperframe.frame.Frame.parse_frame_header>`.
        """
        raise NotImplementedError()


class Padding(object):
    """
    Mixin for frames that contain padding. Defines extra fields that can be
    used and set by frames that can be padded.
    """
    def __init__(self, stream_id, pad_length=0, **kwargs):
        super(Padding, self).__init__(stream_id, **kwargs)

        #: The length of the padding to use.
        self.pad_length = pad_length

    def serialize_padding_data(self):
        if 'PADDED' in self.flags:
            return struct.pack('!B', self.pad_length)
        return b''

    def parse_padding_data(self, data):
        if 'PADDED' in self.flags:
            try:
                self.pad_length = struct.unpack('!B', data[:1])[0]
            except struct.error:
                raise InvalidFrameError("Invalid Padding data")
            return 1
        return 0

    @property
    def total_padding(self):
        return self.pad_length


class Priority(object):
    """
    Mixin for frames that contain priority data. Defines extra fields that can
    be used and set by frames that contain priority data.
    """
    def __init__(self, stream_id, depends_on=0x0, stream_weight=0x0, exclusive=False, **kwargs):
        super(Priority, self).__init__(stream_id, **kwargs)

        #: The stream ID of the stream on which this stream depends.
        self.depends_on = depends_on

        #: The weight of the stream. This is an integer between 0 and 256.
        self.stream_weight = stream_weight

        #: Whether the exclusive bit was set.
        self.exclusive = exclusive

    def serialize_priority_data(self):
        return struct.pack(
            "!LB",
            self.depends_on | (int(self.exclusive) << 31),
            self.stream_weight
        )

    def parse_priority_data(self, data):
        MASK = 0x80000000

        try:
            self.depends_on, self.stream_weight = struct.unpack(
                "!LB", data[:5]
            )
        except struct.error:
            raise InvalidFrameError("Invalid Priority data")

        self.exclusive = bool(self.depends_on & MASK)
        self.depends_on &= ~MASK
        return 5


class DataFrame(Padding, Frame):
    """
    DATA frames convey arbitrary, variable-length sequences of octets
    associated with a stream. One or more DATA frames are used, for instance,
    to carry HTTP request or response payloads.
    """
    #: The flags defined for DATA frames.
    defined_flags = [
        Flag('END_STREAM', 0x01),
        Flag('PADDED', 0x08),
    ]

    #: The type byte for data frames.
    type = 0x0

    stream_association = 'has-stream'

    def __init__(self, stream_id, data=b'', **kwargs):
        super(DataFrame, self).__init__(stream_id, **kwargs)

        #: The data contained on this frame.
        self.data = data

    def serialize_body(self):
        padding_data = self.serialize_padding_data()
        padding = b'\0' * self.total_padding
        return b''.join([padding_data, self.data, padding])

    def parse_body(self, data):
        padding_data_length = self.parse_padding_data(data)
        self.data = data[padding_data_length:len(data)-self.total_padding].tobytes()
        self.body_len = len(data)

        if self.total_padding and self.total_padding >= self.body_len:
            raise InvalidPaddingError("Padding is too long.")

    @property
    def flow_controlled_length(self):
        """
        The length of the frame that needs to be accounted for when considering
        flow control.
        """
        padding_len = self.total_padding + 1 if self.total_padding else 0
        return len(self.data) + padding_len


class PriorityFrame(Priority, Frame):
    """
    The PRIORITY frame specifies the sender-advised priority of a stream. It
    can be sent at any time for an existing stream. This enables
    reprioritisation of existing streams.
    """
    #: The flags defined for PRIORITY frames.
    defined_flags = []

    #: The type byte defined for PRIORITY frames.
    type = 0x02

    stream_association = 'has-stream'

    def serialize_body(self):
        return self.serialize_priority_data()

    def parse_body(self, data):
        self.parse_priority_data(data)
        self.body_len = len(data)


class RstStreamFrame(Frame):
    """
    The RST_STREAM frame allows for abnormal termination of a stream. When sent
    by the initiator of a stream, it indicates that they wish to cancel the
    stream or that an error condition has occurred. When sent by the receiver
    of a stream, it indicates that either the receiver is rejecting the stream,
    requesting that the stream be cancelled or that an error condition has
    occurred.
    """
    #: The flags defined for RST_STREAM frames.
    defined_flags = []

    #: The type byte defined for RST_STREAM frames.
    type = 0x03

    stream_association = 'has-stream'

    def __init__(self, stream_id, error_code=0, **kwargs):
        super(RstStreamFrame, self).__init__(stream_id, **kwargs)

        #: The error code used when resetting the stream.
        self.error_code = error_code

    def serialize_body(self):
        return struct.pack("!L", self.error_code)

    def parse_body(self, data):
        if len(data) != 4:
            raise InvalidFrameError(
                "RST_STREAM must have 4 byte body: actual length %s." %
                len(data)
            )

        try:
            self.error_code = struct.unpack("!L", data)[0]
        except struct.error:  # pragma: no cover
            raise InvalidFrameError("Invalid RST_STREAM body")

        self.body_len = len(data)


class SettingsFrame(Frame):
    """
    The SETTINGS frame conveys configuration parameters that affect how
    endpoints communicate. The parameters are either constraints on peer
    behavior or preferences.

    Settings are not negotiated. Settings describe characteristics of the
    sending peer, which are used by the receiving peer. Different values for
    the same setting can be advertised by each peer. For example, a client
    might set a high initial flow control window, whereas a server might set a
    lower value to conserve resources.
    """
    #: The flags defined for SETTINGS frames.
    defined_flags = [Flag('ACK', 0x01)]

    #: The type byte defined for SETTINGS frames.
    type = 0x04

    stream_association = 'no-stream'

    # We need to define the known settings, they may as well be class
    # attributes.
    #: The byte that signals the SETTINGS_HEADER_TABLE_SIZE setting.
    HEADER_TABLE_SIZE      = 0x01
    #: The byte that signals the SETTINGS_ENABLE_PUSH setting.
    ENABLE_PUSH            = 0x02
    #: The byte that signals the SETTINGS_MAX_CONCURRENT_STREAMS setting.
    MAX_CONCURRENT_STREAMS = 0x03
    #: The byte that signals the SETTINGS_INITIAL_WINDOW_SIZE setting.
    INITIAL_WINDOW_SIZE    = 0x04
    #: The byte that signals the SETTINGS_MAX_FRAME_SIZE setting.
    MAX_FRAME_SIZE         = 0x05
    #: The byte that signals the SETTINGS_MAX_HEADER_LIST_SIZE setting.
    MAX_HEADER_LIST_SIZE   = 0x06

    #: The byte that signals the SETTINGS_MAX_FRAME_SIZE setting.
    #: .. deprecated:: 3.2.0
    #:    Use :data:`MAX_FRAME_SIZE <SettingsFrame.MAX_FRAME_SIZE>` instead.
    SETTINGS_MAX_FRAME_SIZE = MAX_FRAME_SIZE
    #: The byte that signals the SETTINGS_MAX_HEADER_LIST_SIZE setting.
    #: .. deprecated:: 3.2.0
    #     Use :data:`MAX_HEADER_LIST_SIZE <SettingsFrame.MAX_HEADER_LIST_SIZE>` instead.
    SETTINGS_MAX_HEADER_LIST_SIZE = MAX_HEADER_LIST_SIZE

    def __init__(self, stream_id=0, settings=None, **kwargs):
        super(SettingsFrame, self).__init__(stream_id, **kwargs)

        if settings and "ACK" in kwargs.get("flags", ()):
            raise ValueError("Settings must be empty if ACK flag is set.")

        #: A dictionary of the setting type byte to the value of the setting.
        self.settings = settings or {}

    def serialize_body(self):
        settings = [struct.pack("!HL", setting & 0xFF, value)
                    for setting, value in self.settings.items()]
        return b''.join(settings)

    def parse_body(self, data):
        for i in range(0, len(data), 6):
            try:
                name, value = struct.unpack("!HL", data[i:i+6])
            except struct.error:
                raise InvalidFrameError("Invalid SETTINGS body")

            self.settings[name] = value

        self.body_len = len(data)


class PushPromiseFrame(Padding, Frame):
    """
    The PUSH_PROMISE frame is used to notify the peer endpoint in advance of
    streams the sender intends to initiate.
    """
    #: The flags defined for PUSH_PROMISE frames.
    defined_flags = [
        Flag('END_HEADERS', 0x04),
        Flag('PADDED', 0x08)
    ]

    #: The type byte defined for PUSH_PROMISE frames.
    type = 0x05

    stream_association = 'has-stream'

    def __init__(self, stream_id, promised_stream_id=0, data=b'', **kwargs):
        super(PushPromiseFrame, self).__init__(stream_id, **kwargs)

        #: The stream ID that is promised by this frame.
        self.promised_stream_id = promised_stream_id

        #: The HPACK-encoded header block for the simulated request on the new
        #: stream.
        self.data = data

    def serialize_body(self):
        padding_data = self.serialize_padding_data()
        padding = b'\0' * self.total_padding
        data = struct.pack("!L", self.promised_stream_id)
        return b''.join([padding_data, data, self.data, padding])

    def parse_body(self, data):
        padding_data_length = self.parse_padding_data(data)

        try:
            self.promised_stream_id = struct.unpack(
                "!L", data[padding_data_length:padding_data_length + 4]
            )[0]
        except struct.error:
            raise InvalidFrameError("Invalid PUSH_PROMISE body")

        self.data = data[padding_data_length + 4:].tobytes()
        self.body_len = len(data)

        if self.total_padding and self.total_padding >= self.body_len:
            raise InvalidPaddingError("Padding is too long.")


class PingFrame(Frame):
    """
    The PING frame is a mechanism for measuring a minimal round-trip time from
    the sender, as well as determining whether an idle connection is still
    functional. PING frames can be sent from any endpoint.
    """
    #: The flags defined for PING frames.
    defined_flags = [Flag('ACK', 0x01)]

    #: The type byte defined for PING frames.
    type = 0x06

    stream_association = 'no-stream'

    def __init__(self, stream_id=0, opaque_data=b'', **kwargs):
        super(PingFrame, self).__init__(stream_id, **kwargs)

        #: The opaque data sent in this PING frame, as a bytestring.
        self.opaque_data = opaque_data

    def serialize_body(self):
        if len(self.opaque_data) > 8:
            raise InvalidFrameError(
                "PING frame may not have more than 8 bytes of data, got %s" %
                self.opaque_data
            )

        data = self.opaque_data
        data += b'\x00' * (8 - len(self.opaque_data))
        return data

    def parse_body(self, data):
        if len(data) != 8:
            raise InvalidFrameError(
                "PING frame must have 8 byte length: got %s" % len(data)
            )

        self.opaque_data = data.tobytes()
        self.body_len = len(data)


class GoAwayFrame(Frame):
    """
    The GOAWAY frame informs the remote peer to stop creating streams on this
    connection. It can be sent from the client or the server. Once sent, the
    sender will ignore frames sent on new streams for the remainder of the
    connection.
    """
    #: The flags defined for GOAWAY frames.
    defined_flags = []

    #: The type byte defined for GOAWAY frames.
    type = 0x07

    stream_association = 'no-stream'

    def __init__(self, stream_id=0, last_stream_id=0, error_code=0, additional_data=b'', **kwargs):
        super(GoAwayFrame, self).__init__(stream_id, **kwargs)

        #: The last stream ID definitely seen by the remote peer.
        self.last_stream_id = last_stream_id

        #: The error code for connection teardown.
        self.error_code = error_code

        #: Any additional data sent in the GOAWAY.
        self.additional_data = additional_data

    def serialize_body(self):
        data = struct.pack(
            "!LL",
            self.last_stream_id & 0x7FFFFFFF,
            self.error_code
        )
        data += self.additional_data

        return data

    def parse_body(self, data):
        try:
            self.last_stream_id, self.error_code = struct.unpack(
                "!LL", data[:8]
            )
        except struct.error:
            raise InvalidFrameError("Invalid GOAWAY body.")

        self.body_len = len(data)

        if len(data) > 8:
            self.additional_data = data[8:].tobytes()


class WindowUpdateFrame(Frame):
    """
    The WINDOW_UPDATE frame is used to implement flow control.

    Flow control operates at two levels: on each individual stream and on the
    entire connection.

    Both types of flow control are hop by hop; that is, only between the two
    endpoints. Intermediaries do not forward WINDOW_UPDATE frames between
    dependent connections. However, throttling of data transfer by any receiver
    can indirectly cause the propagation of flow control information toward the
    original sender.
    """
    #: The flags defined for WINDOW_UPDATE frames.
    defined_flags = []

    #: The type byte defined for WINDOW_UPDATE frames.
    type = 0x08

    stream_association = 'either'

    def __init__(self, stream_id, window_increment=0, **kwargs):
        super(WindowUpdateFrame, self).__init__(stream_id, **kwargs)

        #: The amount the flow control window is to be incremented.
        self.window_increment = window_increment

    def serialize_body(self):
        return struct.pack("!L", self.window_increment & 0x7FFFFFFF)

    def parse_body(self, data):
        try:
            self.window_increment = struct.unpack("!L", data)[0]
        except struct.error:
            raise InvalidFrameError("Invalid WINDOW_UPDATE body")

        self.body_len = len(data)


class HeadersFrame(Padding, Priority, Frame):
    """
    The HEADERS frame carries name-value pairs. It is used to open a stream.
    HEADERS frames can be sent on a stream in the "open" or "half closed
    (remote)" states.

    The HeadersFrame class is actually basically a data frame in this
    implementation, because of the requirement to control the sizes of frames.
    A header block fragment that doesn't fit in an entire HEADERS frame needs
    to be followed with CONTINUATION frames. From the perspective of the frame
    building code the header block is an opaque data segment.
    """
    #: The flags defined for HEADERS frames.
    defined_flags = [
        Flag('END_STREAM', 0x01),
        Flag('END_HEADERS', 0x04),
        Flag('PADDED', 0x08),
        Flag('PRIORITY', 0x20),
    ]

    #: The type byte defined for HEADERS frames.
    type = 0x01

    stream_association = 'has-stream'

    def __init__(self, stream_id, data=b'', **kwargs):
        super(HeadersFrame, self).__init__(stream_id, **kwargs)

        #: The HPACK-encoded header block.
        self.data = data

    def serialize_body(self):
        padding_data = self.serialize_padding_data()
        padding = b'\0' * self.total_padding

        if 'PRIORITY' in self.flags:
            priority_data = self.serialize_priority_data()
        else:
            priority_data = b''

        return b''.join([padding_data, priority_data, self.data, padding])

    def parse_body(self, data):
        padding_data_length = self.parse_padding_data(data)
        data = data[padding_data_length:]

        if 'PRIORITY' in self.flags:
            priority_data_length = self.parse_priority_data(data)
        else:
            priority_data_length = 0

        self.body_len = len(data)
        self.data = data[priority_data_length:len(data)-self.total_padding].tobytes()

        if self.total_padding and self.total_padding >= self.body_len:
            raise InvalidPaddingError("Padding is too long.")


class ContinuationFrame(Frame):
    """
    The CONTINUATION frame is used to continue a sequence of header block
    fragments. Any number of CONTINUATION frames can be sent on an existing
    stream, as long as the preceding frame on the same stream is one of
    HEADERS, PUSH_PROMISE or CONTINUATION without the END_HEADERS flag set.

    Much like the HEADERS frame, hyper treats this as an opaque data frame with
    different flags and a different type.
    """
    #: The flags defined for CONTINUATION frames.
    defined_flags = [Flag('END_HEADERS', 0x04),]

    #: The type byte defined for CONTINUATION frames.
    type = 0x09

    stream_association = 'has-stream'

    def __init__(self, stream_id, data=b'', **kwargs):
        super(ContinuationFrame, self).__init__(stream_id, **kwargs)

        #: The HPACK-encoded header block.
        self.data = data

    def serialize_body(self):
        return self.data

    def parse_body(self, data):
        self.data = data.tobytes()
        self.body_len = len(data)


Origin = collections.namedtuple('Origin', ['scheme', 'host', 'port'])


class AltSvcFrame(Frame):
    """
    The ALTSVC frame is used to advertise alternate services that the current
    host, or a different one, can understand.
    """
    type = 0xA

    stream_association = 'no-stream'

    def __init__(self, stream_id=0, host=b'', port=0, protocol_id=b'', max_age=0, origin=None, **kwargs):
        super(AltSvcFrame, self).__init__(stream_id, **kwargs)

        self.host = host
        self.port = port
        self.protocol_id = protocol_id
        self.max_age = max_age
        self.origin = origin

    def serialize_origin(self):
        if self.origin is not None:
            if self.origin.port is None:
                hostport = self.origin.host
            else:
                hostport = self.origin.host + b':' + str(self.origin.port).encode('ascii')
            return self.origin.scheme + b'://' + hostport
        return b''

    def parse_origin(self, data):
        if len(data) > 0:
            data = data.tobytes()
            scheme, hostport = data.split(b'://')
            host, _, port = hostport.partition(b':')
            self.origin = Origin(scheme=scheme, host=host,
                                 port=int(port) if len(port) > 0 else None)

    def serialize_body(self):
        first = struct.pack("!LHxB", self.max_age, self.port, len(self.protocol_id))
        host_length = struct.pack("!B", len(self.host))
        return b''.join([first, self.protocol_id, host_length, self.host,
                         self.serialize_origin()])

    def parse_body(self, data):
        try:
            self.body_len = len(data)
            self.max_age, self.port, protocol_id_length = struct.unpack(
                "!LHxB", data[:8]
            )
            pos = 8
            self.protocol_id = data[pos:pos+protocol_id_length].tobytes()
            pos += protocol_id_length
            host_length = struct.unpack("!B", data[pos:pos+1])[0]
            pos += 1
            self.host = data[pos:pos+host_length].tobytes()
            pos += host_length
            self.parse_origin(data[pos:])
        except (struct.error, ValueError):
            raise InvalidFrameError("Invalid ALTSVC frame body.")


class BlockedFrame(Frame):
    """
    The BLOCKED frame indicates that the sender is unable to send data due to a
    closed flow control window.

    The BLOCKED frame is used to provide feedback about the performance of flow
    control for the purposes of performance tuning and debugging. The BLOCKED
    frame can be sent by a peer when flow controlled data cannot be sent due to
    the connection- or stream-level flow control. This frame MUST NOT be sent
    if there are other reasons preventing data from being sent, either a lack
    of available data, or the underlying transport being blocked.
    """
    type = 0x0B

    stream_association = 'both'

    defined_flags = []

    def serialize_body(self):
        return b''

    def parse_body(self, data):
        pass


_FRAME_CLASSES = [
    DataFrame,
    HeadersFrame,
    PriorityFrame,
    RstStreamFrame,
    SettingsFrame,
    PushPromiseFrame,
    PingFrame,
    GoAwayFrame,
    WindowUpdateFrame,
    ContinuationFrame,
    AltSvcFrame,
    BlockedFrame
]
#: FRAMES maps the type byte for each frame to the class used to represent that
#: frame.
FRAMES = {cls.type: cls for cls in _FRAME_CLASSES}
