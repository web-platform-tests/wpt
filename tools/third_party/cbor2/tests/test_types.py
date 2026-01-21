import pytest

from cbor2 import FrozenDict


def test_undefined_bool(impl):
    assert not impl.undefined


def test_undefined_repr(impl):
    assert repr(impl.undefined) == "undefined"


def test_undefined_singleton(impl):
    assert type(impl.undefined)() is impl.undefined


def test_undefined_init(impl):
    with pytest.raises(TypeError):
        type(impl.undefined)("foo")


def test_break_bool(impl):
    assert impl.break_marker


def test_break_repr(impl):
    assert repr(impl.break_marker) == "break_marker"


def test_break_singleton(impl):
    assert type(impl.break_marker)() is impl.break_marker


def test_break_init(impl):
    with pytest.raises(TypeError):
        type(impl.break_marker)("foo")


def test_tag_init(impl):
    with pytest.raises(TypeError):
        impl.CBORTag("foo", "bar")


def test_tag_attr(impl):
    tag = impl.CBORTag(1, "foo")
    assert tag.tag == 1
    assert tag.value == "foo"


def test_tag_compare(impl):
    tag1 = impl.CBORTag(1, "foo")
    tag2 = impl.CBORTag(1, "foo")
    tag3 = impl.CBORTag(2, "bar")
    tag4 = impl.CBORTag(2, "baz")
    assert tag1 is not tag2
    assert tag1 == tag2
    assert not (tag1 == tag3)
    assert tag1 != tag3
    assert tag3 >= tag2
    assert tag3 > tag2
    assert tag2 < tag3
    assert tag2 <= tag3
    assert tag4 >= tag3
    assert tag4 > tag3
    assert tag3 < tag4
    assert tag3 <= tag4


def test_tag_compare_unimplemented(impl):
    tag = impl.CBORTag(1, "foo")
    assert not tag == (1, "foo")
    with pytest.raises(TypeError):
        tag <= (1, "foo")


def test_tag_recursive_repr(impl):
    tag = impl.CBORTag(1, None)
    tag.value = tag
    assert repr(tag) == "CBORTag(1, ...)"
    assert tag is tag.value
    assert tag == tag.value
    assert not (tag != tag.value)


def test_tag_recursive_hash(impl):
    tag = impl.CBORTag(1, None)
    tag.value = tag
    with pytest.raises(RuntimeError, match="This CBORTag is not hashable"):
        hash(tag)


def test_tag_repr(impl):
    assert repr(impl.CBORTag(600, "blah")) == "CBORTag(600, 'blah')"


def test_simple_value_repr(impl):
    assert repr(impl.CBORSimpleValue(1)) == "CBORSimpleValue(value=1)"


def test_simple_value_equals(impl):
    tag1 = impl.CBORSimpleValue(1)
    tag2 = impl.CBORSimpleValue(1)
    tag3 = impl.CBORSimpleValue(21)
    tag4 = impl.CBORSimpleValue(99)
    assert tag1 == tag2
    assert tag1 == 1
    assert not tag2 == "21"
    assert tag1 != tag3
    assert tag1 != 21
    assert tag2 != "21"
    assert tag4 > tag1
    assert tag4 >= tag3
    assert 99 <= tag4
    assert 100 > tag4
    assert tag4 <= 100
    assert 2 < tag4
    assert tag4 >= 99
    assert tag1 <= tag4


def test_simple_ordering(impl):
    randints = [9, 7, 3, 8, 4, 0, 2, 5, 6, 1]
    expected = [impl.CBORSimpleValue(v) for v in range(10)]
    disordered = [impl.CBORSimpleValue(v) for v in randints]
    assert expected == sorted(disordered)
    assert expected == sorted(randints)


@pytest.mark.parametrize("value", [-1, 24, 31, 256])
def test_simple_value_out_of_range(impl, value):
    with pytest.raises(TypeError) as exc:
        impl.CBORSimpleValue(value)

    assert str(exc.value) == "simple value out of range (0..23, 32..255)"


def test_frozendict():
    assert len(FrozenDict({1: 2, 3: 4})) == 2
    assert repr(FrozenDict({1: 2})) == "FrozenDict({1: 2})"
