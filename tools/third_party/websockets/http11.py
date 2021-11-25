import re
from typing import Callable, Generator, NamedTuple, Optional

from .datastructures import Headers
from .exceptions import SecurityError


MAX_HEADERS = 256
MAX_LINE = 4110


def d(value: bytes) -> str:
    """
    Decode a bytestring for interpolating into an error message.

    """
    return value.decode(errors="backslashreplace")


# See https://tools.ietf.org/html/rfc7230#appendix-B.

# Regex for validating header names.

_token_re = re.compile(rb"[-!#$%&\'*+.^_`|~0-9a-zA-Z]+")

# Regex for validating header values.

# We don't attempt to support obsolete line folding.

# Include HTAB (\x09), SP (\x20), VCHAR (\x21-\x7e), obs-text (\x80-\xff).

# The ABNF is complicated because it attempts to express that optional
# whitespace is ignored. We strip whitespace and don't revalidate that.

# See also https://www.rfc-editor.org/errata_search.php?rfc=7230&eid=4189

_value_re = re.compile(rb"[\x09\x20-\x7e\x80-\xff]*")


# Consider converting to dataclasses when dropping support for Python < 3.7.


class Request(NamedTuple):
    """
    WebSocket handshake request.

    :param path: path and optional query
    :param headers:
    """

    path: str
    headers: Headers
    # body isn't useful is the context of this library

    @classmethod
    def parse(
        cls, read_line: Callable[[], Generator[None, None, bytes]]
    ) -> Generator[None, None, "Request"]:
        """
        Parse an HTTP/1.1 GET request and return ``(path, headers)``.

        ``path`` isn't URL-decoded or validated in any way.

        ``path`` and ``headers`` are expected to contain only ASCII characters.
        Other characters are represented with surrogate escapes.

        :func:`parse_request` doesn't attempt to read the request body because
        WebSocket handshake requests don't have one. If the request contains a
        body, it may be read from ``stream`` after this coroutine returns.

        :param read_line: generator-based coroutine that reads a LF-terminated
            line or raises an exception if there isn't enough data
        :raises EOFError: if the connection is closed without a full HTTP request
        :raises SecurityError: if the request exceeds a security limit
        :raises ValueError: if the request isn't well formatted

        """
        # https://tools.ietf.org/html/rfc7230#section-3.1.1

        # Parsing is simple because fixed values are expected for method and
        # version and because path isn't checked. Since WebSocket software tends
        # to implement HTTP/1.1 strictly, there's little need for lenient parsing.

        try:
            request_line = yield from parse_line(read_line)
        except EOFError as exc:
            raise EOFError("connection closed while reading HTTP request line") from exc

        try:
            method, raw_path, version = request_line.split(b" ", 2)
        except ValueError:  # not enough values to unpack (expected 3, got 1-2)
            raise ValueError(f"invalid HTTP request line: {d(request_line)}") from None

        if method != b"GET":
            raise ValueError(f"unsupported HTTP method: {d(method)}")
        if version != b"HTTP/1.1":
            raise ValueError(f"unsupported HTTP version: {d(version)}")
        path = raw_path.decode("ascii", "surrogateescape")

        headers = yield from parse_headers(read_line)

        return cls(path, headers)

    def serialize(self) -> bytes:
        """
        Serialize an HTTP/1.1 GET request.

        """
        # Since the path and headers only contain ASCII characters,
        # we can keep this simple.
        request = f"GET {self.path} HTTP/1.1\r\n".encode()
        request += self.headers.serialize()
        return request


# Consider converting to dataclasses when dropping support for Python < 3.7.


