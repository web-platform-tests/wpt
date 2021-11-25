import base64
import binascii
import collections
import email.utils
import http
import logging
from typing import Callable, Generator, List, Optional, Sequence, Tuple, Union, cast

from .connection import CONNECTING, OPEN, SERVER, Connection
from .datastructures import Headers, HeadersLike, MultipleValuesError
from .exceptions import (
    InvalidHandshake,
    InvalidHeader,
    InvalidHeaderValue,
    InvalidOrigin,
    InvalidUpgrade,
    NegotiationError,
)
from .extensions.base import Extension, ServerExtensionFactory
from .headers import (
    build_extension,
    parse_connection,
    parse_extension,
    parse_subprotocol,
    parse_upgrade,
)
from .http import USER_AGENT
from .http11 import Request, Response
from .typing import (
    ConnectionOption,
    ExtensionHeader,
    Origin,
    Subprotocol,
    UpgradeProtocol,
)
from .utils import accept_key


# See #940 for why lazy_import isn't used here for backwards compatibility.
from .legacy.server import *  # isort:skip  # noqa


__all__ = ["ServerConnection"]

logger = logging.getLogger(__name__)


HeadersLikeOrCallable = Union[HeadersLike, Callable[[str, Headers], HeadersLike]]


class ServerConnection(Connection):

    side = SERVER

    def __init__(
        self,
        origins: Optional[Sequence[Optional[Origin]]] = None,
        extensions: Optional[Sequence[ServerExtensionFactory]] = None,
        subprotocols: Optional[Sequence[Subprotocol]] = None,
        extra_headers: Optional[HeadersLikeOrCallable] = None,
        max_size: Optional[int] = 2 ** 20,
    ):
        super().__init__(side=SERVER, state=CONNECTING, max_size=max_size)
        self.origins = origins
        self.available_extensions = extensions
        self.available_subprotocols = subprotocols
        self.extra_headers = extra_headers

    def accept(self, request: Request) -> Response:
        """
        Create a WebSocket handshake response event to send to the client.

        If the connection cannot be established, the response rejects the
        connection, which may be unexpected.

        """
        # TODO: when changing Request to a dataclass, set the exception
        # attribute on the request rather than the Response, which will
        # be semantically more correct.
        try:
            key, extensions_header, protocol_header = self.process_request(request)
        except InvalidOrigin as exc:
            logger.debug("Invalid origin", exc_info=True)
            return self.reject(
                http.HTTPStatus.FORBIDDEN,
                f"Failed to open a WebSocket connection: {exc}.\n",
            )._replace(exception=exc)
        except InvalidUpgrade as exc:
            logger.debug("Invalid upgrade", exc_info=True)
            return self.reject(
                http.HTTPStatus.UPGRADE_REQUIRED,
                (
                    f"Failed to open a WebSocket connection: {exc}.\n"
                    f"\n"
                    f"You cannot access a WebSocket server directly "
                    f"with a browser. You need a WebSocket client.\n"
                ),
                headers=Headers([("Upgrade", "websocket")]),
            )._replace(exception=exc)
        except InvalidHandshake as exc:
            logger.debug("Invalid handshake", exc_info=True)
            return self.reject(
                http.HTTPStatus.BAD_REQUEST,
                f"Failed to open a WebSocket connection: {exc}.\n",
            )._replace(exception=exc)
        except Exception as exc:
            logger.warning("Error in opening handshake", exc_info=True)
            return self.reject(
                http.HTTPStatus.INTERNAL_SERVER_ERROR,
                (
                    "Failed to open a WebSocket connection.\n"
                    "See server log for more information.\n"
                ),
            )._replace(exception=exc)

        headers = Headers()

        headers["Upgrade"] = "websocket"
        headers["Connection"] = "Upgrade"
        headers["Sec-WebSocket-Accept"] = accept_key(key)

        if extensions_header is not None:
            headers["Sec-WebSocket-Extensions"] = extensions_header

        if protocol_header is not None:
            headers["Sec-WebSocket-Protocol"] = protocol_header

        extra_headers: Optional[HeadersLike]
        if callable(self.extra_headers):
            extra_headers = self.extra_headers(request.path, request.headers)
        else:
            extra_headers = self.extra_headers
        if extra_headers is not None:
            if isinstance(extra_headers, Headers):
                extra_headers = extra_headers.raw_items()
            elif isinstance(extra_headers, collections.abc.Mapping):
                extra_headers = extra_headers.items()
            for name, value in extra_headers:
                headers[name] = value

        headers.setdefault("Date", email.utils.formatdate(usegmt=True))
        headers.setdefault("Server", USER_AGENT)

        return Response(101, "Switching Protocols", headers)

    def process_request(
        self, request: Request
    ) -> Tuple[str, Optional[str], Optional[str]]:
        """
        Check a handshake request received from the client.

        This function doesn't verify that the request is an HTTP/1.1 or higher GET
        request and doesn't perform ``Host`` and ``Origin`` checks. These controls
        are usually performed earlier in the HTTP request handling code. They're
        the responsibility of the caller.

        :param request: request
        :returns: ``key`` which must be passed to :func:`build_response`
        :raises ~websockets.exceptions.InvalidHandshake: if the handshake request
            is invalid; then the server must return 400 Bad Request error

        """
        headers = request.headers

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
        # checking the Upgrade header. The RFC always uses "websocket", except
        # in section 11.2. (IANA registration) where it uses "WebSocket".
        if not (len(upgrade) == 1 and upgrade[0].lower() == "websocket"):
            raise InvalidUpgrade("Upgrade", ", ".join(upgrade) if upgrade else None)

        try:
            key = headers["Sec-WebSocket-Key"]
        except KeyError as exc:
            raise InvalidHeader("Sec-WebSocket-Key") from exc
        except MultipleValuesError as exc:
            raise InvalidHeader(
                "Sec-WebSocket-Key", "more than one Sec-WebSocket-Key header found"
            ) from exc

        try:
            raw_key = base64.b64decode(key.encode(), validate=True)
        except binascii.Error as exc:
            raise InvalidHeaderValue("Sec-WebSocket-Key", key) from exc
        if len(raw_key) != 16:
            raise InvalidHeaderValue("Sec-WebSocket-Key", key)

        try:
            version = headers["Sec-WebSocket-Version"]
        except KeyError as exc:
            raise InvalidHeader("Sec-WebSocket-Version") from exc
        except MultipleValuesError as exc:
            raise InvalidHeader(
                "Sec-WebSocket-Version",
                "more than one Sec-WebSocket-Version header found",
            ) from exc

        if version != "13":
            raise InvalidHeaderValue("Sec-WebSocket-Version", version)

        self.origin = self.process_origin(headers)

        extensions_header, self.extensions = self.process_extensions(headers)

        protocol_header = self.subprotocol = self.process_subprotocol(headers)

        return key, extensions_header, protocol_header

    def process_origin(self, headers: Headers) -> Optional[Origin]:
        """
        Handle the Origin HTTP request header.

        :param headers: request headers
        :raises ~websockets.exceptions.InvalidOrigin: if the origin isn't
            acceptable

        """
        # "The user agent MUST NOT include more than one Origin header field"
        # per https://tools.ietf.org/html/rfc6454#section-7.3.
        try:
            origin = cast(Optional[Origin], headers.get("Origin"))
        except MultipleValuesError as exc:
            raise InvalidHeader("Origin", "more than one Origin header found") from exc
        if self.origins is not None:
            if origin not in self.origins:
                raise InvalidOrigin(origin)
        return origin

    def process_extensions(
        self,
        headers: Headers,
    ) -> Tuple[Optional[str], List[Extension]]:
        """
        Handle the Sec-WebSocket-Extensions HTTP request header.

        Accept or reject each extension proposed in the client request.
        Negotiate parameters for accepted extensions.

        Return the Sec-WebSocket-Extensions HTTP response header and the list
        of accepted extensions.

        :rfc:`6455` leaves the rules up to the specification of each
        :extension.

        To provide this level of flexibility, for each extension proposed by
        the client, we check for a match with each extension available in the
        server configuration. If no match is found, the extension is ignored.

        If several variants of the same extension are proposed by the client,
        it may be accepted several times, which won't make sense in general.
        Extensions must implement their own requirements. For this purpose,
        the list of previously accepted extensions is provided.

        This process doesn't allow the server to reorder extensions. It can
        only select a subset of the extensions proposed by the client.

        Other requirements, for example related to mandatory extensions or the
        order of extensions, may be implemented by overriding this method.

        :param headers: request headers
        :raises ~websockets.exceptions.InvalidHandshake: to abort the
            handshake with an HTTP 400 error code

        """
        response_header_value: Optional[str] = None

        extension_headers: List[ExtensionHeader] = []
        accepted_extensions: List[Extension] = []

        header_values = headers.get_all("Sec-WebSocket-Extensions")

        if header_values and self.available_extensions:

            parsed_header_values: List[ExtensionHeader] = sum(
                [parse_extension(header_value) for header_value in header_values], []
            )

            for name, request_params in parsed_header_values:

                for ext_factory in self.available_extensions:

                    # Skip non-matching extensions based on their name.
                    if ext_factory.name != name:
                        continue

                    # Skip non-matching extensions based on their params.
                    try:
                        response_params, extension = ext_factory.process_request_params(
                            request_params, accepted_extensions
                        )
                    except NegotiationError:
                        continue

                    # Add matching extension to the final list.
                    extension_headers.append((name, response_params))
                    accepted_extensions.append(extension)

                    # Break out of the loop once we have a match.
                    break

                # If we didn't break from the loop, no extension in our list
                # matched what the client sent. The extension is declined.

        # Serialize extension header.
        if extension_headers:
            response_header_value = build_extension(extension_headers)

        return response_header_value, accepted_extensions

    def process_subprotocol(self, headers: Headers) -> Optional[Subprotocol]:
        """
        Handle the Sec-WebSocket-Protocol HTTP request header.

        Return Sec-WebSocket-Protocol HTTP response header, which is the same
        as the selected subprotocol.

        :param headers: request headers
        :raises ~websockets.exceptions.InvalidHandshake: to abort the
            handshake with an HTTP 400 error code

        """
        subprotocol: Optional[Subprotocol] = None

        header_values = headers.get_all("Sec-WebSocket-Protocol")

        if header_values and self.available_subprotocols:

            parsed_header_values: List[Subprotocol] = sum(
                [parse_subprotocol(header_value) for header_value in header_values], []
            )

            subprotocol = self.select_subprotocol(
                parsed_header_values, self.available_subprotocols
            )

        return subprotocol

    def select_subprotocol(
        self,
        client_subprotocols: Sequence[Subprotocol],
        server_subprotocols: Sequence[Subprotocol],
    ) -> Optional[Subprotocol]:
        """
        Pick a subprotocol among those offered by the client.

        If several subprotocols are supported by the client and the server,
        the default implementation selects the preferred subprotocols by
        giving equal value to the priorities of the client and the server.

        If no common subprotocol is supported by the client and the server, it
        proceeds without a subprotocol.

        This is unlikely to be the most useful implementation in practice, as
        many servers providing a subprotocol will require that the client uses
        that subprotocol.

        :param client_subprotocols: list of subprotocols offered by the client
        :param server_subprotocols: list of subprotocols available on the server

        """
        subprotocols = set(client_subprotocols) & set(server_subprotocols)
        if not subprotocols:
            return None
        priority = lambda p: (
            client_subprotocols.index(p) + server_subprotocols.index(p)
        )
        return sorted(subprotocols, key=priority)[0]

    def reject(
        self,
        status: http.HTTPStatus,
        text: str,
        headers: Optional[Headers] = None,
        exception: Optional[Exception] = None,
    ) -> Response:
        """
        Create a HTTP response event to send to the client.

        A short plain text response is the best fallback when failing to
        establish a WebSocket connection.

        """
        body = text.encode()
        if headers is None:
            headers = Headers()
        headers.setdefault("Date", email.utils.formatdate(usegmt=True))
        headers.setdefault("Server", USER_AGENT)
        headers.setdefault("Content-Length", str(len(body)))
        headers.setdefault("Content-Type", "text/plain; charset=utf-8")
        headers.setdefault("Connection", "close")
        return Response(status.value, status.phrase, headers, body)

    def send_response(self, response: Response) -> None:
        """
        Send a WebSocket handshake response to the client.

        """
        if response.status_code == 101:
            self.set_state(OPEN)

        logger.debug(
            "%s > HTTP/1.1 %d %s",
            self.side,
            response.status_code,
            response.reason_phrase,
        )
        logger.debug("%s > %r", self.side, response.headers)
        if response.body is not None:
            logger.debug("%s > body (%d bytes)", self.side, len(response.body))

        self.writes.append(response.serialize())

    def parse(self) -> Generator[None, None, None]:
        request = yield from Request.parse(self.reader.read_line)
        assert self.state == CONNECTING
        self.events.append(request)
        yield from super().parse()
