from __future__ import annotations

import math
import platform
import re
import struct
import sys
from binascii import unhexlify
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from email.message import Message
from fractions import Fraction
from io import BytesIO
from ipaddress import ip_address, ip_network
from pathlib import Path
from typing import Type, cast
from uuid import UUID

import pytest

from cbor2 import FrozenDict


def test_fp_attr(impl):
    with pytest.raises(ValueError):
        impl.CBORDecoder(None)
    with pytest.raises(ValueError):

        class A:
            pass

        foo = A()
        foo.read = None
        impl.CBORDecoder(foo)
    with BytesIO(b"foobar") as stream:
        decoder = impl.CBORDecoder(stream)
        assert decoder.fp is stream
        with pytest.raises(AttributeError):
            del decoder.fp


def test_tag_hook_attr(impl):
    with BytesIO(b"foobar") as stream:
        with pytest.raises(ValueError):
            impl.CBORDecoder(stream, tag_hook="foo")
        decoder = impl.CBORDecoder(stream)

        def tag_hook(decoder, tag):
            return None

        decoder.tag_hook = tag_hook
        assert decoder.tag_hook is tag_hook
        with pytest.raises(AttributeError):
            del decoder.tag_hook


def test_object_hook_attr(impl):
    with BytesIO(b"foobar") as stream:
        with pytest.raises(ValueError):
            impl.CBORDecoder(stream, object_hook="foo")
        decoder = impl.CBORDecoder(stream)

        def object_hook(decoder, data):
            return None

        decoder.object_hook = object_hook
        assert decoder.object_hook is object_hook
        with pytest.raises(AttributeError):
            del decoder.object_hook


def test_str_errors_attr(impl):
    with BytesIO(b"foobar") as stream:
        with pytest.raises(ValueError):
            impl.CBORDecoder(stream, str_errors=False)
        with pytest.raises(ValueError):
            impl.CBORDecoder(stream, str_errors="foo")
        decoder = impl.CBORDecoder(stream)
        decoder.str_errors = "replace"
        assert decoder.str_errors == "replace"
        with pytest.raises(AttributeError):
            del decoder.str_errors


def test_read(impl):
    with BytesIO(b"foobar") as stream:
        decoder = impl.CBORDecoder(stream)
        assert decoder.read(3) == b"foo"
        assert decoder.read(3) == b"bar"
        with pytest.raises(TypeError):
            decoder.read("foo")
        with pytest.raises(impl.CBORDecodeError):
            decoder.read(10)


def test_decode_from_bytes(impl):
    with BytesIO(b"foobar") as stream:
        decoder = impl.CBORDecoder(stream)
        assert decoder.decode_from_bytes(b"\x01") == 1
        with pytest.raises(TypeError):
            decoder.decode_from_bytes("foo")


def test_immutable_attr(impl):
    with BytesIO(unhexlify("d917706548656c6c6f")) as stream:
        decoder = impl.CBORDecoder(stream)
        assert not decoder.immutable

        def tag_hook(decoder, tag):
            assert decoder.immutable
            return tag.value

        decoder.decode()


