import zlib

from extension import Extension
from frame import ControlFrame


class DeflateFrame(Extension):
    """
    This is an implementation of the "deflate-frame" extension, as defined by
    http://tools.ietf.org/html/draft-tyoshino-hybi-websocket-perframe-deflate-06.

    Supported parameters are:
    - max_window_size: maximum size for the LZ77 sliding window.
    - no_context_takeover: disallows usage of LZ77 sliding window from
                           previously built frames for the current frame.

    Note that the deflate and inflate hooks modify the RSV1 bit and payload of
    existing `Frame` objects.
    """
    names = ('deflate-frame', 'x-webkit-deflate-frame')
    rsv1 = True
    defaults = {
        'max_window_bits': zlib.MAX_WBITS,
        'no_context_takeover': False
    }

    compression_threshold = 20  # minimal payload size for compression

    def negotiate(self, name, params):
        if 'max_window_bits' in params:
            mwb = int(params['max_window_bits'])
            assert 8 <= mwb <= zlib.MAX_WBITS
            yield 'max_window_bits', mwb

        if 'no_context_takeover' in params:
            assert params['no_context_takeover'] is True
            yield 'no_context_takeover', True

    class Instance(Extension.Instance):
        def init(self):
            if not self.no_context_takeover:
                self.defl = zlib.compressobj(zlib.Z_DEFAULT_COMPRESSION,
                        zlib.DEFLATED, -self.max_window_bits)
                self.dec = zlib.decompressobj(-self.max_window_bits)

        def onsend(self, frame):
            if not frame.rsv1 and not isinstance(frame, ControlFrame) and \
                   len(frame.payload) > self.extension.compression_threshold:
                deflated = self.deflate(frame.payload)

                if len(deflated) < len(frame.payload):
                    frame.rsv1 = True
                    frame.payload = deflated

        def onrecv(self, frame):
            if frame.rsv1:
                if isinstance(frame, ControlFrame):
                    raise ValueError('received compressed control frame')

                frame.rsv1 = False
                frame.payload = self.inflate(frame.payload)

        def deflate(self, data):
            if self.no_context_takeover:
                self.defl = zlib.compressobj(zlib.Z_DEFAULT_COMPRESSION,
                        zlib.DEFLATED, -self.max_window_bits)

            compressed = self.defl.compress(data)
            compressed += self.defl.flush(zlib.Z_SYNC_FLUSH)
            assert compressed[-4:] == '\x00\x00\xff\xff'
            return compressed[:-4]

        def inflate(self, data):
            data = str(data + '\x00\x00\xff\xff')

            if self.no_context_takeover:
                self.dec = zlib.decompressobj(-self.max_window_bits)

            return self.dec.decompress(data)