class Response(NamedTuple):
    """
    WebSocket handshake response.

    """

    status_code: int
    reason_phrase: str
    headers: Headers
    body: Optional[bytes] = None

    # If processing the response triggers an exception, it's stored here.
    exception: Optional[Exception] = None

    @classmethod
    def parse(
        cls,
        read_line: Callable[[], Generator[None, None, bytes]],
        read_exact: Callable[[int], Generator[None, None, bytes]],
        read_to_eof: Callable[[], Generator[None, None, bytes]],
    ) -> Generator[None, None, "Response"]:
        """
        Parse an HTTP/1.1 response and return ``(status_code, reason, headers)``.

        ``reason`` and ``headers`` are expected to contain only ASCII characters.
        Other characters are represented with surrogate escapes.

        :func:`parse_request` doesn't attempt to read the response body because
        WebSocket handshake responses don't have one. If the response contains a
        body, it may be read from ``stream`` after this coroutine returns.

        :param read_line: generator-based coroutine that reads a LF-terminated
            line or raises an exception if there isn't enough data
        :param read_exact: generator-based coroutine that reads the requested
            number of bytes or raises an exception if there isn't enough data
        :raises EOFError: if the connection is closed without a full HTTP response
        :raises SecurityError: if the response exceeds a security limit
        :raises LookupError: if the response isn't well formatted
        :raises ValueError: if the response isn't well formatted

        """
        # https://tools.ietf.org/html/rfc7230#section-3.1.2

        # As in parse_request, parsing is simple because a fixed value is expected
        # for version, status_code is a 3-digit number, and reason can be ignored.

        try:
            status_line = yield from parse_line(read_line)
        except EOFError as exc:
            raise EOFError("connection closed while reading HTTP status line") from exc

        try:
            version, raw_status_code, raw_reason = status_line.split(b" ", 2)
        except ValueError:  # not enough values to unpack (expected 3, got 1-2)
            raise ValueError(f"invalid HTTP status line: {d(status_line)}") from None

        if version != b"HTTP/1.1":
            raise ValueError(f"unsupported HTTP version: {d(version)}")
        try:
            status_code = int(raw_status_code)
        except ValueError:  # invalid literal for int() with base 10
            raise ValueError(
                f"invalid HTTP status code: {d(raw_status_code)}"
            ) from None
        if not 100 <= status_code < 1000:
            raise ValueError(f"unsupported HTTP status code: {d(raw_status_code)}")
        if not _value_re.fullmatch(raw_reason):
            raise ValueError(f"invalid HTTP reason phrase: {d(raw_reason)}")
        reason = raw_reason.decode()

        headers = yield from parse_headers(read_line)

        # https://tools.ietf.org/html/rfc7230#section-3.3.3

        if "Transfer-Encoding" in headers:
            raise NotImplementedError("transfer codings aren't supported")

        # Since websockets only does GET requests (no HEAD, no CONNECT), all
        # responses except 1xx, 204, and 304 include a message body.
        if 100 <= status_code < 200 or status_code == 204 or status_code == 304:
            body = None
        else:
            content_length: Optional[int]
            try:
                # MultipleValuesError is sufficiently unlikely that we don't
                # attempt to handle it. Instead we document that its parent
                # class, LookupError, may be raised.
                raw_content_length = headers["Content-Length"]
            except KeyError:
                content_length = None
            else:
                content_length = int(raw_content_length)

            if content_length is None:
                body = yield from read_to_eof()
            else:
                body = yield from read_exact(content_length)

        return cls(status_code, reason, headers, body)

    def serialize(self) -> bytes:
        """
        Serialize an HTTP/1.1 GET response.

        """
        # Since the status line and headers only contain ASCII characters,
        # we can keep this simple.
        response = f"HTTP/1.1 {self.status_code} {self.reason_phrase}\r\n".encode()
        response += self.headers.serialize()
        if self.body is not None:
            response += self.body
        return response


def parse_headers(
    read_line: Callable[[], Generator[None, None, bytes]]
) -> Generator[None, None, Headers]:
    """
    Parse HTTP headers.

    Non-ASCII characters are represented with surrogate escapes.

    :param read_line: generator-based coroutine that reads a LF-terminated
        line or raises an exception if there isn't enough data

    """
    # https://tools.ietf.org/html/rfc7230#section-3.2

    # We don't attempt to support obsolete line folding.

    headers = Headers()
    for _ in range(MAX_HEADERS + 1):
        try:
            line = yield from parse_line(read_line)
        except EOFError as exc:
            raise EOFError("connection closed while reading HTTP headers") from exc
        if line == b"":
            break

        try:
            raw_name, raw_value = line.split(b":", 1)
        except ValueError:  # not enough values to unpack (expected 2, got 1)
            raise ValueError(f"invalid HTTP header line: {d(line)}") from None
        if not _token_re.fullmatch(raw_name):
            raise ValueError(f"invalid HTTP header name: {d(raw_name)}")
        raw_value = raw_value.strip(b" \t")
        if not _value_re.fullmatch(raw_value):
            raise ValueError(f"invalid HTTP header value: {d(raw_value)}")

        name = raw_name.decode("ascii")  # guaranteed to be ASCII at this point
        value = raw_value.decode("ascii", "surrogateescape")
        headers[name] = value

    else:
        raise SecurityError("too many HTTP headers")

    return headers


def parse_line(
    read_line: Callable[[], Generator[None, None, bytes]]
) -> Generator[None, None, bytes]:
    """
    Parse a single line.

    CRLF is stripped from the return value.

    :param read_line: generator-based coroutine that reads a LF-terminated
        line or raises an exception if there isn't enough data

    """
    # Security: TODO: add a limit here
    line = yield from read_line()
    # Security: this guarantees header values are small (hard-coded = 4 KiB)
    if len(line) > MAX_LINE:
        raise SecurityError("line too long")
    # Not mandatory but safe - https://tools.ietf.org/html/rfc7230#section-3.5
    if not line.endswith(b"\r\n"):
        raise EOFError("line without CRLF")
    return line[:-2]
