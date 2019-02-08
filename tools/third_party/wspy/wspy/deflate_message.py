import zlib

from extension import Extension
from deflate_frame import DeflateFrame


class DeflateMessage(Extension):
    """
    Implementation of the "permessage-deflate" extension, as defined by
    http://tools.ietf.org/html/draft-ietf-hybi-permessage-compression-17.

    Note: this implementetion is only eligible for server sockets, client
    sockets must NOT use it.
    """
    name = 'permessage-deflate'
    rsv1 = True
    defaults = {
        'client_max_window_bits': zlib.MAX_WBITS,
        'client_no_context_takeover': False,
        'server_max_window_bits': zlib.MAX_WBITS,
        'server_no_context_takeover': False
    }
    before_fragmentation = True

    compression_threshold = 20  # minimal message payload size for compression

    def negotiate(self, name, params):
        default = self.defaults['client_max_window_bits']

        if 'client_max_window_bits' in params:
            mwb = params['client_max_window_bits']

            if mwb is True:
                if default != zlib.MAX_WBITS:
                    yield 'client_max_window_bits', default
            else:
                mwb = int(mwb)
                assert 8 <= mwb <= zlib.MAX_WBITS
                yield 'client_max_window_bits', min(mwb, default)
        elif default != zlib.MAX_WBITS:
            yield 'client_max_window_bits', default

        if 'client_no_context_takeover' in params:
            assert params['client_no_context_takeover'] is True
            yield 'client_no_context_takeover', True
        elif self.defaults['client_no_context_takeover']:
            yield 'client_no_context_takeover', True

        default = self.defaults['server_max_window_bits']

        if 'server_max_window_bits' in params:
            mwb = int(params['server_max_window_bits'])
            assert 8 <= mwb <= zlib.MAX_WBITS
            yield 'server_max_window_bits', min(mwb, default)
        elif default != zlib.MAX_WBITS:
            yield 'server_max_window_bits', default

        if 'server_no_context_takeover' in params:
            assert params['server_no_context_takeover'] is True
            yield 'server_no_context_takeover', True
        elif self.defaults['server_no_context_takeover']:
            yield 'server_no_context_takeover', True

    class Instance(DeflateFrame.Instance):
        def init(self):
            if not self.server_no_context_takeover:
                self.defl = zlib.compressobj(zlib.Z_DEFAULT_COMPRESSION,
                        zlib.DEFLATED, -self.server_max_window_bits)

            if not self.client_no_context_takeover:
                self.dec = zlib.decompressobj(-self.client_max_window_bits)

        def deflate(self, data):
            if self.server_no_context_takeover:
                self.defl = zlib.compressobj(zlib.Z_DEFAULT_COMPRESSION,
                        zlib.DEFLATED, -self.server_max_window_bits)

            compressed = self.defl.compress(data)
            compressed += self.defl.flush(zlib.Z_SYNC_FLUSH)
            assert compressed[-4:] == '\x00\x00\xff\xff'
            return compressed[:-4]

        def inflate(self, data):
            data = str(data + '\x00\x00\xff\xff')

            if self.client_no_context_takeover:
                self.dec = zlib.decompressobj(-self.client_max_window_bits)

            return self.dec.decompress(data)
