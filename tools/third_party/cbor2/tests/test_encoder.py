import re
from binascii import unhexlify
from collections import OrderedDict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from email.mime.text import MIMEText
from fractions import Fraction
from io import BytesIO
from ipaddress import ip_address, ip_network
from uuid import UUID

import pytest
from hypothesis import given

from cbor2 import FrozenDict, shareable_encoder

from .hypothesis_strategies import compound_types_strategy


def test_fp_attr(impl):
    with pytest.raises(ValueError):
        impl.CBOREncoder(None)
    with pytest.raises(ValueError):

        class A:
            pass

        foo = A()
        foo.write = None
        impl.CBOREncoder(foo)
    with BytesIO() as stream:
        encoder = impl.CBOREncoder(stream)
        assert encoder.fp is stream
        with pytest.raises(AttributeError):
            del encoder.fp


def test_default_attr(impl):
    with BytesIO() as stream:
        encoder = impl.CBOREncoder(stream)
        assert encoder.default is None
        with pytest.raises(ValueError):
            encoder.default = 1
        with pytest.raises(AttributeError):
            del encoder.default


def test_timezone_attr(impl):
    with BytesIO() as stream:
        encoder = impl.CBOREncoder(stream)
        assert encoder.timezone is None
        with pytest.raises(ValueError):
            encoder.timezone = 1
        with pytest.raises(AttributeError):
            del encoder.timezone


def test_write(impl):
    with BytesIO() as stream:
        encoder = impl.CBOREncoder(stream)
        encoder.write(b"foo")
        assert stream.getvalue() == b"foo"
        with pytest.raises(TypeError):
            encoder.write(1)


def test_encoders_load_type(impl):
    with BytesIO() as stream:
        encoder = impl.CBOREncoder(stream)
        encoder._encoders[(1, 2, 3)] = lambda self, value: None
        with pytest.raises(ValueError) as exc:
            encoder.encode(object())
            assert str(exc.value).endswith(
                "invalid deferred encoder type (1, 2, 3) (must be a 2-tuple "
                "of module name and type name, e.g. ('collections', "
                "'defaultdict'))"
            )


def test_encode_length(impl):
    # This test is purely for coverage in the C variant
    with BytesIO() as stream:
        encoder = impl.CBOREncoder(stream)
        encoder.encode_length(0, 1)
        assert stream.getvalue() == b"\x01"


def test_canonical_attr(impl):
    # Another test purely for coverage in the C variant
    with BytesIO() as stream:
        enc = impl.CBOREncoder(stream)
        assert not enc.canonical
        enc = impl.CBOREncoder(stream, canonical=True)
        assert enc.canonical


def test_dump(impl):
    with pytest.raises(TypeError):
        impl.dump()
    with pytest.raises(TypeError):
        impl.dumps()
    assert impl.dumps(obj=1) == b"\x01"
    with BytesIO() as stream:
        impl.dump(fp=stream, obj=1)
        assert stream.getvalue() == b"\x01"


