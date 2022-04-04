import collections
import logging
from typing import Generator, List, Optional, Sequence

from .connection import CLIENT, CONNECTING, OPEN, Connection
from .datastructures import Headers, HeadersLike, MultipleValuesError
from .exceptions import (
    InvalidHandshake,
    InvalidHeader,
    InvalidHeaderValue,
    InvalidStatusCode,
    InvalidUpgrade,
    NegotiationError,
)
from .extensions.base import ClientExtensionFactory, Extension
from .headers import (
    build_authorization_basic,
    build_extension,
    build_subprotocol,
    parse_connection,
    parse_extension,
    parse_subprotocol,
    parse_upgrade,
)
from .http import USER_AGENT, build_host
from .http11 import Request, Response
from .typing import (
    ConnectionOption,
    ExtensionHeader,
    Origin,
    Subprotocol,
    UpgradeProtocol,
)
from .uri import parse_uri
from .utils import accept_key, generate_key


# See #940 for why lazy_import isn't used here for backwards compatibility.
from .legacy.client import *  # isort:skip  # noqa


__all__ = ["ClientConnection"]

logger = logging.getLogger(__name__)


class ClientConnection(Connection):
    def __init__(
        self,
        uri: str,
        origin: Optional[Origin] = None,
        extensions: Optional[Sequence[ClientExtensionFactory]] = None,
        subprotocols: Optional[Sequence[Subprotocol]] = None,
        extra_headers: Optional[HeadersLike] = None,
        max_size: Optional[int] = 2 ** 20,
    ):
        super().__init__(side=CLIENT, state=CONNECTING, max_size=max_size)
        self.wsuri = parse_uri(uri)
        self.origin = origin
        self.available_extensions = extensions
        self.available_subprotocols = subprotocols
        self.extra_headers = extra_headers
        self.key = generate_key()

    def connect(self) -> Request:  # noqa: F811
        """
        Create a WebSocket handshake request event to send to the server.

        """
        headers = Headers()

        headers["Host"] = build_host(
            self.wsuri.host, self.wsuri.port, self.wsuri.secure
        )

        if self.wsuri.user_info:
            headers["Authorization"] = build_authorization_basic(*self.wsuri.user_info)

        if self.origin is not None:
            headers["Origin"] = self.origin

        headers["Upgrade"] = "websocket"
        headers["Connection"] = "Upgrade"
        headers["Sec-WebSocket-Key"] = self.key
        headers["Sec-WebSocket-Version"] = "13"

        if self.available_extensions is not None:
            extensions_header = build_extension(
                [
                    (extension_factory.name, extension_factory.get_request_params())
                    for extension_factory in self.available_extensions
                ]
            )
            headers["Sec-WebSocket-Extensions"] = extensions_header

        if self.available_subprotocols is not None:
            protocol_header = build_subprotocol(self.available_subprotocols)
            headers["Sec-WebSocket-Protocol"] = protocol_header

        if self.extra_headers is not None:
            extra_headers = self.extra_headers
            if isinstance(extra_headers, Headers):
                extra_headers = extra_headers.raw_items()
            elif isinstance(extra_headers, collections.abc.Mapping):
                extra_headers = extra_headers.items()
            for name, value in extra_headers:
                headers[name] = value

        headers.setdefault("User-Agent", USER_AGENT)

        return Request(self.wsuri.resource_name, headers)

    def process_response(self, response: Response) -> None:
        """
        Check a handshake response received from the server.

        :param response: response
        :param key: comes from :func:`build_request`
        :raises ~websockets.exceptions.InvalidHandshake: if the handshake response
            is invalid

        """

        if response.status_code != 101:
            raise InvalidStatusCode(response.status_code)

        headers = response.headers

        connection: List[ConnectionOption] = sum(
            [parse_connection(value) for value in headers.get_all("Connection")], []
        )

        if not any(value.lower() == "upgrade" for value in connection):
            raise InvalidUpgrade(
                "Connection", ", ".join(connection) if connection else None
            )

        upgrade: List[UpgradeProtocol] = sum(
            [parse_upgrade(value) for value in headers.get_all("Upgrade")], []
        )

        # For compatibility with non-strict implementations, ignore case when
        # checking the Upgrade header. It's supposed to be 'WebSocket'.
        if not (len(upgrade) == 1 and upgrade[0].lower() == "websocket"):
            raise InvalidUpgrade("Upgrade", ", ".join(upgrade) if upgrade else None)

        try:
            s_w_accept = headers["Sec-WebSocket-Accept"]
        except KeyError as exc:
            raise InvalidHeader("Sec-WebSocket-Accept") from exc
        except MultipleValuesError as exc:
            raise InvalidHeader(
                "Sec-WebSocket-Accept",
                "more than one Sec-WebSocket-Accept header found",
            ) from exc

        if s_w_accept != accept_key(self.key):
            raise InvalidHeaderValue("Sec-WebSocket-Accept", s_w_accept)

        self.extensions = self.process_extensions(headers)

        self.subprotocol = self.process_subprotocol(headers)

    def process_extensions(self, headers: Headers) -> List[Extension]:
        """
        Handle the Sec-WebSocket-Extensions HTTP response header.

        Check that each extension is supported, as well as its parameters.

        Return the list of accepted extensions.

        Raise :exc:`~websockets.exceptions.InvalidHandshake` to abort the
        connection.

        :rfc:`6455` leaves the rules up to the specification of each
        extension.

        To provide this level of flexibility, for each extension accepted by
        the server, we check for a match with each extension available in the
        client configuration. If no match is found, an exception is raised.

        If several variants of the same extension are accepted by the server,
        it may be configured severel times, which won't make sense in general.
        Extensions must implement their own requirements. For this purpose,
        the list of previously accepted extensions is provided.

        Other requirements, for example related to mandatory extensions or the
        order of extensions, may be implemented by overriding this method.

        """
        accepted_extensions: List[Extension] = []

        extensions = headers.get_all("Sec-WebSocket-Extensions")

        if extensions:

            if self.available_extensions is None:
                raise InvalidHandshake("no extensions supported")

            parsed_extensions: List[ExtensionHeader] = sum(
                [parse_extension(header_value) for header_value in extensions], []
            )

            for name, response_params in parsed_extensions:

                for extension_factory in self.available_extensions:

                    # Skip non-matching extensions based on their name.
                    if extension_factory.name != name:
                        continue

                    # Skip non-matching extensions based on their params.
                    try:
                        extension = extension_factory.process_response_params(
                            response_params, accepted_extensions
                        )
                    except NegotiationError:
                        continue

                    # Add matching extension to the final list.
                    accepted_extensions.append(extension)

                    # Break out of the loop once we have a match.
                    break

                # If we didn't break from the loop, no extension in our list
                # matched what the server sent. Fail the connection.
                else:
                    raise NegotiationError(
                        f"Unsupported extension: "
                        f"name = {name}, params = {response_params}"
                    )

        return accepted_extensions

    def process_subprotocol(self, headers: Headers) -> Optional[Subprotocol]:
        """
        Handle the Sec-WebSocket-Protocol HTTP response header.

        Check that it contains exactly one supported subprotocol.

        Return the selected subprotocol.

        """
        subprotocol: Optional[Subprotocol] = None

        subprotocols = headers.get_all("Sec-WebSocket-Protocol")

        if subprotocols:

            if self.available_subprotocols is None:
                raise InvalidHandshake("no subprotocols supported")

            parsed_subprotocols: Sequence[Subprotocol] = sum(
                [parse_subprotocol(header_value) for header_value in subprotocols], []
            )

            if len(parsed_subprotocols) > 1:
                subprotocols_display = ", ".join(parsed_subprotocols)
                raise InvalidHandshake(f"multiple subprotocols: {subprotocols_display}")

            subprotocol = parsed_subprotocols[0]

            if subprotocol not in self.available_subprotocols:
                raise NegotiationError(f"unsupported subprotocol: {subprotocol}")

        return subprotocol

    def send_request(self, request: Request) -> None:
        """
        Send a WebSocket handshake request to the server.

        """
        logger.debug("%s > GET %s HTTP/1.1", self.side, request.path)
        logger.debug("%s > %r", self.side, request.headers)

        self.writes.append(request.serialize())

    def parse(self) -> Generator[None, None, None]:
        response = yield from Response.parse(
            self.reader.read_line, self.reader.read_exact, self.reader.read_to_eof
        )
        assert self.state == CONNECTING
        try:
            self.process_response(response)
        except InvalidHandshake as exc:
            response = response._replace(exception=exc)
            logger.debug("Invalid handshake", exc_info=True)
        else:
            self.set_state(OPEN)
        finally:
            self.events.append(response)
        yield from super().parse()
