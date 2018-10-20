"""
Functions related to masking Websocket frames.
https://tools.ietf.org/html/rfc6455#section-5.3

"""

import os
from functools import partial

import six


make_masking_key = partial(os.urandom, 4)


if six.PY2:
    _XOR_TABLE = [b''.join(chr(a ^ b) for a in range(256)) for b in range(256)]
else:
    _XOR_TABLE = [bytes(a ^ b for a in range(256)) for b in range(256)]


def mask_payload(masking_key, data):
    """XOR mask bytes.

    `masking_key` should be bytes.
    `data` should be a bytearray, and is mutated.

    """
    a, b, c, d = (_XOR_TABLE[n] for n in bytearray(masking_key))
    data[::4] = data[::4].translate(a)
    data[1::4] = data[1::4].translate(b)
    data[2::4] = data[2::4].translate(c)
    data[3::4] = data[3::4].translate(d)