def test_load(impl):
    with pytest.raises(TypeError):
        impl.load()
    with pytest.raises(TypeError):
        impl.loads()
    assert impl.loads(s=b"\x01") == 1
    with BytesIO(b"\x01") as stream:
        assert impl.load(fp=stream) == 1


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("00", 0),
        ("01", 1),
        ("0a", 10),
        ("17", 23),
        ("1818", 24),
        ("1819", 25),
        ("1864", 100),
        ("1903e8", 1000),
        ("1a000f4240", 1000000),
        ("1b000000e8d4a51000", 1000000000000),
        ("1bffffffffffffffff", 18446744073709551615),
        ("c249010000000000000000", 18446744073709551616),
        ("3bffffffffffffffff", -18446744073709551616),
        ("c349010000000000000000", -18446744073709551617),
        ("20", -1),
        ("29", -10),
        ("3863", -100),
        ("3903e7", -1000),
    ],
)
def test_integer(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


def test_invalid_integer_subtype(impl):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(b"\x1c")
        assert str(exc.value).endswith("unknown unsigned integer subtype 0x1c")
        assert isinstance(exc, ValueError)


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("f90000", 0.0),
        ("f98000", -0.0),
        ("f93c00", 1.0),
        ("fb3ff199999999999a", 1.1),
        ("f93e00", 1.5),
        ("f97bff", 65504.0),
        ("fa47c35000", 100000.0),
        ("fa7f7fffff", 3.4028234663852886e38),
        ("fb7e37e43c8800759c", 1.0e300),
        ("f90001", 5.960464477539063e-8),
        ("f90400", 0.00006103515625),
        ("f9c400", -4.0),
        ("fbc010666666666666", -4.1),
        ("f97c00", float("inf")),
        ("f9fc00", float("-inf")),
        ("fa7f800000", float("inf")),
        ("faff800000", float("-inf")),
        ("fb7ff0000000000000", float("inf")),
        ("fbfff0000000000000", float("-inf")),
    ],
)
def test_float(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize("payload", ["f97e00", "fa7fc00000", "fb7ff8000000000000"])
def test_float_nan(impl, payload):
    decoded = impl.loads(unhexlify(payload))
    assert math.isnan(decoded)


@pytest.fixture(
    params=[("f4", False), ("f5", True), ("f6", None), ("f7", "undefined")],
    ids=["false", "true", "null", "undefined"],
)
def special_values(request, impl):
    payload, expected = request.param
    if expected == "undefined":
        expected = impl.undefined
    return payload, expected


def test_special(impl, special_values):
    payload, expected = special_values
    decoded = impl.loads(unhexlify(payload))
    assert decoded is expected


@pytest.mark.parametrize(
    "payload, expected",
    [
        pytest.param("40", b"", id="blank"),
        pytest.param("4401020304", b"\x01\x02\x03\x04", id="short"),
        pytest.param("5a00011170" + "12" * 70000, b"\x12" * 70000, id="long"),
    ],
)
def test_binary(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("60", ""),
        ("6161", "a"),
        ("6449455446", "IETF"),
        ("62225c", '"\\'),
        ("62c3bc", "\u00fc"),
        ("63e6b0b4", "\u6c34"),
        pytest.param("7a00010001" + "61" * 65535 + "c3b6", "a" * 65535 + "ö", id="split_unicode"),
    ],
)
def test_string(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize(
    "payload",
    [
        pytest.param("6198", id="short"),
        pytest.param("7a00010000" + "61" * 65535 + "c3", id="long"),
        pytest.param("7f6198ff", id="indefinite"),
    ],
)
def test_string_invalid_utf8(impl, payload: str) -> None:
    with pytest.raises(impl.CBORDecodeValueError, match="error decoding unicode string") as exc:
        impl.loads(unhexlify(payload))

    assert isinstance(exc.value.__cause__, UnicodeDecodeError)


def test_string_oversized(impl) -> None:
    with pytest.raises(impl.CBORDecodeEOF, match="premature end of stream"):
        (impl.loads(unhexlify("aeaeaeaeaeaeaeaeae0108c29843d90100d8249f0000aeaeffc26ca799")),)


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("80", []),
        ("83010203", [1, 2, 3]),
        ("8301820203820405", [1, [2, 3], [4, 5]]),
        (
            "98190102030405060708090a0b0c0d0e0f101112131415161718181819",
            list(range(1, 26)),
        ),
    ],
)
def test_array(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize("payload, expected", [("a0", {}), ("a201020304", {1: 2, 3: 4})])
def test_map(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("a26161016162820203", {"a": 1, "b": [2, 3]}),
        ("826161a161626163", ["a", {"b": "c"}]),
        (
            "a56161614161626142616361436164614461656145",
            {"a": "A", "b": "B", "c": "C", "d": "D", "e": "E"},
        ),
    ],
)
def test_mixed_array_map(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("5f42010243030405ff", b"\x01\x02\x03\x04\x05"),
        ("7f657374726561646d696e67ff", "streaming"),
        ("9fff", []),
        ("9f018202039f0405ffff", [1, [2, 3], [4, 5]]),
        ("9f01820203820405ff", [1, [2, 3], [4, 5]]),
        ("83018202039f0405ff", [1, [2, 3], [4, 5]]),
        ("83019f0203ff820405", [1, [2, 3], [4, 5]]),
        (
            "9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff",
            list(range(1, 26)),
        ),
        ("bf61610161629f0203ffff", {"a": 1, "b": [2, 3]}),
        ("826161bf61626163ff", ["a", {"b": "c"}]),
        ("bf6346756ef563416d7421ff", {"Fun": True, "Amt": -2}),
        ("d901029f010203ff", {1, 2, 3}),
    ],
)
def test_streaming(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize(
    "payload",
    [
        "5f42010200",
        "7f63737472a0",
    ],
)
def test_bad_streaming_strings(impl, payload):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify(payload))
        assert exc.match(r"non-(byte)?string found in indefinite length \1string")
        assert isinstance(exc, ValueError)


