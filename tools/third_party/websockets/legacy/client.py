"""
:mod:`websockets.legacy.client` defines the WebSocket client APIs.

"""

import asyncio
import collections.abc
import functools
import logging
import warnings
from types import TracebackType
from typing import Any, Callable, Generator, List, Optional, Sequence, Tuple, Type, cast

from ..datastructures import Headers, HeadersLike
from ..exceptions import (
    InvalidHandshake,
    InvalidHeader,
    InvalidMessage,
    InvalidStatusCode,
    NegotiationError,
    RedirectHandshake,
    SecurityError,
)
from ..extensions.base import ClientExtensionFactory, Extension
from ..extensions.permessage_deflate import enable_client_permessage_deflate
from ..headers import (
    build_authorization_basic,
    build_extension,
    build_subprotocol,
    parse_extension,
    parse_subprotocol,
)
from ..http import USER_AGENT, build_host
from ..typing import ExtensionHeader, Origin, Subprotocol
from ..uri import WebSocketURI, parse_uri
from .handshake import build_request, check_response
from .http import read_response
from .protocol import WebSocketCommonProtocol


__all__ = ["connect", "unix_connect", "WebSocketClientProtocol"]

logger = logging.getLogger("websockets.server")


class WebSocketClientProtocol(WebSocketCommonProtocol):
    """
    :class:`~asyncio.Protocol` subclass implementing a WebSocket client.

    :class:`WebSocketClientProtocol`:

    * performs the opening handshake to establish the connection;
    * provides :meth:`recv` and :meth:`send` coroutines for receiving and
      sending messages;
    * deals with control frames automatically;
    * performs the closing handshake to terminate the connection.

    :class:`WebSocketClientProtocol` supports asynchronous iteration::

        async for message in websocket:
            await process(message)

    The iterator yields incoming messages. It exits normally when the
    connection is closed with the close code 1000 (OK) or 1001 (going away).
    It raises a :exc:`~websockets.exceptions.ConnectionClosedError` exception
    when the connection is closed with any other code.

    Once the connection is open, a `Ping frame`_ is sent every
    ``ping_interval`` seconds. This serves as a keepalive. It helps keeping
    the connection open, especially in the presence of proxies with short
    timeouts on inactive connections. Set ``ping_interval`` to ``None`` to
    disable this behavior.

    .. _Ping frame: https://tools.ietf.org/html/rfc6455#section-5.5.2

    If the corresponding `Pong frame`_ isn't received within ``ping_timeout``
    seconds, the connection is considered unusable and is closed with
    code 1011. This ensures that the remote endpoint remains responsive. Set
    ``ping_timeout`` to ``None`` to disable this behavior.

    .. _Pong frame: https://tools.ietf.org/html/rfc6455#section-5.5.3

    The ``close_timeout`` parameter defines a maximum wait time for completing
    the closing handshake and terminating the TCP connection. For legacy
    reasons, :meth:`close` completes in at most ``5 * close_timeout`` seconds.

    ``close_timeout`` needs to be a parameter of the protocol because
    websockets usually calls :meth:`close` implicitly upon exit when
    :func:`connect` is used as a context manager.

    To apply a timeout to any other API, wrap it in :func:`~asyncio.wait_for`.

    The ``max_size`` parameter enforces the maximum size for incoming messages
    in bytes. The default value is 1 MiB. ``None`` disables the limit. If a
    message larger than the maximum size is received, :meth:`recv` will
    raise :exc:`~websockets.exceptions.ConnectionClosedError` and the
    connection will be closed with code 1009.

    The ``max_queue`` parameter sets the maximum length of the queue that
    holds incoming messages. The default value is ``32``. ``None`` disables
    the limit. Messages are added to an in-memory queue when they're received;
    then :meth:`recv` pops from that queue. In order to prevent excessive
    memory consumption when messages are received faster than they can be
    processed, the queue must be bounded. If the queue fills up, the protocol
    stops processing incoming data until :meth:`recv` is called. In this
    situation, various receive buffers (at least in :mod:`asyncio` and in the
    OS) will fill up, then the TCP receive window will shrink, slowing down
    transmission to avoid packet loss.

    Since Python can use up to 4 bytes of memory to represent a single
    character, each connection may use up to ``4 * max_size * max_queue``
    bytes of memory to store incoming messages. By default, this is 128 MiB.
    You may want to lower the limits, depending on your application's
    requirements.

    The ``read_limit`` argument sets the high-water limit of the buffer for
    incoming bytes. The low-water limit is half the high-water limit. The
    default value is 64 KiB, half of asyncio's default (based on the current
    implementation of :class:`~asyncio.StreamReader`).

    The ``write_limit`` argument sets the high-water limit of the buffer for
    outgoing bytes. The low-water limit is a quarter of the high-water limit.
    The default value is 64 KiB, equal to asyncio's default (based on the
    current implementation of ``FlowControlMixin``).

    As soon as the HTTP request and response in the opening handshake are
    processed:

    * the request path is available in the :attr:`path` attribute;
    * the request and response HTTP headers are available in the
      :attr:`request_headers` and :attr:`response_headers` attributes,
      which are :class:`~websockets.http.Headers` instances.

    If a subprotocol was negotiated, it's available in the :attr:`subprotocol`
    attribute.

    Once the connection is closed, the code is available in the
    :attr:`close_code` attribute and the reason in :attr:`close_reason`.

    All attributes must be treated as read-only.

    """

    is_client = True
    side = "client"

    def __init__(
        self,
        *,
        origin: Optional[Origin] = None,
        extensions: Optional[Sequence[ClientExtensionFactory]] = None,
        subprotocols: Optional[Sequence[Subprotocol]] = None,
        extra_headers: Optional[HeadersLike] = None,
        **kwargs: Any,
    ) -> None:
        self.origin = origin
        self.available_extensions = extensions
        self.available_subprotocols = subprotocols
        self.extra_headers = extra_headers
        super().__init__(**kwargs)

    def write_http_request(self, path: str, headers: Headers) -> None:
        """
        Write request line and headers to the HTTP request.

        """
        self.path = path
        self.request_headers = headers

        logger.debug("%s > GET %s HTTP/1.1", self.side, path)
        logger.debug("%s > %r", self.side, headers)

        # Since the path and headers only contain ASCII characters,
        # we can keep this simple.
        request = f"GET {path} HTTP/1.1\r\n"
        request += str(headers)

        self.transport.write(request.encode())

    async def read_http_response(self) -> Tuple[int, Headers]:
        """
        Read status line and headers from the HTTP response.

        If the response contains a body, it may be read from ``self.reader``
        after this coroutine returns.

        :raises ~websockets.exceptions.InvalidMessage: if the HTTP message is
            malformed or isn't an HTTP/1.1 GET response

        """
        try:
            status_code, reason, headers = await read_response(self.reader)
        # Remove this branch when dropping support for Python < 3.8
        # because CancelledError no longer inherits Exception.
        except asyncio.CancelledError:  # pragma: no cover
            raise
        except Exception as exc:
            raise InvalidMessage("did not receive a valid HTTP response") from exc

        logger.debug("%s < HTTP/1.1 %d %s", self.side, status_code, reason)
        logger.debug("%s < %r", self.side, headers)

        self.response_headers = headers

        return status_code, self.response_headers

    @staticmethod
    def process_extensions(
        headers: Headers,
        available_extensions: Optional[Sequence[ClientExtensionFactory]],
    ) -> List[Extension]:
        """
        Handle the Sec-WebSocket-Extensions HTTP response header.

        Check that each extension is supported, as well as its parameters.

        Return the list of accepted extensions.

        Raise :exc:`~websockets.exceptions.InvalidHandshake` to abort the
        connection.

        :rfc:`6455` leaves the rules up to the specification of each
        :extension.

        To provide this level of flexibility, for each extension accepted by
        the server, we check for a match with each extension available in the
        client configuration. If no match is found, an exception is raised.

        If several variants of the same extension are accepted by the server,
        it may be configured several times, which won't make sense in general.
        Extensions must implement their own requirements. For this purpose,
        the list of previously accepted extensions is provided.

        Other requirements, for example related to mandatory extensions or the
        order of extensions, may be implemented by overriding this method.

        """
        accepted_extensions: List[Extension] = []

        header_values = headers.get_all("Sec-WebSocket-Extensions")

        if header_values:

            if available_extensions is None:
                raise InvalidHandshake("no extensions supported")

            parsed_header_values: List[ExtensionHeader] = sum(
                [parse_extension(header_value) for header_value in header_values], []
            )

            for name, response_params in parsed_header_values:

                for extension_factory in available_extensions:

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

    @staticmethod
    def process_subprotocol(
        headers: Headers, available_subprotocols: Optional[Sequence[Subprotocol]]
    ) -> Optional[Subprotocol]:
        """
        Handle the Sec-WebSocket-Protocol HTTP response header.

        Check that it contains exactly one supported subprotocol.

        Return the selected subprotocol.

        """
        subprotocol: Optional[Subprotocol] = None

        header_values = headers.get_all("Sec-WebSocket-Protocol")

        if header_values:

            if available_subprotocols is None:
                raise InvalidHandshake("no subprotocols supported")

            parsed_header_values: Sequence[Subprotocol] = sum(
                [parse_subprotocol(header_value) for header_value in header_values], []
            )

            if len(parsed_header_values) > 1:
                subprotocols = ", ".join(parsed_header_values)
                raise InvalidHandshake(f"multiple subprotocols: {subprotocols}")

            subprotocol = parsed_header_values[0]

            if subprotocol not in available_subprotocols:
                raise NegotiationError(f"unsupported subprotocol: {subprotocol}")

        return subprotocol

    async def handshake(
        self,
        wsuri: WebSocketURI,
        origin: Optional[Origin] = None,
        available_extensions: Optional[Sequence[ClientExtensionFactory]] = None,
        available_subprotocols: Optional[Sequence[Subprotocol]] = None,
        extra_headers: Optional[HeadersLike] = None,
    ) -> None:
        """
        Perform the client side of the opening handshake.

        :param origin: sets the Origin HTTP header
        :param available_extensions: list of supported extensions in the order
            in which they should be used
        :param available_subprotocols: list of supported subprotocols in order
            of decreasing preference
        :param extra_headers: sets additional HTTP request headers; it must be
            a :class:`~websockets.http.Headers` instance, a
            :class:`~collections.abc.Mapping`, or an iterable of ``(name,
            value)`` pairs
        :raises ~websockets.exceptions.InvalidHandshake: if the handshake
            fails

        """
        request_headers = Headers()

        request_headers["Host"] = build_host(wsuri.host, wsuri.port, wsuri.secure)

        if wsuri.user_info:
            request_headers["Authorization"] = build_authorization_basic(
                *wsuri.user_info
            )

        if origin is not None:
            request_headers["Origin"] = origin

        key = build_request(request_headers)

        if available_extensions is not None:
            extensions_header = build_extension(
                [
                    (extension_factory.name, extension_factory.get_request_params())
                    for extension_factory in available_extensions
                ]
            )
            request_headers["Sec-WebSocket-Extensions"] = extensions_header

        if available_subprotocols is not None:
            protocol_header = build_subprotocol(available_subprotocols)
            request_headers["Sec-WebSocket-Protocol"] = protocol_header

        if extra_headers is not None:
            if isinstance(extra_headers, Headers):
                extra_headers = extra_headers.raw_items()
            elif isinstance(extra_headers, collections.abc.Mapping):
                extra_headers = extra_headers.items()
            for name, value in extra_headers:
                request_headers[name] = value

        request_headers.setdefault("User-Agent", USER_AGENT)

        self.write_http_request(wsuri.resource_name, request_headers)

        status_code, response_headers = await self.read_http_response()
        if status_code in (301, 302, 303, 307, 308):
            if "Location" not in response_headers:
                raise InvalidHeader("Location")
            raise RedirectHandshake(response_headers["Location"])
        elif status_code != 101:
            raise InvalidStatusCode(status_code)

        check_response(response_headers, key)

        self.extensions = self.process_extensions(
            response_headers, available_extensions
        )

        self.subprotocol = self.process_subprotocol(
            response_headers, available_subprotocols
        )

        self.connection_open()


