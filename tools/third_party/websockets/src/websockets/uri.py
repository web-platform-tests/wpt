"""
:mod:`websockets.uri` parses WebSocket URIs.

See `section 3 of RFC 6455`_.

.. _section 3 of RFC 6455: http://tools.ietf.org/html/rfc6455#section-3

"""

import urllib.parse
from typing import NamedTuple, Optional, Tuple

from .exceptions import InvalidURI


__all__ = ["parse_uri", "WebSocketURI"]


# Consider converting to a dataclass when dropping support for Python < 3.7.


class WebSocketURI(NamedTuple):
    """
    WebSocket URI.

    :param bool secure: secure flag
    :param str host: lower-case host
    :param int port: port, always set even if it's the default
    :param str resource_name: path and optional query
    :param str user_info: ``(username, password)`` tuple when the URI contains
      `User Information`_, else ``None``.

    .. _User Information: https://tools.ietf.org/html/rfc3986#section-3.2.1
    """

    secure: bool
    host: str
    port: int
    resource_name: str
    user_info: Optional[Tuple[str, str]]


# Work around https://bugs.python.org/issue19931

WebSocketURI.secure.__doc__ = ""
WebSocketURI.host.__doc__ = ""
WebSocketURI.port.__doc__ = ""
WebSocketURI.resource_name.__doc__ = ""
WebSocketURI.user_info.__doc__ = ""


# All characters from the gen-delims and sub-delims sets in RFC 3987.
DELIMS = ":/?#[]@!$&'()*+,;="


def parse_uri(uri: str) -> WebSocketURI:
    """
    Parse and validate a WebSocket URI.

    :raises ValueError: if ``uri`` isn't a valid WebSocket URI.

    """
    parsed = urllib.parse.urlparse(uri)
    try:
        assert parsed.scheme in ["ws", "wss"]
        assert parsed.params == ""
        assert parsed.fragment == ""
        assert parsed.hostname is not None
    except AssertionError as exc:
        raise InvalidURI(uri) from exc

    secure = parsed.scheme == "wss"
    host = parsed.hostname
    port = parsed.port or (443 if secure else 80)
    resource_name = parsed.path or "/"
    if parsed.query:
        resource_name += "?" + parsed.query
    user_info = None
    if parsed.username is not None:
        # urllib.parse.urlparse accepts URLs with a username but without a
        # password. This doesn't make sense for HTTP Basic Auth credentials.
        if parsed.password is None:
            raise InvalidURI(uri)
        user_info = (parsed.username, parsed.password)

    try:
        uri.encode("ascii")
    except UnicodeEncodeError:
        # Input contains non-ASCII characters.
        # It must be an IRI. Convert it to a URI.
        host = host.encode("idna").decode()
        resource_name = urllib.parse.quote(resource_name, safe=DELIMS)
        if user_info is not None:
            user_info = (
                urllib.parse.quote(user_info[0], safe=DELIMS),
                urllib.parse.quote(user_info[1], safe=DELIMS),
            )

    return WebSocketURI(secure, host, port, resource_name, user_info)
