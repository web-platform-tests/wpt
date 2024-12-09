import os
import platform
import sys

from setuptools import Extension, setup

min_glibc = (2, 9)


def check_libc():
    """Return False if we have glibc < 2.9 and should not build the C extension."""

    # Borrowed from pip internals
    # https://github.com/pypa/pip/blob/20.1.1/src/pip/_internal/utils/glibc.py#L21-L36
    try:
        # os.confstr("CS_GNU_LIBC_VERSION") returns a string like "glibc 2.17":
        libc_name, libc_version = os.confstr("CS_GNU_LIBC_VERSION").split()
    except (AttributeError, OSError, ValueError):
        # os.confstr() or CS_GNU_LIBC_VERSION not available (or a bad value)...
        return True

    if libc_name != "glibc":
        # Attempt to build with musl or other libc
        return True

    libc_version_tuple = tuple(int(x) for x in libc_version.split(".")[:2])
    return libc_version_tuple >= min_glibc


cpython = platform.python_implementation() == "CPython"
windows = sys.platform.startswith("win")
use_c_ext = os.environ.get("CBOR2_BUILD_C_EXTENSION", None)
optional = True
if use_c_ext == "1":
    build_c_ext = True
    optional = False
elif use_c_ext == "0":
    build_c_ext = False
else:
    build_c_ext = cpython and (windows or check_libc())

# Enable GNU features for libc's like musl, should have no effect
# on Apple/BSDs
if build_c_ext and not windows:
    gnu_flag = ["-D_GNU_SOURCE"]
else:
    gnu_flag = []

if build_c_ext:
    _cbor2 = Extension(
        "_cbor2",
        # math.h routines are built-in to MSVCRT
        libraries=["m"] if not windows else [],
        extra_compile_args=["-std=c99"] + gnu_flag,
        sources=[
            "source/module.c",
            "source/encoder.c",
            "source/decoder.c",
            "source/tags.c",
            "source/halffloat.c",
        ],
        optional=optional,
    )
    kwargs = {"ext_modules": [_cbor2]}
else:
    kwargs = {}


setup(
    use_scm_version={"version_scheme": "guess-next-dev", "local_scheme": "dirty-tag"},
    setup_requires=["setuptools >= 61", "setuptools_scm >= 6.4"],
    **kwargs,
)
