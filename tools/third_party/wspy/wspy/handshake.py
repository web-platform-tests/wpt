import os
import re
import socket
import time
from base64 import b64encode
from hashlib import sha1
from urlparse import urlparse

from errors import HandshakeError
from python_digest import build_authorization_request


WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
WS_VERSION = '13'
MAX_REDIRECTS = 10
HDR_TIMEOUT = 5
MAX_HDR_LEN = 1024


class Handshake(object):
    def __init__(self, wsock):
        self.wsock = wsock
        self.sock = wsock.sock

    def fail(self, msg):
        self.sock.close()
        raise HandshakeError(msg)

    def receive_request(self):
        raw, headers = self.receive_headers()

        # Request must be HTTP (at least 1.1) GET request, find the location
        # (without trailing slash)
        match = re.search(r'^GET (.*?)/* HTTP/1.1\r\n', raw)

        if match is None:
            self.fail('not a valid HTTP 1.1 GET request')

        location = match.group(1)
        return location, headers

    def receive_response(self):
        raw, headers = self.receive_headers()

        # Response must be HTTP (at least 1.1) with status 101
        match = re.search(r'^HTTP/1\.1 (\d{3})', raw)

        if match is None:
            self.fail('not a valid HTTP 1.1 response')

        status = int(match.group(1))
        return status, headers

    def receive_headers(self):
        # Receive entire HTTP header
        hdr = ''

        sock_timeout = self.sock.gettimeout()

        try:
            force_timeout = sock_timeout is None
            timeout = HDR_TIMEOUT if force_timeout else sock_timeout
            self.sock.settimeout(timeout)

            start_time = time.time()

            while hdr[-4:] != '\r\n\r\n':
                if len(hdr) == MAX_HDR_LEN:
                    raise HandshakeError('request exceeds maximum header '
                                         'length of %d' % MAX_HDR_LEN)

                hdr += self.sock.recv(1)

                time_diff = time.time() - start_time

                if time_diff > timeout:
                    raise socket.timeout

                self.sock.settimeout(timeout - time_diff)
        except socket.timeout:
            self.sock.close()
            raise HandshakeError('timeout while receiving handshake headers')

        self.sock.settimeout(sock_timeout)

        hdr = hdr.decode('utf-8', 'ignore')
        headers = {}

        for key, value in re.findall(r'(.*?): ?(.*?)\r\n', hdr):
            if key in headers:
                headers[key] += ', ' + value
            else:
                headers[key] = value

        return hdr, headers

    def send_headers(self, headers):
        # Send request
        for hdr in list(headers):
            if isinstance(hdr, tuple):
                hdr = '%s: %s' % hdr

            self.sock.sendall(hdr + '\r\n')

        self.sock.sendall('\r\n')

    def perform(self):
        raise NotImplementedError