@pytest.fixture(
    params=[
        ("e0", 0),
        ("e2", 2),
        ("f3", 19),
        ("f820", 32),
    ]
)
def simple_value(request, impl):
    payload, expected = request.param
    return payload, expected, impl.CBORSimpleValue(expected)


def test_simple_value(impl, simple_value):
    payload, expected, wrapped = simple_value
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected
    assert decoded == wrapped


def test_simple_val_as_key(impl):
    decoded = impl.loads(unhexlify("A1F86301"))
    assert decoded == {impl.CBORSimpleValue(99): 1}


#
# Tests for extension tags
#


@pytest.mark.parametrize(
    "payload, expected",
    [
        (
            "d903ec6a323031332d30332d3231",
            date(2013, 3, 21),
        ),
        (
            "d8641945e8",
            date(2018, 12, 31),
        ),
    ],
    ids=[
        "date/string",
        "date/timestamp",
    ],
)
def test_date(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


@pytest.mark.parametrize(
    "payload, expected",
    [
        (
            "c074323031332d30332d32315432303a30343a30305a",
            datetime(2013, 3, 21, 20, 4, 0, tzinfo=timezone.utc),
        ),
        (
            "c0781b323031332d30332d32315432303a30343a30302e3338303834315a",
            datetime(2013, 3, 21, 20, 4, 0, 380841, tzinfo=timezone.utc),
        ),
        (
            "c07819323031332d30332d32315432323a30343a30302b30323a3030",
            datetime(2013, 3, 21, 22, 4, 0, tzinfo=timezone(timedelta(hours=2))),
        ),
        ("c11a514b67b0", datetime(2013, 3, 21, 20, 4, 0, tzinfo=timezone.utc)),
        (
            "c11a514b67b0",
            datetime(2013, 3, 21, 22, 4, 0, tzinfo=timezone(timedelta(hours=2))),
        ),
    ],
    ids=[
        "datetime/utc",
        "datetime+micro/utc",
        "datetime/eet",
        "timestamp/utc",
        "timestamp/eet",
    ],
)
def test_datetime(impl, payload, expected):
    decoded = impl.loads(unhexlify(payload))
    assert decoded == expected


def test_datetime_secfrac(impl):
    decoded = impl.loads(b"\xc0\x78\x162018-08-02T07:00:59.1Z")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 100000, tzinfo=timezone.utc)
    decoded = impl.loads(b"\xc0\x78\x172018-08-02T07:00:59.01Z")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 10000, tzinfo=timezone.utc)
    decoded = impl.loads(b"\xc0\x78\x182018-08-02T07:00:59.001Z")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 1000, tzinfo=timezone.utc)
    decoded = impl.loads(b"\xc0\x78\x192018-08-02T07:00:59.0001Z")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 100, tzinfo=timezone.utc)
    decoded = impl.loads(b"\xc0\x78\x1a2018-08-02T07:00:59.00001Z")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 10, tzinfo=timezone.utc)
    decoded = impl.loads(b"\xc0\x78\x1b2018-08-02T07:00:59.000001Z")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 1, tzinfo=timezone.utc)
    decoded = impl.loads(b"\xc0\x78\x1c2018-08-02T07:00:59.0000001Z")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 0, tzinfo=timezone.utc)


