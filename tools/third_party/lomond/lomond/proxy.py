from __future__ import unicode_literals

import base64

from .parser import Parser, ParseError
from .response import Response


class ProxyFail(Exception):
    """An error with the proxy."""
    # An internal exception


class ProxyResponse(Response):
    """The response received from the proxy."""


def build_request(host, port, proxy_username=None, proxy_password=None):
    """Build a request to the proxy."""
    request = [
        'CONNECT {}:{} HTTP/1.1'.format(host, port).encode('utf-8')
    ]
    headers = [
        (b'Host', host.encode('utf-8')),
        (b'Proxy-Connection', b'keep-alive'),
        (b'Connection', b'keep-alive'),
    ]

    if proxy_username:
        credentials = (
            proxy_username
            if proxy_password is None else
            '{}:{}'.format(proxy_username, proxy_password)
        ).encode('utf-8')
        b64_credentials = base64.standard_b64encode(credentials)
        headers.append(
            (b'Proxy-Authorization:', b'Basic ' + b64_credentials)
        )

    for header, value in headers:
        request.append(header + b': ' + value)

    request.append(b'\r\n')
    request_bytes = b'\r\n'.join(request)
    return request_bytes


class ProxyParser(Parser):
    """Parser for communication with a SOCKS proxy."""

    def parse(self):
        try:
            headers_data = yield self.read_until(b'\r\n\r\n', max_bytes=16 * 1024)
        except ParseError as error:
            raise ProxyFail('proxy parse fail; {}', error)
        response = ProxyResponse(headers_data)
        if response.status_code != 200:
            raise ProxyFail(
                'proxy fail; {} {}',
                response.status_code,
                response.status
            )
        yield response
