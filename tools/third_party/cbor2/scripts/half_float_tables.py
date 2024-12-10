#!/usr/bin/python3

"""
A simple script to generate the tables used in halffloat.c. The algorithms in
this script are based upon the paper `Fast Half Float Conversions`_, referenced
by the Wikipedia article on `half-precision floating point`_.

.. _half-precision floating point:
   https://en.wikipedia.org/wiki/Half-precision_floating-point_format
.. _Fast Half Float Conversions:
   ftp://ftp.fox-toolkit.org/pub/fasthalffloatconversion.pdf
"""

from itertools import zip_longest


def grouper(iterable, n, fillvalue=None):
    args = [iter(iterable)] * n
    return zip_longest(*args, fillvalue=fillvalue)


def sigtable():
    print("static const uint32_t sigtable[] = {")
    values = (
        0 if i == 0 else convertsig(i) if 1 <= i < 1024 else 0x38000000 + ((i - 1024) << 13)
        for i in range(2048)
    )
    values = (f"{i:#010x}" for i in values)
    for row in grouper(values, 8):
        print("    " + (", ".join(row)) + ",")
    print("};")


def exptable():
    values = (
        0
        if i == 0
        else 0x47800000
        if i == 31
        else 0x80000000
        if i == 32
        else i << 23
        if 1 <= i < 31
        else 0x80000000 + ((i - 32) << 23)
        if 33 <= i < 63
        else 0xC7800000  # i == 63
        for i in range(64)
    )

    print("static const uint32_t exptable[] = {")
    values = (f"{i:#010x}" for i in values)
    for row in grouper(values, 8):
        print("    " + (", ".join(row)) + ",")
    print("};")


def offsettable():
    values = (0 if i in (0, 32) else 1024 for i in range(64))

    print("static const uint16_t offsettable[] = {")
    values = (f"{i:#06x}" for i in values)
    for row in grouper(values, 8):
        print("    " + (", ".join(row)) + ",")
    print("};")


def convertsig(i):
    if not i:
        return 0
    m = i << 13
    e = 0
    while not m & 0x00800000:
        e -= 0x00800000
        m <<= 1
    m &= ~0x00800000
    e += 0x38800000
    return m | e


def basetable():
    values = [0] * 512
    for i in range(256):
        e = i - 127
        if e < -24:  # underflow to 0
            values[i | 0x000] = 0
            values[i | 0x100] = 0x8000
        elif e < -14:  # smalls to denorms
            values[i | 0x000] = 0x400 >> (-e - 14)
            values[i | 0x100] = (0x400 >> (-e - 14)) | 0x8000
        elif e < 15:  # normal case
            values[i | 0x000] = (e + 15) << 10
            values[i | 0x100] = ((e + 15) << 10) | 0x8000
        elif e < 128:  # overflow to inf
            values[i | 0x000] = 0x7C00
            values[i | 0x100] = 0xFC00
        else:  # inf and nan
            values[i | 0x000] = 0x7C00
            values[i | 0x100] = 0xFC00

    print("static const uint16_t basetable[] = {")
    values = (f"{i:#06x}" for i in values)
    for row in grouper(values, 8):
        print("    " + (", ".join(row)) + ",")
    print("};")


def shifttable():
    values = [0] * 512
    for i in range(256):
        e = i - 127
        if e < -24:  # underflow to 0
            values[i | 0x000] = 24
            values[i | 0x100] = 24
        elif e < -14:  # smalls to denorms
            values[i | 0x000] = -e - 1
            values[i | 0x100] = -e - 1
        elif e < 15:  # normal case
            values[i | 0x000] = 13
            values[i | 0x100] = 13
        elif e < 128:  # overflow to inf
            values[i | 0x000] = 24
            values[i | 0x100] = 24
        else:  # inf and nan
            values[i | 0x000] = 13
            values[i | 0x100] = 13

    print("static const uint16_t shifttable[] = {")
    values = (f"{i:#06x}" for i in values)
    for row in grouper(values, 8):
        print("    " + (", ".join(row)) + ",")
    print("};")


sigtable()
print()
exptable()
print()
offsettable()
print()
basetable()
print()
shifttable()