def test_datetime_secfrac_naive_float_to_int_cast(impl):
    # A secfrac that would have rounding errors if naively parsed as
    # `int(float(secfrac) * 1000000)`.
    decoded = impl.loads(b"\xc0\x78\x202018-08-02T07:00:59.000251+00:00")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 251, tzinfo=timezone.utc)


def test_datetime_secfrac_overflow(impl):
    decoded = impl.loads(b"\xc0\x78\x2c2018-08-02T07:00:59.100500999999999999+00:00")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 100500, tzinfo=timezone.utc)
    decoded = impl.loads(b"\xc0\x78\x2c2018-08-02T07:00:59.999999999999999999+00:00")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, 999999, tzinfo=timezone.utc)


def test_datetime_secfrac_requires_digit(impl):
    with pytest.raises(impl.CBORDecodeError) as excinfo:
        impl.loads(b"\xc0\x78\x1a2018-08-02T07:00:59.+00:00")
    assert isinstance(excinfo.value, ValueError)
    assert str(excinfo.value) == "invalid datetime string: '2018-08-02T07:00:59.+00:00'"

    with pytest.raises(impl.CBORDecodeError) as excinfo:
        impl.loads(b"\xc0\x78\x152018-08-02T07:00:59.Z")
    assert isinstance(excinfo.value, ValueError)
    assert str(excinfo.value) == "invalid datetime string: '2018-08-02T07:00:59.Z'"


def test_bad_datetime(impl):
    with pytest.raises(impl.CBORDecodeError) as excinfo:
        impl.loads(unhexlify("c06b303030302d3132332d3031"))
    assert isinstance(excinfo.value, ValueError)
    assert str(excinfo.value) == "invalid datetime string: '0000-123-01'"


def test_datetime_overflow(impl):
    with pytest.raises(impl.CBORDecodeError) as excinfo:
        impl.loads(unhexlify("c11b9b9b9b0000000000"))

    assert isinstance(excinfo.value.__cause__, OverflowError)


def test_datetime_value_too_large(impl):
    with pytest.raises(impl.CBORDecodeError) as excinfo:
        impl.loads(unhexlify("c11b1616161616161616161616161616"))

    assert excinfo.value.__cause__ is not None


def test_datetime_date_out_of_range(impl):
    with pytest.raises(impl.CBORDecodeError) as excinfo:
        impl.loads(unhexlify("a6c11b00002401001b000000000000ff00"))

    if sys.maxsize == 2147483647:
        cause_exc_class = OverflowError
    elif platform.system() == "Windows":
        cause_exc_class = OSError
    else:
        cause_exc_class = ValueError

    assert isinstance(excinfo.value.__cause__, cause_exc_class)


def test_datetime_timezone(impl):
    decoded = impl.loads(b"\xc0\x78\x192018-08-02T07:00:59+00:30")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, tzinfo=timezone(timedelta(minutes=30)))
    decoded = impl.loads(b"\xc0\x78\x192018-08-02T07:00:59-00:30")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, tzinfo=timezone(timedelta(minutes=-30)))
    decoded = impl.loads(b"\xc0\x78\x192018-08-02T07:00:59+01:30")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, tzinfo=timezone(timedelta(minutes=90)))
    decoded = impl.loads(b"\xc0\x78\x192018-08-02T07:00:59-01:30")
    assert decoded == datetime(2018, 8, 2, 7, 0, 59, tzinfo=timezone(timedelta(minutes=-90)))