class ServerHandshake(Handshake):
    """
    Executes a handshake as the server end point of the socket. If the HTTP
    request headers sent by the client are invalid, a HandshakeError is raised.
    """

    def perform(self, ssock):
        # Receive and validate client handshake
        location, headers = self.receive_request()
        self.wsock.location = location
        self.wsock.request_headers = headers

        # Send server handshake in response
        self.send_headers(self.response_headers(ssock))

    def response_headers(self, ssock):
        headers = self.wsock.request_headers

        # Check if headers that MUST be present are actually present
        for name in ('Host', 'Upgrade', 'Connection', 'Sec-WebSocket-Key',
                     'Sec-WebSocket-Version'):
            if name not in headers:
                self.fail('missing "%s" header' % name)

        # Check WebSocket version used by client
        version = headers['Sec-WebSocket-Version']

        if version != WS_VERSION:
            self.fail('WebSocket version %s requested (only %s is supported)'
                      % (version, WS_VERSION))

        # Verify required header keywords
        if 'websocket' not in headers['Upgrade'].lower():
            self.fail('"Upgrade" header must contain "websocket"')

        if 'upgrade' not in headers['Connection'].lower():
            self.fail('"Connection" header must contain "Upgrade"')

        # Origin must be present if browser client, and must match the list of
        # trusted origins
        if 'Origin' not in headers and 'User-Agent' in headers:
            self.fail('browser client must specify "Origin" header')

        origin = headers.get('Origin', 'null')

        if origin == 'null':
            if ssock.trusted_origins:
                self.fail('no "Origin" header specified, assuming untrusted')
        elif ssock.trusted_origins and origin not in ssock.trusted_origins:
            self.fail('untrusted origin "%s"' % origin)

        # Only a supported protocol can be returned
        client_proto = split_stripped(headers['Sec-WebSocket-Protocol']) \
                       if 'Sec-WebSocket-Protocol' in headers else []
        self.wsock.protocol = None

        for p in client_proto:
            if p in ssock.protocols:
                self.wsock.protocol = p
                break

        # Only supported extensions are returned
        if 'Sec-WebSocket-Extensions' in headers:
            self.wsock.extension_instances = []

            for hdr in split_stripped(headers['Sec-WebSocket-Extensions']):
                name, params = parse_param_hdr(hdr)

                for ext in ssock.extensions:
                    if ext.is_supported(name, self.wsock.extension_instances):
                        accept_params = ext.negotiate_safe(name, params)

                        if accept_params is not None:
                            instance = ext.Instance(ext, name, accept_params)
                            self.wsock.extension_instances.append(instance)

        # Check if requested resource location is served by this server
        if ssock.locations:
            if self.wsock.location not in ssock.locations:
                raise HandshakeError('location "%s" is not supported by this '
                                     'server' % self.wsock.location)

        # Encode acceptation key using the WebSocket GUID
        key = headers['Sec-WebSocket-Key'].strip()
        accept = b64encode(sha1(key + WS_GUID).digest())

        # Location scheme differs for SSL-enabled connections
        scheme = 'wss' if self.wsock.secure else 'ws'

        if 'Host' in headers:
            host = headers['Host']
        else:
            host, port = self.sock.getpeername()
            default_port = 443 if self.wsock.secure else 80

            if port != default_port:
                host += ':%d' % port

        location = '%s://%s%s' % (scheme, host, self.wsock.location)

        # Construct HTTP response header
        yield 'HTTP/1.1 101 Switching Protocols'
        yield 'Upgrade', 'websocket'
        yield 'Connection', 'Upgrade'
        yield 'Sec-WebSocket-Origin', origin
        yield 'Sec-WebSocket-Location', location
        yield 'Sec-WebSocket-Accept', accept

        if self.wsock.protocol:
            yield 'Sec-WebSocket-Protocol', self.wsock.protocol

        if self.wsock.extension_instances:
            values = [format_param_hdr(i.name, i.params)
                      for i in self.wsock.extension_instances]
            yield 'Sec-WebSocket-Extensions', ', '.join(values)


