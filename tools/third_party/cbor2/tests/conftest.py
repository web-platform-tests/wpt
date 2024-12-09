import platform
import struct

import pytest

import cbor2._decoder
import cbor2._encoder
import cbor2._types

load_exc = ""
try:
    import _cbor2
except ModuleNotFoundError as e:
    if not str(e).startswith("No module"):
        load_exc = str(e)
    _cbor2 = None

cpython = pytest.mark.skipif(
    platform.python_implementation() != "CPython" or _cbor2 is None,
    reason=(load_exc or "requires CPython"),
)


@pytest.fixture
def will_overflow():
    """
    Construct an array/string/bytes length which would cause a memory error
    on decode. This should be less than sys.maxsize (the max integer index)
    """
    bit_size = struct.calcsize("P") * 8
    huge_length = 1 << (bit_size - 8)
    return struct.pack("Q", huge_length)


class Module:
    # Mock module class
    pass


@pytest.fixture(params=[pytest.param("c", marks=cpython), "python"], scope="session")
def impl(request):
    if request.param == "c":
        return _cbor2
    else:
        # Make a mock module of cbor2 which always contains the pure Python
        # implementations, even if the top-level package has imported the
        # _cbor2 module
        module = Module()
        for source in (cbor2._types, cbor2._encoder, cbor2._decoder):
            for name in dir(source):
                setattr(module, name, getattr(source, name))
        return module
