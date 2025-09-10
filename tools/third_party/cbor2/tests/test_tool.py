import binascii
import json
from io import BytesIO, TextIOWrapper

import pytest

import cbor2.tool


@pytest.mark.parametrize(
    "value, expected",
    [
        ((1, 2, 3), [1, 2, 3]),
        ({b"\x01\x02\x03": "b"}, {"\x01\x02\x03": "b"}),
        ({"dict": {"b": 17}}, {"dict": {"b": 17}}),
    ],
    ids=["tuple", "byte_key", "recursion"],
)
def test_key_to_str(value, expected):
    assert cbor2.tool.key_to_str(value) == expected


def test_default():
    with pytest.raises(TypeError):
        json.dumps(BytesIO(b""), cls=cbor2.tool.DefaultEncoder)


@pytest.mark.parametrize(
    "payload",
    ["D81CA16162D81CA16161D81D00", "d81c81d81c830102d81d00"],
    ids=["dict", "list"],
)
def test_self_referencing(payload):
    decoded = cbor2.loads(binascii.unhexlify(payload))
    with pytest.raises(ValueError, match="Cannot convert self-referential data to JSON"):
        cbor2.tool.key_to_str(decoded)


def test_nonrecursive_ref():
    payload = "d81c83d81ca26162d81ca16161016163d81d02d81d01d81d01"
    decoded = cbor2.loads(binascii.unhexlify(payload))
    result = cbor2.tool.key_to_str(decoded)
    expected = [
        {"b": {"a": 1}, "c": {"a": 1}},
        {"b": {"a": 1}, "c": {"a": 1}},
        {"b": {"a": 1}, "c": {"a": 1}},
    ]
    assert result == expected


def test_stdin(monkeypatch, tmpdir):
    f = tmpdir.join("outfile")
    argv = ["-o", str(f)]
    inbuf = TextIOWrapper(BytesIO(binascii.unhexlify("02")))
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        m.setattr("sys.stdin", inbuf)
        cbor2.tool.main()
        assert f.read() == "2\n"


def test_stdout(monkeypatch, tmpdir):
    argv = ["-o", "-"]
    inbuf = TextIOWrapper(BytesIO(binascii.unhexlify("02")))
    outbuf = BytesIO()
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        m.setattr("sys.stdin", inbuf)
        m.setattr("sys.stdout", outbuf)
        cbor2.tool.main()


def test_readfrom(monkeypatch, tmpdir):
    f = tmpdir.join("infile")
    outfile = tmpdir.join("outfile")
    f.write_binary(binascii.unhexlify("02"))
    argv = ["-o", str(outfile), str(f)]
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        cbor2.tool.main()
        assert outfile.read() == "2\n"


def test_b64(monkeypatch, tmpdir):
    f = tmpdir.join("outfile")
    argv = ["-d", "-o", str(f)]
    inbuf = TextIOWrapper(BytesIO(b"oQID"))
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        m.setattr("sys.stdin", inbuf)
        cbor2.tool.main()
        assert f.read() == '{"2": 3}\n'


def test_stream(monkeypatch, tmpdir):
    f = tmpdir.join("outfile")
    argv = ["--sequence", "-o", str(f)]
    inbuf = TextIOWrapper(BytesIO(binascii.unhexlify("0203")))
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        m.setattr("sys.stdin", inbuf)
        cbor2.tool.main()
        assert f.read() == "2\n3\n"


def test_embed_bytes(monkeypatch, tmpdir):
    f = tmpdir.join("outfile")
    argv = ["-o", str(f)]
    inbuf = TextIOWrapper(BytesIO(binascii.unhexlify("42C2C2")))
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        m.setattr("sys.stdin", inbuf)
        cbor2.tool.main()
        assert f.read() == '"\\\\xc2\\\\xc2"\n'


def test_dtypes_from_file(monkeypatch, tmpdir):
    infile = "tests/examples.cbor.b64"
    expected = open("tests/examples.json").read()
    outfile = tmpdir.join("outfile.json")
    argv = ["--sort-keys", "--pretty", "-d", "-o", str(outfile), infile]
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        cbor2.tool.main()
        assert outfile.read() == expected


def test_ignore_tag(monkeypatch, tmpdir):
    f = tmpdir.join("outfile")
    argv = ["-o", str(f), "-i", "6000"]
    inbuf = TextIOWrapper(BytesIO(binascii.unhexlify("D917706548656C6C6F")))
    expected = '"Hello"\n'
    with monkeypatch.context() as m:
        m.setattr("sys.argv", [""] + argv)
        m.setattr("sys.stdin", inbuf)
        cbor2.tool.main()
        assert f.read() == expected