def test_positive_bignum(impl):
    # Example from RFC 8949 section 3.4.3.
    decoded = impl.loads(unhexlify("c249010000000000000000"))
    assert decoded == 18446744073709551616


def test_negative_bignum(impl):
    decoded = impl.loads(unhexlify("c349010000000000000000"))
    assert decoded == -18446744073709551617


def test_fraction(impl):
    decoded = impl.loads(unhexlify("c48221196ab3"))
    assert decoded == Decimal("273.15")


def test_decimal_precision(impl):
    decoded = impl.loads(unhexlify("c482384dc252011f1fe37d0c70ff50456ba8b891997b07d6"))
    assert decoded == Decimal("9.7703426561852468194804075821069770622934E-38")


def test_bigfloat(impl):
    decoded = impl.loads(unhexlify("c5822003"))
    assert decoded == Decimal("1.5")


def test_rational(impl):
    decoded = impl.loads(unhexlify("d81e820205"))
    assert decoded == Fraction(2, 5)


def test_rational_invalid_iterable(impl):
    with pytest.raises(
        impl.CBORDecodeValueError, match="error decoding rational: input value was not a tuple"
    ):
        impl.loads(unhexlify("d81e01"))


def test_rational_zero_denominator(impl):
    with pytest.raises(impl.CBORDecodeValueError, match="error decoding rational") as exc:
        impl.loads(unhexlify("d81e820100"))

    assert isinstance(exc.value.__cause__, ZeroDivisionError)


def test_regex(impl):
    decoded = impl.loads(unhexlify("d8236d68656c6c6f2028776f726c6429"))
    expr = re.compile("hello (world)")
    assert decoded == expr


def test_regex_unbalanced_parentheses(impl):
    with pytest.raises(
        impl.CBORDecodeValueError, match="error decoding regular expression"
    ) as exc:
        impl.loads(unhexlify("d8236c68656c6c6f2028776f726c64"))

    assert isinstance(exc.value.__cause__, re.error)


def test_mime(impl):
    decoded = impl.loads(
        unhexlify(
            "d824787b436f6e74656e742d547970653a20746578742f706c61696e3b20636861727365743d2269736f"
            "2d383835392d3135220a4d494d452d56657273696f6e3a20312e300a436f6e74656e742d5472616e7366"
            "65722d456e636f64696e673a2071756f7465642d7072696e7461626c650a0a48656c6c6f203d41347572"
            "6f"
        )
    )
    assert isinstance(decoded, Message)
    assert decoded.get_payload() == "Hello =A4uro"


def test_mime_invalid_type(impl):
    with pytest.raises(impl.CBORDecodeValueError, match="error decoding MIME message") as exc:
        impl.loads(unhexlify("d82401"))

    assert isinstance(exc.value.__cause__, TypeError)


def test_uuid(impl):
    decoded = impl.loads(unhexlify("d825505eaffac8b51e480581277fdcc7842faf"))
    assert decoded == UUID(hex="5eaffac8b51e480581277fdcc7842faf")


def test_uuid_invalid_length(impl):
    with pytest.raises(impl.CBORDecodeValueError, match="error decoding UUID value") as exc:
        impl.loads(unhexlify("d8254f5eaffac8b51e480581277fdcc7842f"))

    assert isinstance(exc.value.__cause__, ValueError)


def test_uuid_invalid_type(impl):
    with pytest.raises(impl.CBORDecodeValueError, match="error decoding UUID value") as exc:
        impl.loads(unhexlify("d82501"))

    assert isinstance(exc.value.__cause__, TypeError)


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("d9010444c00a0a01", ip_address("192.10.10.1")),
        (
            "d901045020010db885a3000000008a2e03707334",
            ip_address("2001:db8:85a3::8a2e:370:7334"),
        ),
        ("d9010446010203040506", (260, b"\x01\x02\x03\x04\x05\x06")),
    ],
    ids=[
        "ipv4",
        "ipv6",
        "mac",
    ],
)
def test_ipaddress(impl, payload, expected):
    if isinstance(expected, tuple):
        expected = impl.CBORTag(*expected)
    payload = unhexlify(payload)
    assert impl.loads(payload) == expected


