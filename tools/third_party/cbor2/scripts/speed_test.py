#!/usr/bin/env python

"""
A simple script for testing the two cbor2 implementations speed against each
other (as well as against the C-based cbor implementation). This script assumes
you're in an environment with cbor and cbor2 installed.

By default the script will output a nicely formatted table comparing the speeds
of the three implementations (cbor, c-cbor2, py-cbor2). Entries in the c-cbor2
columns will be color coded, with green indicating the test was at least 20%
faster than the py-cbor2 implementation, red indicating the test was at least
5% slower (5% is a reasonable margin of error as timing measurements are rarely
precise in a non-RTOS), and white indicating a speed between these two
boundaries.

If the "--csv" argument is given, the script will output the results in CSV
format to stdout (for piping to whatever you want to use them in).
"""

import csv
import re
import sys
import timeit
from collections import OrderedDict, namedtuple
from datetime import datetime, timezone
from decimal import Decimal
from fractions import Fraction
from math import ceil, log2

import cbor


def import_cbor2():
    # Similar hack to that used in tests/conftest to get separate C and Python
    # implementations
    import cbor2
    import cbor2.decoder
    import cbor2.encoder
    import cbor2.types

    class Module:
        # Mock module class
        pass

    py_cbor2 = Module()
    for source in (cbor2.types, cbor2.encoder, cbor2.decoder):
        for name in dir(source):
            setattr(py_cbor2, name, getattr(source, name))
    return cbor2, py_cbor2


c_cbor2, py_cbor2 = import_cbor2()


UTC = timezone.utc

TEST_VALUES = [
    # label,            kwargs, value
    ("None", {}, None),
    ("10e0", {}, 1),
    ("10e12", {}, 1000000000000),
    ("10e29", {}, 100000000000000000000000000000),
    ("-10e0", {}, -1),
    ("-10e12", {}, -1000000000000),
    ("-10e29", {}, -100000000000000000000000000000),
    ("float1", {}, 1.0),
    ("float2", {}, 3.8),
    ("str", {}, "foo"),
    ("bigstr", {}, "foobarbaz " * 1000),
    ("bytes", {}, b"foo"),
    ("bigbytes", {}, b"foobarbaz\x00" * 1000),
    ("datetime", {"timezone": UTC}, datetime(2019, 5, 9, 22, 4, 5, 123456)),
    ("decimal", {}, Decimal("1.1")),
    ("fraction", {}, Fraction(1, 5)),
    ("intlist", {}, [1, 2, 3]),
    ("bigintlist", {}, [1, 2, 3] * 1000),
    ("strlist", {}, ["foo", "bar", "baz"]),
    ("bigstrlist", {}, ["foo", "bar", "baz"] * 1000),
    ("dict", {}, {"a": 1, "b": 2, "c": 3}),
    ("bigdict", {}, {"a" * i: i for i in range(1000)}),
    ("set", {}, {1, 2, 3}),
    ("bigset", {}, set(range(1000))),
    ("bigdictlist", {}, [{"a" * i: i for i in range(100)}] * 100),
    (
        "objectdict",
        {"timezone": UTC},
        {"name": "Foo", "species": "cat", "dob": datetime(2013, 5, 20), "weight": 4.1},
    ),
    (
        "objectdictlist",
        {"timezone": UTC},
        [{"name": "Foo", "species": "cat", "dob": datetime(2013, 5, 20), "weight": 4.1}] * 100,
    ),
]


Codec = namedtuple("Codec", ("cbor", "c_cbor2", "py_cbor2"))
Result = namedtuple("Result", ("encoding", "decoding"))
Timing = namedtuple("Timing", ("time", "repeat", "count"))


def autorange(op, limit=0.2):
    # Adapted from the Python 3.7 version of timeit
    t = timeit.Timer(op)
    i = 1
    while True:
        for j in 1, 2, 5:
            number = i * j
            time_taken = t.timeit(number)
            if time_taken >= limit:
                return number
        i *= 10


def time(op, repeat=3):
    try:
        number = autorange(op, limit=0.02)
    except Exception as e:
        return e
    t = timeit.Timer(op)
    return Timing(min(t.repeat(repeat, number)) / number, repeat, number)