class Connect:
    """
    Connect to the WebSocket server at the given ``uri``.

    Awaiting :func:`connect` yields a :class:`WebSocketClientProtocol` which
    can then be used to send and receive messages.

    :func:`connect` can also be used as a asynchronous context manager::

        async with connect(...) as websocket:
            ...

    In that case, the connection is closed when exiting the context.

    :func:`connect` is a wrapper around the event loop's
    :meth:`~asyncio.loop.create_connection` method. Unknown keyword arguments
    are passed to :meth:`~asyncio.loop.create_connection`.

    For example, you can set the ``ssl`` keyword argument to a
    :class:`~ssl.SSLContext` to enforce some TLS settings. When connecting to
    a ``wss://`` URI, if this argument isn't provided explicitly,
    :func:`ssl.create_default_context` is called to create a context.

    You can connect to a different host and port from those found in ``uri``
    by setting ``host`` and ``port`` keyword arguments. This only changes the
    destination of the TCP connection. The host name from ``uri`` is still
    used in the TLS handshake for secure connections and in the ``Host`` HTTP
    header.

    ``create_protocol`` defaults to :class:`WebSocketClientProtocol`. It may
    be replaced by a wrapper or a subclass to customize the protocol that
    manages the connection.

    The behavior of ``ping_interval``, ``ping_timeout``, ``close_timeout``,
    ``max_size``, ``max_queue``, ``read_limit``, and ``write_limit`` is
    described in :class:`WebSocketClientProtocol`.

    :func:`connect` also accepts the following optional arguments:

    * ``compression`` is a shortcut to configure compression extensions;
      by default it enables the "permessage-deflate" extension; set it to
      ``None`` to disable compression.
    * ``origin`` sets the Origin HTTP header.
    * ``extensions`` is a list of supported extensions in order of
      decreasing preference.
    * ``subprotocols`` is a list of supported subprotocols in order of
      decreasing preference.
    * ``extra_headers`` sets additional HTTP request headers; it can be a
      :class:`~websockets.http.Headers` instance, a
      :class:`~collections.abc.Mapping`, or an iterable of ``(name, value)``
      pairs.

    :raises ~websockets.uri.InvalidURI: if ``uri`` is invalid
    :raises ~websockets.handshake.InvalidHandshake: if the opening handshake
        fails

    """

    MAX_REDIRECTS_ALLOWED = 10

    def __init__(
        self,
        uri: str,
        *,
        create_protocol: Optional[Callable[[Any], WebSocketClientProtocol]] = None,
        ping_interval: Optional[float] = 20,
        ping_timeout: Optional[float] = 20,
        close_timeout: Optional[float] = None,
        max_size: Optional[int] = 2 ** 20,
        max_queue: Optional[int] = 2 ** 5,
        read_limit: int = 2 ** 16,
        write_limit: int = 2 ** 16,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        compression: Optional[str] = "deflate",
        origin: Optional[Origin] = None,
        extensions: Optional[Sequence[ClientExtensionFactory]] = None,
        subprotocols: Optional[Sequence[Subprotocol]] = None,
        extra_headers: Optional[HeadersLike] = None,
        **kwargs: Any,
    ) -> None:
        # Backwards compatibility: close_timeout used to be called timeout.
        timeout: Optional[float] = kwargs.pop("timeout", None)
        if timeout is None:
            timeout = 10
        else:
            warnings.warn("rename timeout to close_timeout", DeprecationWarning)
        # If both are specified, timeout is ignored.
        if close_timeout is None:
            close_timeout = timeout

        # Backwards compatibility: create_protocol used to be called klass.
        klass: Optional[Type[WebSocketClientProtocol]] = kwargs.pop("klass", None)
        if klass is None:
            klass = WebSocketClientProtocol
        else:
            warnings.warn("rename klass to create_protocol", DeprecationWarning)
        # If both are specified, klass is ignored.
        if create_protocol is None:
            create_protocol = klass

        # Backwards compatibility: recv() used to return None on closed connections
        legacy_recv: bool = kwargs.pop("legacy_recv", False)

        if loop is None:
            loop = asyncio.get_event_loop()

        wsuri = parse_uri(uri)
        if wsuri.secure:
            kwargs.setdefault("ssl", True)
        elif kwargs.get("ssl") is not None:
            raise ValueError(
                "connect() received a ssl argument for a ws:// URI, "
                "use a wss:// URI to enable TLS"
            )

        if compression == "deflate":
            extensions = enable_client_permessage_deflate(extensions)
        elif compression is not None:
            raise ValueError(f"unsupported compression: {compression}")

        factory = functools.partial(
            create_protocol,
            ping_interval=ping_interval,
            ping_timeout=ping_timeout,
            close_timeout=close_timeout,
            max_size=max_size,
            max_queue=max_queue,
            read_limit=read_limit,
            write_limit=write_limit,
            loop=loop,
            host=wsuri.host,
            port=wsuri.port,
            secure=wsuri.secure,
            legacy_recv=legacy_recv,
            origin=origin,
            extensions=extensions,
            subprotocols=subprotocols,
            extra_headers=extra_headers,
        )

        if kwargs.pop("unix", False):
            path: Optional[str] = kwargs.pop("path", None)
            create_connection = functools.partial(
                loop.create_unix_connection, factory, path, **kwargs
            )
        else:
            host: Optional[str]
            port: Optional[int]
            if kwargs.get("sock") is None:
                host, port = wsuri.host, wsuri.port
            else:
                # If sock is given, host and port shouldn't be specified.
                host, port = None, None
            # If host and port are given, override values from the URI.
            host = kwargs.pop("host", host)
            port = kwargs.pop("port", port)
            create_connection = functools.partial(
                loop.create_connection, factory, host, port, **kwargs
            )

        # This is a coroutine function.
        self._create_connection = create_connection
        self._wsuri = wsuri

    def handle_redirect(self, uri: str) -> None:
        # Update the state of this instance to connect to a new URI.
        old_wsuri = self._wsuri
        new_wsuri = parse_uri(uri)

        # Forbid TLS downgrade.
        if old_wsuri.secure and not new_wsuri.secure:
            raise SecurityError("redirect from WSS to WS")

        same_origin = (
            old_wsuri.host == new_wsuri.host and old_wsuri.port == new_wsuri.port
        )

        # Rewrite the host and port arguments for cross-origin redirects.
        # This preserves connection overrides with the host and port
        # arguments if the redirect points to the same host and port.
        if not same_origin:
            # Replace the host and port argument passed to the protocol factory.
            factory = self._create_connection.args[0]
            factory = functools.partial(
                factory.func,
                *factory.args,
                **dict(factory.keywords, host=new_wsuri.host, port=new_wsuri.port),
            )
            # Replace the host and port argument passed to create_connection.
            self._create_connection = functools.partial(
                self._create_connection.func,
                *(factory, new_wsuri.host, new_wsuri.port),
                **self._create_connection.keywords,
            )

        # Set the new WebSocket URI. This suffices for same-origin redirects.
        self._wsuri = new_wsuri

    # async with connect(...)

    async def __aenter__(self) -> WebSocketClientProtocol:
        return await self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_value: Optional[BaseException],
        traceback: Optional[TracebackType],
    ) -> None:
        await self.protocol.close()

    # await connect(...)

    def __await__(self) -> Generator[Any, None, WebSocketClientProtocol]:
        # Create a suitable iterator by calling __await__ on a coroutine.
        return self.__await_impl__().__await__()

    async def __await_impl__(self) -> WebSocketClientProtocol:
        for redirects in range(self.MAX_REDIRECTS_ALLOWED):
            transport, protocol = await self._create_connection()
            # https://github.com/python/typeshed/pull/2756
            transport = cast(asyncio.Transport, transport)
            protocol = cast(WebSocketClientProtocol, protocol)

            try:
                try:
                    await protocol.handshake(
                        self._wsuri,
                        origin=protocol.origin,
                        available_extensions=protocol.available_extensions,
                        available_subprotocols=protocol.available_subprotocols,
                        extra_headers=protocol.extra_headers,
                    )
                except Exception:
                    protocol.fail_connection()
                    await protocol.wait_closed()
                    raise
                else:
                    self.protocol = protocol
                    return protocol
            except RedirectHandshake as exc:
                self.handle_redirect(exc.uri)
        else:
            raise SecurityError("too many redirects")

    # yield from connect(...)

    __iter__ = __await__


connect = Connect


def unix_connect(
    path: Optional[str], uri: str = "ws://localhost/", **kwargs: Any
) -> Connect:
    """
    Similar to :func:`connect`, but for connecting to a Unix socket.

    This function calls the event loop's
    :meth:`~asyncio.loop.create_unix_connection` method.

    It is only available on Unix.

    It's mainly useful for debugging servers listening on Unix sockets.

    :param path: file system path to the Unix socket
    :param uri: WebSocket URI

    """
    return connect(uri=uri, path=path, unix=True, **kwargs)
