from __future__ import unicode_literals

import pytest

from lomond.compression import CompressionParameterError, Deflate
from lomond.frame import Frame


def test_deflate_repr():
    deflate = Deflate(15, 8, False, False)
    assert repr(deflate) == 'Deflate(decompress_wbits=15, compress_wbits=8, reset_decompress=False, reset_compress=False)'


def test_get_wbits():
    with pytest.raises(CompressionParameterError):
        Deflate.get_wbits({'foo': 'nan'}, 'foo')
    with pytest.raises(CompressionParameterError):
        Deflate.get_wbits({'foo': '100'}, 'foo')
    with pytest.raises(CompressionParameterError):
        Deflate.get_wbits({'foo': '7'}, 'foo')
    with pytest.raises(CompressionParameterError):
        Deflate.get_wbits({'foo': '16'}, 'foo')
    assert Deflate.get_wbits({'foo': '8'}, 'foo') == 8


def test_compression():
    data = [
        b'Hello ',
        b'World!',
        b'foo',
        b'bar',
        b'baz'
    ]
    deflate = Deflate(15, 8, True, True)
    for raw in data:
        compressed_data = deflate.compress(raw)
        frames = [Frame(1, compressed_data, fin=1)]
        assert deflate.decompress(frames) == raw