def test_bad_ipaddress(impl):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("d9010443c00a0a"))
        assert str(exc.value).endswith("invalid ipaddress value {!r}".format(b"\xc0\x0a\x0a"))
        assert isinstance(exc, ValueError)
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("d9010401"))
        assert str(exc.value).endswith("invalid ipaddress value 1")
        assert isinstance(exc, ValueError)


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("d90105a144c0a800641818", ip_network("192.168.0.100/24", False)),
        (
            "d90105a15020010db885a3000000008a2e000000001860",
            ip_network("2001:db8:85a3:0:0:8a2e::/96", False),
        ),
    ],
    ids=[
        "ipv4",
        "ipv6",
    ],
)
def test_ipnetwork(impl, payload, expected):
    # XXX The following pytest.skip is only included to work-around a bug in
    # pytest under python 3.3 (which prevents the decorator above from skipping
    # correctly); remove when 3.3 support is dropped
    payload = unhexlify(payload)
    assert impl.loads(payload) == expected


def test_bad_ipnetwork(impl):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("d90105a244c0a80064181844c0a800001818"))
        assert str(exc.value).endswith(
            "invalid ipnetwork value %r" % {b"\xc0\xa8\x00d": 24, b"\xc0\xa8\x00\x00": 24}
        )
        assert isinstance(exc, ValueError)
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("d90105a144c0a80064420102"))
        assert str(exc.value).endswith(
            "invalid ipnetwork value %r" % {b"\xc0\xa8\x00d": b"\x01\x02"}
        )
        assert isinstance(exc, ValueError)


def test_bad_shared_reference(impl):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("d81d05"))
        assert str(exc.value).endswith("shared reference 5 not found")
        assert isinstance(exc, ValueError)


def test_uninitialized_shared_reference(impl):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("D81CA1D81D014161"))
        assert str(exc.value).endswith("shared value 0 has not been initialized")
        assert isinstance(exc, ValueError)


def test_immutable_shared_reference(impl):
    # a = (1, 2, 3)
    # b = ((a, a), a)
    # data = dumps(set(b))
    decoded = impl.loads(unhexlify("d90102d81c82d81c82d81c83010203d81d02d81d02"))
    a = [item for item in decoded if len(item) == 3][0]
    b = [item for item in decoded if len(item) == 2][0]
    assert decoded == {(a, a), a}
    assert b[0] is a
    assert b[1] is a


def test_cyclic_array(impl):
    decoded = impl.loads(unhexlify("d81c81d81d00"))
    assert decoded == [decoded]


def test_cyclic_map(impl):
    decoded = impl.loads(unhexlify("d81ca100d81d00"))
    assert decoded == {0: decoded}


def test_string_ref(impl):
    decoded = impl.loads(unhexlify("d9010085656669727374d81900667365636f6e64d81900d81901"))
    assert isinstance(decoded, list)
    assert decoded[0] == "first"
    assert decoded[1] == "first"
    assert decoded[2] == "second"
    assert decoded[3] == "first"
    assert decoded[4] == "second"


def test_outside_string_ref_namespace(impl):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("85656669727374d81900667365636f6e64d81900d81901"))
        assert str(exc.value).endswith("string reference outside of namespace")
        assert isinstance(exc, ValueError)


