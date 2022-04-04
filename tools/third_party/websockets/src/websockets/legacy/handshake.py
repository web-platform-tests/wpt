"""
:mod:`websockets.legacy.handshake` provides helpers for the WebSocket handshake.

See `section 4 of RFC 6455`_.

.. _section 4 of RFC 6455: http://tools.ietf.org/html/rfc6455#section-4

Some checks cannot be performed because they depend too much on the
context; instead, they're documented below.

To accept a connection, a server must:

- Read the request, check that the method is GET, and check the headers with
  :func:`check_request`,
- Send a 101 response to the client with the headers created by
  :func:`build_response` if the request is valid; otherwise, send an
  appropriate HTTP error code.

To open a connection, a client must:

- Send a GET request to the server with the headers created by
  :func:`build_request`,
- Read the response, check that the status code is 101, and check the headers
  with :func:`check_response`.

"""

import base64
import binascii
from typing import List

from ..datastructures import Headers, MultipleValuesError
from ..exceptions import InvalidHeader, InvalidHeaderValue, InvalidUpgrade
from ..headers import parse_connection, parse_upgrade
from ..typing import ConnectionOption, UpgradeProtocol
from ..utils import accept_key as accept, generate_key


__all__ = ["build_request", "check_request", "build_response", "check_response"]


def build_request(headers: Headers) -> str:
    """
    Build a handshake request to send to the server.

    Update request headers passed in argument.

    :param headers: request headers
    :returns: ``key`` which must be passed to :func:`check_response`

    """
    key = generate_key()
    headers["Upgrade"] = "websocket"
    headers["Connection"] = "Upgrade"
    headers["Sec-WebSocket-Key"] = key
    headers["Sec-WebSocket-Version"] = "13"
    return key


def check_request(headers: Headers) -> str:
    """
    Check a handshake request received from the client.

    This function doesn't verify that the request is an HTTP/1.1 or higher GET
    request and doesn't perform ``Host`` and ``Origin`` checks. These controls
    are usually performed earlier in the HTTP request handling code. They're
    the responsibility of the caller.

    :param headers: request headers
    :returns: ``key`` which must be passed to :func:`build_response`
    :raises ~websockets.exceptions.InvalidHandshake: if the handshake request
        is invalid; then the server must return 400 Bad Request error

    """
    connection: List[ConnectionOption] = sum(
        [parse_connection(value) for value in headers.get_all("Connection")], []
    )

    if not any(value.lower() == "upgrade" for value in connection):
        raise InvalidUpgrade("Connection", ", ".join(connection))

    upgrade: List[UpgradeProtocol] = sum(
        [parse_upgrade(value) for value in headers.get_all("Upgrade")], []
    )

    # For compatibility with non-strict implementations, ignore case when
    # checking the Upgrade header. The RFC always uses "websocket", except
    # in section 11.2. (IANA registration) where it uses "WebSocket".
    if not (len(upgrade) == 1 and upgrade[0].lower() == "websocket"):
        raise InvalidUpgrade("Upgrade", ", ".join(upgrade))

    try:
        s_w_key = headers["Sec-WebSocket-Key"]
    except KeyError as exc:
        raise InvalidHeader("Sec-WebSocket-Key") from exc
    except MultipleValuesError as exc:
        raise InvalidHeader(
            "Sec-WebSocket-Key", "more than one Sec-WebSocket-Key header found"
        ) from exc

    try:
        raw_key = base64.b64decode(s_w_key.encode(), validate=True)
    except binascii.Error as exc:
        raise InvalidHeaderValue("Sec-WebSocket-Key", s_w_key) from exc
    if len(raw_key) != 16:
        raise InvalidHeaderValue("Sec-WebSocket-Key", s_w_key)

    try:
        s_w_version = headers["Sec-WebSocket-Version"]
    except KeyError as exc:
        raise InvalidHeader("Sec-WebSocket-Version") from exc
    except MultipleValuesError as exc:
        raise InvalidHeader(
            "Sec-WebSocket-Version", "more than one Sec-WebSocket-Version header found"
        ) from exc

    if s_w_version != "13":
        raise InvalidHeaderValue("Sec-WebSocket-Version", s_w_version)

    return s_w_key


def build_response(headers: Headers, key: str) -> None:
    """
    Build a handshake response to send to the client.

    Update response headers passed in argument.

    :param headers: response headers
    :param key: comes from :func:`check_request`

    """
    headers["Upgrade"] = "websocket"
    headers["Connection"] = "Upgrade"
    headers["Sec-WebSocket-Accept"] = accept(key)


def check_response(headers: Headers, key: str) -> None:
    """
    Check a handshake response received from the server.

    This function doesn't verify that the response is an HTTP/1.1 or higher
    response with a 101 status code. These controls are the responsibility of
    the caller.

    :param headers: response headers
    :param key: comes from :func:`build_request`
    :raises ~websockets.exceptions.InvalidHandshake: if the handshake response
        is invalid

    """
    connection: List[ConnectionOption] = sum(
        [parse_connection(value) for value in headers.get_all("Connection")], []
    )

    if not any(value.lower() == "upgrade" for value in connection):
        raise InvalidUpgrade("Connection", " ".join(connection))

    upgrade: List[UpgradeProtocol] = sum(
        [parse_upgrade(value) for value in headers.get_all("Upgrade")], []
    )

    # For compatibility with non-strict implementations, ignore case when
    # checking the Upgrade header. The RFC always uses "websocket", except
    # in section 11.2. (IANA registration) where it uses "WebSocket".
    if not (len(upgrade) == 1 and upgrade[0].lower() == "websocket"):
        raise InvalidUpgrade("Upgrade", ", ".join(upgrade))

    try:
        s_w_accept = headers["Sec-WebSocket-Accept"]
    except KeyError as exc:
        raise InvalidHeader("Sec-WebSocket-Accept") from exc
    except MultipleValuesError as exc:
        raise InvalidHeader(
            "Sec-WebSocket-Accept", "more than one Sec-WebSocket-Accept header found"
        ) from exc

    if s_w_accept != accept(key):
        raise InvalidHeaderValue("Sec-WebSocket-Accept", s_w_accept)