@pytest.mark.parametrize(
    "value, expected",
    [
        (0, "00"),
        (1, "01"),
        (10, "0a"),
        (23, "17"),
        (24, "1818"),
        (100, "1864"),
        (1000, "1903e8"),
        (1000000, "1a000f4240"),
        (1000000000000, "1b000000e8d4a51000"),
        (18446744073709551615, "1bffffffffffffffff"),
        (18446744073709551616, "c249010000000000000000"),
        (-18446744073709551616, "3bffffffffffffffff"),
        (-18446744073709551617, "c349010000000000000000"),
        (-1, "20"),
        (-10, "29"),
        (-100, "3863"),
        (-1000, "3903e7"),
    ],
)
def test_integer(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


@pytest.mark.parametrize(
    "value, expected",
    [
        (1.1, "fb3ff199999999999a"),
        (1.0e300, "fb7e37e43c8800759c"),
        (-4.1, "fbc010666666666666"),
        (float("inf"), "f97c00"),
        (float("nan"), "f97e00"),
        (float("-inf"), "f9fc00"),
    ],
)
def test_float(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


@pytest.mark.parametrize(
    "value, expected",
    [
        (b"", "40"),
        (b"\x01\x02\x03\x04", "4401020304"),
    ],
)
def test_bytestring(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


def test_bytearray(impl):
    expected = unhexlify("4401020304")
    assert impl.dumps(bytearray(b"\x01\x02\x03\x04")) == expected


@pytest.mark.parametrize(
    "value, expected",
    [
        ("", "60"),
        ("a", "6161"),
        ("IETF", "6449455446"),
        ('"\\', "62225c"),
        ("\u00fc", "62c3bc"),
        ("\u6c34", "63e6b0b4"),
    ],
)
def test_string(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


@pytest.fixture(
    params=[(False, "f4"), (True, "f5"), (None, "f6"), ("undefined", "f7")],
    ids=["false", "true", "null", "undefined"],
)
def special_values(request, impl):
    value, expected = request.param
    if value == "undefined":
        value = impl.undefined
    return value, expected


def test_special(impl, special_values):
    value, expected = special_values
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


@pytest.fixture(params=[(0, "e0"), (2, "e2"), (23, "f7"), (32, "f820")])
def simple_values(request, impl):
    value, expected = request.param
    return impl.CBORSimpleValue(value), expected


def test_simple_value(impl, simple_values):
    value, expected = simple_values
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


def test_simple_val_as_key(impl):
    payload = {impl.CBORSimpleValue(99): 1}
    result = impl.dumps(payload)
    assert result == unhexlify("A1F86301")


#
# Tests for extension tags
#


@pytest.mark.parametrize(
    "value, as_timestamp, expected",
    [
        (
            datetime(2013, 3, 21, 20, 4, 0, tzinfo=timezone.utc),
            False,
            "c074323031332d30332d32315432303a30343a30305a",
        ),
        (
            datetime(2013, 3, 21, 20, 4, 0, 380841, tzinfo=timezone.utc),
            False,
            "c0781b323031332d30332d32315432303a30343a30302e3338303834315a",
        ),
        (
            datetime(2013, 3, 21, 22, 4, 0, tzinfo=timezone(timedelta(hours=2))),
            False,
            "c07819323031332d30332d32315432323a30343a30302b30323a3030",
        ),
        (
            datetime(2013, 3, 21, 20, 4, 0),
            False,
            "c074323031332d30332d32315432303a30343a30305a",
        ),
        (datetime(2013, 3, 21, 20, 4, 0, tzinfo=timezone.utc), True, "c11a514b67b0"),
        (
            datetime(2013, 3, 21, 20, 4, 0, 123456, tzinfo=timezone.utc),
            True,
            "c1fb41d452d9ec07e6b4",
        ),
        (
            datetime(2013, 3, 21, 22, 4, 0, tzinfo=timezone(timedelta(hours=2))),
            True,
            "c11a514b67b0",
        ),
    ],
    ids=[
        "datetime/utc",
        "datetime+micro/utc",
        "datetime/eet",
        "naive",
        "timestamp/utc",
        "timestamp+micro/utc",
        "timestamp/eet",
    ],
)
def test_datetime(impl, value, as_timestamp, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value, datetime_as_timestamp=as_timestamp, timezone=timezone.utc) == expected


@pytest.mark.parametrize(
    "value, as_timestamp, expected",
    [
        (
            date(2013, 3, 21),
            False,
            "d903ec6a323031332d30332d3231",
        ),
        (
            date(2018, 12, 31),
            True,
            "d8641945e8",
        ),
    ],
    ids=["date/string", "date/timestamp"],
)
def test_date(impl, value, as_timestamp, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value, datetime_as_timestamp=as_timestamp) == expected


def test_date_as_datetime(impl):
    expected = unhexlify("c074323031332d30332d32315430303a30303a30305a")
    assert impl.dumps(date(2013, 3, 21), timezone=timezone.utc, date_as_datetime=True) == expected


def test_naive_datetime(impl):
    """Test that naive datetimes are gracefully rejected when no timezone has been set."""
    with pytest.raises(impl.CBOREncodeError) as exc:
        impl.dumps(datetime(2013, 3, 21))
        exc.match(
            "naive datetime datetime.datetime(2013, 3, 21) encountered "
            "and no default timezone has been set"
        )
        assert isinstance(exc, ValueError)


@pytest.mark.parametrize(
    "value, expected",
    [
        (Decimal("14.123"), "c4822219372b"),
        (Decimal("-14.123"), "C4822239372A"),
        (Decimal("NaN"), "f97e00"),
        (Decimal("Infinity"), "f97c00"),
        (Decimal("-Infinity"), "f9fc00"),
    ],
    ids=["normal", "negative", "nan", "inf", "neginf"],
)
def test_decimal(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


def test_rational(impl):
    expected = unhexlify("d81e820205")
    assert impl.dumps(Fraction(2, 5)) == expected


def test_regex(impl):
    expected = unhexlify("d8236d68656c6c6f2028776f726c6429")
    assert impl.dumps(re.compile("hello (world)")) == expected


def test_mime(impl):
    expected = unhexlify(
        "d824787b436f6e74656e742d547970653a20746578742f706c61696e3b20636861727365743d2269736f2d38"
        "3835392d3135220a4d494d452d56657273696f6e3a20312e300a436f6e74656e742d5472616e736665722d456"
        "e636f64696e673a2071756f7465642d7072696e7461626c650a0a48656c6c6f203d413475726f"
    )
    message = MIMEText("Hello \u20acuro", "plain", "iso-8859-15")
    assert impl.dumps(message) == expected


def test_uuid(impl):
    expected = unhexlify("d825505eaffac8b51e480581277fdcc7842faf")
    assert impl.dumps(UUID(hex="5eaffac8b51e480581277fdcc7842faf")) == expected


@pytest.mark.parametrize(
    "value, expected",
    [
        (ip_address("192.10.10.1"), "d9010444c00a0a01"),
        (
            ip_address("2001:db8:85a3::8a2e:370:7334"),
            "d901045020010db885a3000000008a2e03707334",
        ),
    ],
    ids=[
        "ipv4",
        "ipv6",
    ],
)
def test_ipaddress(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


@pytest.mark.parametrize(
    "value, expected",
    [
        (ip_network("192.168.0.100/24", False), "d90105a144c0a800001818"),
        (
            ip_network("2001:db8:85a3:0:0:8a2e::/96", False),
            "d90105a15020010db885a3000000008a2e000000001860",
        ),
    ],
    ids=[
        "ipv4",
        "ipv6",
    ],
)
def test_ipnetwork(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value) == expected


def test_custom_tag(impl):
    expected = unhexlify("d917706548656c6c6f")
    assert impl.dumps(impl.CBORTag(6000, "Hello")) == expected


def test_cyclic_array(impl):
    """Test that an array that contains itself can be serialized with value sharing enabled."""
    expected = unhexlify("d81c81d81c81d81d00")
    a = [[]]
    a[0].append(a)
    assert impl.dumps(a, value_sharing=True) == expected


def test_cyclic_array_nosharing(impl):
    """Test that serializing a cyclic structure w/o value sharing will blow up gracefully."""
    a = []
    a.append(a)
    with pytest.raises(impl.CBOREncodeError) as exc:
        impl.dumps(a)
        exc.match("cyclic data structure detected but value sharing is disabled")
        assert isinstance(exc, ValueError)


def test_cyclic_map(impl):
    """Test that a dict that contains itself can be serialized with value sharing enabled."""
    expected = unhexlify("d81ca100d81d00")
    a = {}
    a[0] = a
    assert impl.dumps(a, value_sharing=True) == expected


def test_cyclic_map_nosharing(impl):
    """Test that serializing a cyclic structure w/o value sharing will fail gracefully."""
    a = {}
    a[0] = a
    with pytest.raises(impl.CBOREncodeError) as exc:
        impl.dumps(a)
        exc.match("cyclic data structure detected but value sharing is disabled")
        assert isinstance(exc, ValueError)


@pytest.mark.parametrize(
    "value_sharing, expected",
    [(False, "828080"), (True, "d81c82d81c80d81d01")],
    ids=["nosharing", "sharing"],
)
def test_not_cyclic_same_object(impl, value_sharing, expected):
    """Test that the same shareable object can be included twice if not in a cyclic structure."""
    expected = unhexlify(expected)
    a = []
    b = [a, a]
    assert impl.dumps(b, value_sharing=value_sharing) == expected


def test_unsupported_type(impl):
    with pytest.raises(impl.CBOREncodeError) as exc:
        impl.dumps(lambda: None)
        exc.match("cannot serialize type function")
        assert isinstance(exc, TypeError)


def test_default(impl):
    class DummyType:
        def __init__(self, state):
            self.state = state

    def default_encoder(encoder, value):
        encoder.encode(value.state)

    expected = unhexlify("820305")
    obj = DummyType([3, 5])
    serialized = impl.dumps(obj, default=default_encoder)
    assert serialized == expected


def test_default_cyclic(impl):
    class DummyType:
        def __init__(self, value=None):
            self.value = value

    @shareable_encoder
    def default_encoder(encoder, value):
        state = encoder.encode_to_bytes(value.value)
        encoder.encode(impl.CBORTag(3000, state))

    expected = unhexlify("D81CD90BB849D81CD90BB843D81D00")
    obj = DummyType()
    obj2 = DummyType(obj)
    obj.value = obj2
    serialized = impl.dumps(obj, value_sharing=True, default=default_encoder)
    assert serialized == expected


def test_dump_to_file(impl, tmpdir):
    path = tmpdir.join("testdata.cbor")
    with path.open("wb") as fp:
        impl.dump([1, 10], fp)

    assert path.read_binary() == b"\x82\x01\x0a"


@pytest.mark.parametrize(
    "value, expected",
    [
        ({}, "a0"),
        (OrderedDict([(b"a", b""), (b"b", b"")]), "A2416140416240"),
        (OrderedDict([(b"b", b""), (b"a", b"")]), "A2416140416240"),
        (OrderedDict([("a", ""), ("b", "")]), "a2616160616260"),
        (OrderedDict([("b", ""), ("a", "")]), "a2616160616260"),
        (OrderedDict([(b"00001", ""), (b"002", "")]), "A2433030326045303030303160"),
        (OrderedDict([(255, 0), (2, 0)]), "a2020018ff00"),
        (FrozenDict([(b"a", b""), (b"b", b"")]), "A2416140416240"),
    ],
    ids=[
        "empty",
        "bytes in order",
        "bytes out of order",
        "text in order",
        "text out of order",
        "byte length",
        "integer keys",
        "frozendict",
    ],
)
def test_ordered_map(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value, canonical=True) == expected


@pytest.mark.parametrize(
    "value, expected",
    [
        (3.5, "F94300"),
        (100000.0, "FA47C35000"),
        (3.8, "FB400E666666666666"),
        (float("inf"), "f97c00"),
        (float("nan"), "f97e00"),
        (float("-inf"), "f9fc00"),
        (float.fromhex("0x1.0p-24"), "f90001"),
        (float.fromhex("0x1.4p-24"), "fa33a00000"),
        (float.fromhex("0x1.ff8p-63"), "fa207fc000"),
        (1e300, "fb7e37e43c8800759c"),
    ],
    ids=[
        "float 16",
        "float 32",
        "float 64",
        "inf",
        "nan",
        "-inf",
        "float 16 minimum positive subnormal",
        "mantissa o/f to 32",
        "exponent o/f to 32",
        "oversize float",
    ],
)
def test_minimal_floats(impl, value, expected):
    expected = unhexlify(expected)
    assert impl.dumps(value, canonical=True) == expected


def test_tuple_key(impl):
    assert impl.dumps({(2, 1): ""}) == unhexlify("a182020160")


def test_dict_key(impl):
    assert impl.dumps({FrozenDict({2: 1}): ""}) == unhexlify("a1a1020160")


@pytest.mark.parametrize("frozen", [False, True], ids=["set", "frozenset"])
def test_set(impl, frozen):
    value = {"a", "b", "c"}
    if frozen:
        value = frozenset(value)

    serialized = impl.dumps(value)
    assert len(serialized) == 10
    assert serialized.startswith(unhexlify("d9010283"))


@pytest.mark.parametrize("frozen", [False, True], ids=["set", "frozenset"])
def test_canonical_set(impl, frozen):
    value = {"y", "x", "aa", "a"}
    if frozen:
        value = frozenset(value)

    serialized = impl.dumps(value, canonical=True)
    assert serialized == unhexlify("d9010284616161786179626161")


@pytest.mark.parametrize(
    "value",
    [
        "",
        "a",
        "abcde",
        b"\x01\x02\x03\x04",
        ["a", "bb", "a", "bb"],
        ["a", "bb", "ccc", "dddd", "a", "bb"],
        {"a": "m", "bb": "nn", "e": "m", "ff": "nn"},
        {"a": "m", "bb": "nn", "ccc": "ooo", "dddd": "pppp", "e": "m", "ff": "nn"},
    ],
    ids=[
        "empty string",
        "short string",
        "long string",
        "bytestring",
        "array of short strings",
        "no repeated long strings",
        "dict with short keys and strings",
        "dict with no repeated long strings",
    ],
)
def test_encode_stringrefs_unchanged(impl, value):
    expected = impl.dumps(value)
    if isinstance(value, list) or isinstance(value, dict):
        expected = b"\xd9\x01\x00" + expected
    assert impl.dumps(value, string_referencing=True) == expected


def test_encode_stringrefs_array(impl):
    value = ["aaaa", "aaaa", "bbbb", "aaaa", "bbbb"]
    equivalent = [
        "aaaa",
        impl.CBORTag(25, 0),
        "bbbb",
        impl.CBORTag(25, 0),
        impl.CBORTag(25, 1),
    ]
    assert impl.dumps(value, string_referencing=True) == b"\xd9\x01\x00" + impl.dumps(equivalent)


def test_encode_stringrefs_dict(impl):
    value = {"aaaa": "mmmm", "bbbb": "bbbb", "cccc": "aaaa", "mmmm": "aaaa"}
    expected = unhexlify(
        "d90100"
        "a4"
        "6461616161"
        "646d6d6d6d"
        "6462626262"
        "d81902"
        "6463636363"
        "d81900"
        "d81901"
        "d81900"
    )
    assert impl.dumps(value, string_referencing=True, canonical=True) == expected


@pytest.mark.parametrize("tag", [-1, 2**64, "f"], ids=["too small", "too large", "wrong type"])
def test_invalid_tag(impl, tag):
    with pytest.raises(TypeError):
        impl.dumps(impl.CBORTag(tag, "value"))


def test_largest_tag(impl):
    expected = unhexlify("dbffffffffffffffff6176")
    assert impl.dumps(impl.CBORTag(2**64 - 1, "v")) == expected


@given(compound_types_strategy)
def test_invariant_encode_decode(impl, val):
    """
    Tests that an encode and decode is invariant (the value is the same after
    undergoing an encode and decode)
    """
    assert impl.loads(impl.dumps(val)) == val
