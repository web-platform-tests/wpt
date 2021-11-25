import ipaddress
import sys

from .imports import lazy_import
from .version import version as websockets_version


# For backwards compatibility:


lazy_import(
    globals(),
    # Headers and MultipleValuesError used to be defined in this module.
    aliases={
        "Headers": ".datastructures",
        "MultipleValuesError": ".datastructures",
    },
    deprecated_aliases={
        "read_request": ".legacy.http",
        "read_response": ".legacy.http",
    },
)


__all__ = ["USER_AGENT", "build_host"]


PYTHON_VERSION = "{}.{}".format(*sys.version_info)
USER_AGENT = f"Python/{PYTHON_VERSION} websockets/{websockets_version}"


def build_host(host: str, port: int, secure: bool) -> str:
    """
    Build a ``Host`` header.

    """
    # https://tools.ietf.org/html/rfc3986#section-3.2.2
    # IPv6 addresses must be enclosed in brackets.
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        # host is a hostname
        pass
    else:
        # host is an IP address
        if address.version == 6:
            host = f"[{host}]"

    if port != (443 if secure else 80):
        host = f"{host}:{port}"

    return host
