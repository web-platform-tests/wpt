import pytest

from .. import jsfnargs


@pytest.mark.parametrize("input, expected",
                         [(b"()", []),
                          (b"('foo')", [b"'foo'"]),
                          (b"( 0 )", [b"0"]),
                          (b"( 0, 1)", [b"0", b"1"]),
                          (b"( 'foo', \"bar\")", [b"'foo'", b"\"bar\""]),
                          (b"( 0, 1,)", [b"0", b"1"]),
                          (b"( 0, `foo\nbar`))", [b"0", b"`foo\nbar`"]),
                          (b"((1), () => {})", [b"(1)", b"() => {}"]),
                          (b"(')', '(')", [b"')'", b"'('"]),
                          (b"('', \"\")", [b"''", b'""']),
                          (b"('a\\'b', \"a\\\"b\")", [b"'a\\'b'", b'"a\\"b"']),
                          (b"({1:2, 3:4}, [5,6], () => {7,8})",
                           [b"{1:2, 3:4}", b"[5,6]", b"() => {7,8}"]),
                          (b"(1,\n//foo\n2)", [b"1", b"2"]),
                          (b"(1/*foo,*/,2,/*bar,*/3/*baz*/)", [b"1", b"2", b"3"]),
                          (b"(1/*foo,\n*/,2,//bar\n,3/*baz*/,)", [b"1", b"2", b"3"])])
def test_valid(input, expected):
    assert jsfnargs.get_args(input) == expected


@pytest.mark.parametrize("input",
                         [b"(", b"(\")", b"(1,'foo)", b"(1,'foo\\')"])
def test_invalid(input):
    with pytest.raises(ValueError):
        assert jsfnargs.get_args(input)