class ClientHandshake(Handshake):
    """
    Executes a handshake as the client end point of the socket. May raise a
    HandshakeError if the server response is invalid.
    """

    def __init__(self, wsock):
        Handshake.__init__(self, wsock)
        self.redirects = 0

    def perform(self):
        self.send_headers(self.request_headers())
        self.handle_response(*self.receive_response())

    def handle_response(self, status, headers):
        if status == 101:
            self.handle_handshake(headers)
        elif status == 401:
            self.handle_auth(headers)
        elif status in (301, 302, 303, 307, 308):
            self.handle_redirect(headers)
        else:
            self.fail('invalid HTTP response status %d' % status)

    def handle_handshake(self, headers):
        # Check if headers that MUST be present are actually present
        for name in ('Upgrade', 'Connection', 'Sec-WebSocket-Accept'):
            if name not in headers:
                self.fail('missing "%s" header' % name)

        if 'websocket' not in headers['Upgrade'].lower():
            self.fail('"Upgrade" header must contain "websocket"')

        if 'upgrade' not in headers['Connection'].lower():
            self.fail('"Connection" header must contain "Upgrade"')

        # Verify accept header
        accept = headers['Sec-WebSocket-Accept'].strip()
        required_accept = b64encode(sha1(self.key + WS_GUID).digest())

        if accept != required_accept:
            self.fail('invalid websocket accept header "%s"' % accept)

        # Compare extensions, add hooks only for those returned by server
        if 'Sec-WebSocket-Extensions' in headers:
            # FIXME: there is no distinction between server/client extension
            # instances, while the extension instance may assume it belongs to
            # a server, leading to undefined behavior
            self.wsock.extension_instances = []

            for hdr in split_stripped(headers['Sec-WebSocket-Extensions']):
                name, accept_params = parse_param_hdr(hdr)

                for ext in self.wsock.extensions:
                    if name in ext.names:
                        instance = ext.Instance(ext, name, accept_params)
                        self.wsock.extension_instances.append(instance)
                        break
                else:
                    raise HandshakeError('server handshake contains '
                                         'unsupported extension "%s"' % name)

        # Assert that returned protocol (if any) is supported
        if 'Sec-WebSocket-Protocol' in headers:
            protocol = headers['Sec-WebSocket-Protocol']

            if protocol != 'null' and protocol not in self.wsock.protocols:
                self.fail('unsupported protocol "%s"' % protocol)

            self.wsock.protocol = protocol

    def handle_auth(self, headers):
        # HTTP authentication is required in the request
        hdr = headers['WWW-Authenticate']
        authres = dict(re.findall(r'(\w+)[:=] ?"?(\w+)"?', hdr))
        mode = hdr.lstrip().split(' ', 1)[0]

        if not self.wsock.auth:
            self.fail('missing username and password for HTTP authentication')

        if mode == 'Basic':
            auth_hdr = self.http_auth_basic_headers(**authres)
        elif mode == 'Digest':
            auth_hdr = self.http_auth_digest_headers(**authres)
        else:
            self.fail('unsupported HTTP authentication mode "%s"' % mode)

        # Send new, authenticated handshake
        self.send_headers(list(self.request_headers()) + list(auth_hdr))
        self.handle_response(*self.receive_response())

    def handle_redirect(self, headers):
        self.redirects += 1

        if self.redirects > MAX_REDIRECTS:
            self.fail('reached maximum number of redirects (%d)'
                      % MAX_REDIRECTS)

        # Handle HTTP redirect
        url = urlparse(headers['Location'].strip())

        # Reconnect socket to new host if net location changed
        if not url.port:
            url.port = 443 if self.secure else 80

        addr = (url.netloc, url.port)

        if addr != self.sock.getpeername():
            self.sock.close()
            self.sock.connect(addr)

        # Update websocket object and send new handshake
        self.wsock.location = url.path
        self.perform()

    def request_headers(self):
        if len(self.wsock.location) == 0:
            self.fail('request location is empty')

        # Generate a 16-byte random base64-encoded key for this connection
        self.key = b64encode(os.urandom(16))

        # Send client handshake
        yield 'GET %s HTTP/1.1' % self.wsock.location
        yield 'Host', '%s:%d' % self.sock.getpeername()
        yield 'Upgrade', 'websocket'
        yield 'Connection', 'keep-alive, Upgrade'
        yield 'Sec-WebSocket-Key', self.key
        yield 'Sec-WebSocket-Version', WS_VERSION

        if self.wsock.origin:
            yield 'Origin', self.wsock.origin

        # These are for eagerly caching webservers
        yield 'Pragma', 'no-cache'
        yield 'Cache-Control', 'no-cache'

        # Request protocols and extensions, these are later checked with the
        # actual supported values from the server's response
        if self.wsock.protocols:
            yield 'Sec-WebSocket-Protocol', ', '.join(self.wsock.protocols)

        if self.wsock.extensions:
            values = [format_param_hdr(e.name, e.request)
                      for e in self.wsock.extensions]
            yield 'Sec-WebSocket-Extensions', ', '.join(values)

    def http_auth_basic_headers(self, **kwargs):
        u, p = self.wsock.auth
        u = u.encode('utf-8')
        p = p.encode('utf-8')
        yield 'Authorization', 'Basic ' + b64encode(u + ':' + p)

    def http_auth_digest_headers(self, **kwargs):
        username, password = self.wsock.auth
        yield 'Authorization', build_authorization_request(
                                username=username.encode('utf-8'),
                                method='GET',
                                uri=self.wsock.location,
                                nonce_count=0,
                                realm=kwargs['realm'],
                                nonce=kwargs['nonce'],
                                opaque=kwargs['opaque'],
                                password=password.encode('utf-8'))


def split_stripped(value, delim=',', maxsplits=-1):
    return map(str.strip, str(value).split(delim, maxsplits)) if value else []


def parse_param_hdr(hdr):
    if ';' in hdr:
        name, paramstr = split_stripped(hdr, ';', 1)
    else:
        name = hdr
        paramstr = ''

    params = {}

    for param in split_stripped(paramstr):
        if '=' in param:
            key, value = split_stripped(param, '=', 1)

            if value.isdigit():
                value = int(value)
        else:
            key = param
            value = True

        params[key] = value

    return name, params


def format_param_hdr(value, params):
    if not params:
        return value

    def fmt_param((k, v)):
        if v is True:
            return k

        if v is not False and v is not None:
            return k + '=' + str(v)

    strparams = filter(None, map(fmt_param, params.items()))
    return '; '.join([value] + strparams)