def test_invalid_string_ref(impl):
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("d9010086656669727374d81900667365636f6e64d81900d81901d81903"))
        assert str(exc.value).endswith("string reference 3 not found")
        assert isinstance(exc, ValueError)


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("d9d9f71903e8", 1000),
        ("d9d9f7c249010000000000000000", 18446744073709551616),
    ],
    ids=["self_describe_cbor+int", "self_describe_cbor+positive_bignum"],
)
def test_self_describe_cbor(impl, payload, expected):
    assert impl.loads(unhexlify(payload)) == expected


def test_unhandled_tag(impl):
    """
    Test that a tag is simply ignored and its associated value returned if there is no special
    handling available for it.

    """
    decoded = impl.loads(unhexlify("d917706548656c6c6f"))
    assert decoded == impl.CBORTag(6000, "Hello")


def test_premature_end_of_stream(impl):
    """
    Test that the decoder detects a situation where read() returned fewer than expected bytes.

    """
    with pytest.raises(impl.CBORDecodeError) as exc:
        impl.loads(unhexlify("437879"))
        exc.match(r"premature end of stream \(expected to read 3 bytes, got 2 instead\)")
        assert isinstance(exc, EOFError)


def test_tag_hook(impl):
    def reverse(decoder, tag):
        return tag.value[::-1]

    decoded = impl.loads(unhexlify("d917706548656c6c6f"), tag_hook=reverse)
    assert decoded == "olleH"


def test_tag_hook_cyclic(impl):
    class DummyType:
        def __init__(self, value):
            self.value = value

    def unmarshal_dummy(decoder, tag):
        instance = DummyType.__new__(DummyType)
        decoder.set_shareable(instance)
        instance.value = decoder.decode_from_bytes(tag.value)
        return instance

    decoded = impl.loads(unhexlify("D81CD90BB849D81CD90BB843D81D00"), tag_hook=unmarshal_dummy)
    assert isinstance(decoded, DummyType)
    assert decoded.value.value is decoded


def test_object_hook(impl):
    class DummyType:
        def __init__(self, state):
            self.state = state

    payload = unhexlify("A2616103616205")
    decoded = impl.loads(payload, object_hook=lambda decoder, value: DummyType(value))
    assert isinstance(decoded, DummyType)
    assert decoded.state == {"a": 3, "b": 5}


def test_object_hook_exception(impl):
    def object_hook(decoder, data):
        raise RuntimeError("foo")

    payload = unhexlify("A2616103616205")
    with pytest.raises(RuntimeError, match="foo"):
        impl.loads(payload, object_hook=object_hook)


def test_load_from_file(impl, tmpdir):
    path = tmpdir.join("testdata.cbor")
    path.write_binary(b"\x82\x01\x0a")
    with path.open("rb") as fp:
        obj = impl.load(fp)

    assert obj == [1, 10]


def test_nested_dict(impl):
    value = impl.loads(unhexlify("A1D9177082010201"))
    assert type(value) is dict
    assert value == {impl.CBORTag(6000, (1, 2)): 1}


def test_set(impl):
    payload = unhexlify("d9010283616361626161")
    value = impl.loads(payload)
    assert type(value) is set
    assert value == {"a", "b", "c"}


@pytest.mark.parametrize(
    "payload, expected",
    [
        ("a1a1616161626163", {FrozenDict({"a": "b"}): "c"}),
        (
            "A1A1A10101A1666E6573746564F5A1666E6573746564F4",
            {FrozenDict({FrozenDict({1: 1}): FrozenDict({"nested": True})}): {"nested": False}},
        ),
        ("a182010203", {(1, 2): 3}),
        ("a1d901028301020304", {frozenset({1, 2, 3}): 4}),
        ("A17f657374726561646d696e67ff01", {"streaming": 1}),
        ("d9010282d90102820102d90102820304", {frozenset({1, 2}), frozenset({3, 4})}),
    ],
)
def test_immutable_keys(impl, payload, expected):
    value = impl.loads(unhexlify(payload))
    assert value == expected


# Corrupted or invalid data checks


def test_huge_truncated_array(impl, will_overflow):
    with pytest.raises(impl.CBORDecodeError):
        impl.loads(unhexlify("9b") + will_overflow)


