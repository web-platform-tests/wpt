from __future__ import unicode_literals

import zlib

from six import PY2

from .errors import CompressionParameterError


class Deflate(object):
    """Compress with the Deflate algorithm."""

    def __init__(
        self, decompress_wbits, compress_wbits, reset_decompress, reset_compress
    ):
        self.decompress_wbits = decompress_wbits
        self.compress_wbits = compress_wbits
        self.reset_decompress = reset_decompress
        self.reset_compress = reset_compress
        self.reset_decompressor()
        self.reset_compressor()

    def __repr__(self):
        return "Deflate({}, {}, {}, {})".format(
            "decompress_wbits={!r}".format(self.decompress_wbits),
            "compress_wbits={!r}".format(self.compress_wbits),
            "reset_decompress={!r}".format(self.reset_decompress),
            "reset_compress={!r}".format(self.reset_compress),
        )

    def reset_compressor(self):
        """Reset the compressor for the next frame."""
        self._compressobj = zlib.compressobj(
            zlib.Z_DEFAULT_COMPRESSION,
            zlib.DEFLATED,
            -max(9, self.compress_wbits)
        )

    def reset_decompressor(self):
        """Reset the decompressor for the next frame."""
        self._decompressobj = zlib.decompressobj(-self.decompress_wbits)

    @classmethod
    def from_options(cls, options):
        """Build object from options dict."""
        decompress_wbits = cls.get_wbits(options, "server_max_window_bits")
        compress_wbits = cls.get_wbits(options, "client_max_window_bits")
        reset_decompress = "server_no_context_takeover" in options
        reset_compress = "client_no_context_takeover" in options
        deflate = Deflate(
            decompress_wbits, compress_wbits, reset_decompress, reset_compress
        )
        return deflate

    @classmethod
    def get_wbits(cls, options, key):
        """Parse wbits from options."""
        _wbits = options.get(key, "15")
        try:
            wbits = int(_wbits)
        except ValueError:
            raise CompressionParameterError("{} is not an integer".format(key))
        if wbits < 8 or wbits > 15:
            raise CompressionParameterError(
                "{}={} is invalid".format(key, wbits)
            )
        return wbits

    def decompress(self, frames):
        """Decompress payload, returned decompressed data."""
        if PY2:
            data = [
                self._decompressobj.decompress(bytes(frame.payload))
                for frame in frames
            ]
        else:
            data = [
                self._decompressobj.decompress(frame.payload)
                for frame in frames
            ]

        data.append(self._decompressobj.decompress(b"\x00\x00\xff\xff"))
        payload = b''.join(data)
        if self.reset_decompress:
            self.reset_decompressor()
        return payload

    def compress(self, payload):
        """Compress payload, return compressed data."""
        if PY2:
            payload = bytes(payload)
        data = (
            self._compressobj.compress(payload)
            + self._compressobj.flush(zlib.Z_SYNC_FLUSH)
        )[:-4]
        if self.reset_compress:
            self.reset_compressor()
        return data