def format_time(t, suffixes=("s", "ms", "µs", "ns"), zero="0s", template="{time:.1f}{suffix}"):
    if isinstance(t, Exception):
        return "-"
    else:
        try:
            index = min(len(suffixes) - 1, ceil(log2(1 / t.time) / 10))
        except ValueError:
            return zero
        else:
            return template.format(time=t.time * 2 ** (index * 10), suffix=suffixes[index])


def print_len(s):
    return len(re.sub(r"\x1b\[.*?m", "", s))


RED = "\x1b[1;31m"
GREEN = "\x1b[1;32m"
RESET = "\x1b[0m"


def color_time(t, lim):
    time_str = format_time(t)
    if isinstance(t, Exception):
        return RED + time_str + RESET
    elif t.time <= lim.time * 0.8:
        return GREEN + time_str + RESET
    elif t.time > lim.time * 1.05:
        return RED + time_str + RESET
    else:
        return time_str


def output_table(results):
    # Build table content
    head = ("Test",) + ("cbor", "c-cbor2", "py-cbor2") * 2
    rows = [head] + [
        (
            value,
            format_time(result.cbor.encoding),
            color_time(result.c_cbor2.encoding, result.py_cbor2.encoding),
            format_time(result.py_cbor2.encoding),
            format_time(result.cbor.decoding),
            color_time(result.c_cbor2.decoding, result.py_cbor2.decoding),
            format_time(result.py_cbor2.decoding),
        )
        for value, result in results.items()
    ]

    # Format table output
    cols = zip(*rows)
    col_widths = [max(print_len(row) for row in col) for col in cols]
    sep = "".join(
        (
            "+-",
            "-+-".join("-" * width for width in col_widths),
            "-+",
        )
    )
    print(
        "".join(
            (
                "  ",
                " " * col_widths[0],
                " +-",
                "-" * (sum(col_widths[1:4]) + 6),
                "-+-",
                "-" * (sum(col_widths[4:7]) + 6),
                "-+",
            )
        )
    )
    print(
        "".join(
            (
                "  ",
                " " * col_widths[0],
                " | ",
                "{value:^{width}}".format(value="Encoding", width=sum(col_widths[1:4]) + 6),
                " | ",
                "{value:^{width}}".format(value="Decoding", width=sum(col_widths[4:7]) + 6),
                " |",
            )
        )
    )
    print(sep)
    print(
        "".join(
            (
                "| ",
                " | ".join(
                    "{value:<{width}}".format(value=value, width=width)
                    for value, width in zip(head, col_widths)
                ),
                " |",
            )
        )
    )
    print(sep)
    for row in rows[1:]:
        print(
            "".join(
                (
                    "| ",
                    " | ".join(
                        "{value:<{width}}".format(
                            value=value, width=width + len(value) - print_len(value)
                        )
                        for value, width in zip(row, col_widths)
                    ),
                    " |",
                )
            )
        )
    print(sep)


def output_csv(results):
    writer = csv.writer(sys.stdout)
    writer.writerow(
        (
            "Title",
            "cbor-encode",
            "c-cbor2-encode",
            "py-cbor2-encode",
            "cbor-decode",
            "c-cbor2-decode",
            "py-cbor2-decode",
        )
    )
    for title, result in results.items():
        writer.writerow(
            (
                title,
                result.cbor.encoding.time if isinstance(result.cbor.encoding, Timing) else None,
                result.c_cbor2.encoding.time,
                result.py_cbor2.encoding.time,
                result.cbor.decoding.time if isinstance(result.cbor.encoding, Timing) else None,
                result.c_cbor2.decoding.time,
                result.py_cbor2.decoding.time,
            )
        )


def main():
    results = OrderedDict()
    sys.stderr.write("Testing")
    sys.stderr.flush()
    for name, kwargs, value in TEST_VALUES:
        encoded = py_cbor2.dumps(value, **kwargs)
        results[name] = Codec(
            **{
                mod_name: Result(
                    encoding=time(lambda: mod.dumps(value, **kwargs)),
                    decoding=time(lambda: mod.loads(encoded)),
                )
                for mod_name, mod in {
                    "cbor": cbor,
                    "c_cbor2": c_cbor2,
                    "py_cbor2": py_cbor2,
                }.items()
            }
        )
        sys.stderr.write(".")
        sys.stderr.flush()
    sys.stderr.write("\n")
    sys.stderr.write("\n")
    if len(sys.argv) > 1 and sys.argv[1] == "--csv":
        output_csv(results)
    else:
        output_table(results)


if __name__ == "__main__":
    main()
