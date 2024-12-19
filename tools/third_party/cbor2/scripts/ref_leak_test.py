#!/usr/bin/env python

"""
This is a crude script for detecting reference leaks in the C-based cbor2
implementation. It is by no means fool-proof and won't pick up all possible ref
leaks, but it is a reasonable "confidence test" that things aren't horribly
wrong. The script assumes you're in an environment with objgraph and cbor2
installed.

The script outputs a nicely formatted table of the tests run, and the number of
"extra" objects that existed after the tests (indicating a ref-leak), or "-" if
no extra objects existed. The ideal output is obviously "-" in all rows.
"""

import sys
import tracemalloc
from collections import OrderedDict, namedtuple
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fractions import Fraction

import objgraph


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
    ("tag", {}, c_cbor2.CBORTag(1, 1)),
    ("nestedtag", {}, {c_cbor2.CBORTag(1, 1): 1}),
]

Leaks = namedtuple("Leaks", ("count", "comparison"))
Tests = namedtuple("Tests", ("objgraph", "malloc"))
Result = namedtuple("Result", ("encoding", "decoding", "roundtrip"))


peak = {}


def growth():
    return objgraph.growth(limit=None, peak_stats=peak)


def test_malloc(op):
    count = 0
    start = datetime.now()
    # NOTE: Filter pointing to the op() line in the loop below, because we're
    # only interested in memory allocated by that line. Naturally, if this file
    # is edited, the lineno parameter below must be adjusted!
    only_op = tracemalloc.Filter(True, __file__, lineno=102, all_frames=True)
    tracemalloc.start(10)
    try:
        # Perform a pre-run of op so that any one-time memory allocation
        # (module imports, etc.) don't affect the later diffs
        op()
        before = tracemalloc.take_snapshot().filter_traces([only_op])
        while True:
            count += 1
            op()
            if datetime.now() - start > timedelta(seconds=0.2):
                break
        after = tracemalloc.take_snapshot().filter_traces([only_op])
        diff = after.compare_to(before, "traceback")
        diff = [entry for entry in diff if entry.size_diff > 0]
        return count, diff
    finally:
        tracemalloc.stop()


def test_objgraph(op):
    count = 0
    start = datetime.now()
    # See notes above
    op()
    growth()
    while True:
        count += 1
        op()
        if datetime.now() - start > timedelta(seconds=0.2):
            break
    return count, growth()


def test(op):
    return Tests(Leaks(*test_objgraph(op)), Leaks(*test_malloc(op)))


def format_leaks(result):
    if result.objgraph.comparison:
        return "%d objs (/%d)" % (
            sum(leak[-1] for leak in result.objgraph.comparison),
            result.objgraph.count,
        )
    elif result.malloc.comparison and (
        result.malloc.count < result.malloc.comparison[0].size_diff
    ):
        # Running the loop always results in *some* memory allocation, but as
        # long as the bytes allocated are less than the number of loops it's
        # unlikely to be an actual leak
        return "%d bytes (/%d)" % (
            result.malloc.comparison[0].size_diff,
            result.malloc.count,
        )
    else:
        return "-"


def output_table(results):
    # Build table content
    head = ("Test", "Encoding", "Decoding", "Round-trip")
    rows = [head] + [
        (
            label,
            format_leaks(result.encoding),
            format_leaks(result.decoding),
            format_leaks(result.roundtrip),
        )
        for label, result in results.items()
    ]

    # Format table output
    cols = zip(*rows)
    col_widths = [max(len(row) for row in col) for col in cols]
    sep = "".join(
        (
            "+-",
            "-+-".join("-" * width for width in col_widths),
            "-+",
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
                        "{value:<{width}}".format(value=value, width=width)
                        for value, width in zip(row, col_widths)
                    ),
                    " |",
                )
            )
        )
    print(sep)
    print()
    print(
        """\
There *will* be false positives in the table above. Ignore leaks involving a
tiny number of objects (e.g. 1) or a small number of bytes (e.g. < 8Kb) as such
allocations are quite normal.

In the case of a ref-leak of an object that can reference others (lists, sets,
dicts, or anything with a __dict__), expect to see 100s or 1000s of "objs"
leaked. In the case of a ref-leak of a simple object (int, str, bytes, etc.),
expect to see a few hundred Kb allocated.

If leaks occur across the board, it's likely to be in something universal like
dump/load. If it's restricted to a type, check the encoding and decoding
methods for that type.
"""
    )


def main():
    results = OrderedDict()
    sys.stderr.write("Testing")
    sys.stderr.flush()
    for name, kwargs, value in TEST_VALUES:
        encoded = c_cbor2.dumps(value, **kwargs)
        results[name] = Result(
            encoding=test(lambda: c_cbor2.dumps(value, **kwargs)),
            decoding=test(lambda: c_cbor2.loads(encoded)),
            roundtrip=test(lambda: c_cbor2.loads(c_cbor2.dumps(value, **kwargs))),
        )
        sys.stderr.write(".")
        sys.stderr.flush()
    sys.stderr.write("\n")
    sys.stderr.write("\n")
    output_table(results)
    sys.stderr.write("\n")


if __name__ == "__main__":
    main()