def test_huge_truncated_string(impl):
    huge_index = struct.pack("Q", sys.maxsize + 1)
    with pytest.raises((impl.CBORDecodeError, MemoryError)):
        impl.loads(unhexlify("7b") + huge_index + unhexlify("70717273"))


@pytest.mark.parametrize("dtype_prefix", ["7B", "5b"], ids=["string", "bytes"])
def test_huge_truncated_data(impl, dtype_prefix, will_overflow):
    with pytest.raises((impl.CBORDecodeError, MemoryError)):
        impl.loads(unhexlify(dtype_prefix) + will_overflow)


@pytest.mark.parametrize("tag_dtype", ["7F7B", "5f5B"], ids=["string", "bytes"])
def test_huge_truncated_indefinite_data(impl, tag_dtype, will_overflow):
    huge_index = struct.pack("Q", sys.maxsize + 1)
    with pytest.raises((impl.CBORDecodeError, MemoryError)):
        impl.loads(unhexlify(tag_dtype) + huge_index + unhexlify("70717273ff"))


@pytest.mark.parametrize("data", ["7f61777f6177ffff", "5f41775f4177ffff"], ids=["string", "bytes"])
def test_embedded_indefinite_data(impl, data):
    with pytest.raises(impl.CBORDecodeValueError):
        impl.loads(unhexlify(data))


@pytest.mark.parametrize("data", ["7f01ff", "5f01ff"], ids=["string", "bytes"])
def test_invalid_indefinite_data_item(impl, data):
    with pytest.raises(impl.CBORDecodeValueError):
        impl.loads(unhexlify(data))


@pytest.mark.parametrize(
    "data",
    ["7f7bff0000000000000471717272ff", "5f5bff0000000000000471717272ff"],
    ids=["string", "bytes"],
)
def test_indefinite_overflow(impl, data):
    with pytest.raises(impl.CBORDecodeValueError):
        impl.loads(unhexlify(data))


def test_invalid_cbor(impl):
    with pytest.raises(impl.CBORDecodeError):
        impl.loads(
            unhexlify(
                "c788370016b8965bdb2074bff82e5a20e09bec21f8406e86442b87ec3ff245b70a47624dc9cdc682"
                "4b2a4c52e95ec9d6b0534b71c2b49e4bf9031500cee6869979c297bb5a8b381e98db714108415e5c"
                "50db78974c271579b01633a3ef6271be5c225eb2"
            )
        )


@pytest.mark.parametrize(
    "data, expected",
    [("fc", "1c"), ("fd", "1d"), ("fe", "1e")],
)
def test_reserved_special_tags(impl, data, expected):
    with pytest.raises(impl.CBORDecodeValueError) as exc_info:
        impl.loads(unhexlify(data))
    assert exc_info.value.args[0] == "Undefined Reserved major type 7 subtype 0x" + expected


@pytest.mark.parametrize(
    "data, expected",
    [("c400", "4"), ("c500", "5")],
)
def test_decimal_payload_unpacking(impl, data, expected):
    with pytest.raises(impl.CBORDecodeValueError) as exc_info:
        impl.loads(unhexlify(data))
    assert exc_info.value.args[0] == f"Incorrect tag {expected} payload"


@pytest.mark.parametrize(
    "payload",
    [
        pytest.param(
            unhexlify("41"),
            id="bytestring",
        ),
        pytest.param(
            unhexlify("61"),
            id="unicode",
        ),
    ],
)
def test_oversized_read(impl, payload: bytes, tmp_path: Path) -> None:
    CBORDecodeEOF = cast(Type[Exception], getattr(impl, "CBORDecodeEOF"))
    with pytest.raises(CBORDecodeEOF, match="premature end of stream"):
        dummy_path = tmp_path / "testdata"
        dummy_path.write_bytes(payload)
        with dummy_path.open("rb") as f:
            impl.load(f)
