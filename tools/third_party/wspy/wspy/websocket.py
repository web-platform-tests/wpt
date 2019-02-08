import socket
import ssl

from frame import receive_frame, pop_frame, contains_frame
from handshake import ServerHandshake, ClientHandshake
from errors import SSLError


INHERITED_ATTRS = ['bind', 'close', 'listen', 'fileno', 'getpeername',
                   'getsockname', 'getsockopt', 'setsockopt', 'setblocking',
                   'settimeout', 'gettimeout', 'shutdown', 'family', 'type',
                   'proto']

class websocket(object):
    """
    Implementation of web socket, upgrades a regular TCP socket to a websocket
    using the HTTP handshakes and frame (un)packing, as specified by RFC 6455.
    The API of a websocket is identical to that of a regular socket, as
    illustrated by the examples below.

    Server example:
    >>> import wspy, socket
    >>> sock = wspy.websocket()
    >>> sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    >>> sock.bind(('', 8000))
    >>> sock.listen(5)

    >>> client = sock.accept()
    >>> client.send(wspy.Frame(wspy.OPCODE_TEXT, 'Hello, Client!'))
    >>> frame = client.recv()

    Client example:
    >>> import wspy
    >>> sock = wspy.websocket(location='/my/path')
    >>> sock.connect(('', 8000))
    >>> sock.send(wspy.Frame(wspy.OPCODE_TEXT, 'Hello, Server!'))
    """
    def __init__(self, sock=None, origin=None, protocols=[], extensions=[],
                 location='/', trusted_origins=[], locations=[], auth=None,
                 recv_callback=None, sfamily=socket.AF_INET, sproto=0):
        """
        Create a regular TCP socket of family `family` and protocol

        `sock` is an optional regular TCP socket to be used for sending binary
        data. If not specified, a new socket is created.

        `origin` (for client sockets) is the value for the "Origin" header sent
        in a client handshake .

        `protocols` is a list of supported protocol names.

        `extensions` (for server sockets) is a list of supported extensions
        (`Extension` instances).

        `location` (for client sockets) is optional, used to request a
        particular resource in the HTTP handshake. In a URL, this would show as
        ws://host[:port]/<location>. Use this when the server serves multiple
        resources (see `locations`).

        `trusted_origins` (for server sockets) is a list of expected values
        for the "Origin" header sent by a client. If the received Origin header
        has value not in this list, a HandshakeError is raised. If the list is
        empty (default), all origins are excepted.

        `locations` (for server sockets) is an optional list of resources
        serverd by this server. If specified (without trailing slashes), these
        are used to verify the resource location requested by a client. The
        requested location may be used to distinquish different services in a
        server implementation.

        `auth` is optional, used for HTTP Basic or Digest authentication during
        the handshake. It must be specified as a (username, password) tuple.

        `recv_callback` is the callback for received frames in asynchronous
        sockets. Use in conjunction with setblocking(0). The callback itself
        may for example change the recv_callback attribute to change the
        behaviour for the next received message. Can be set when calling
        `queue_send`.

        `sfamily` and `sproto` are used for the regular socket constructor.
        """
        self.protocols = protocols
        self.extensions = extensions
        self.extension_instances = []
        self.origin = origin
        self.location = location
        self.trusted_origins = trusted_origins
        self.locations = locations
        self.auth = auth

        self.secure = False

        self.handshake_sent = False

        self.sendbuf_frames = []
        self.sendbuf = ''
        self.recvbuf = ''
        self.recv_callback = recv_callback

        self.sock = sock or socket.socket(sfamily, socket.SOCK_STREAM, sproto)

    def __getattr__(self, name):
        if name in INHERITED_ATTRS:
            return getattr(self.sock, name)

        raise AttributeError("'%s' has no attribute '%s'"
                             % (self.__class__.__name__, name))

    def accept(self):
        """
        Equivalent to socket.accept(), but transforms the socket into a
        websocket instance and sends a server handshake (after receiving a
        client handshake). Note that the handshake may raise a HandshakeError
        exception.
        """
        sock, address = self.sock.accept()
        wsock = websocket(sock)
        wsock.secure = self.secure
        ServerHandshake(wsock).perform(self)
        wsock.handshake_sent = True
        return wsock, address

    def connect(self, address):
        """
        Equivalent to socket.connect(), but sends an client handshake request
        after connecting.

        `address` is a (host, port) tuple of the server to connect to.
        """
        self.sock.connect(address)
        ClientHandshake(self).perform()
        self.handshake_sent = True

    def apply_send_hooks(self, frame, before_fragmentation):
        for inst in self.extension_instances:
            if inst.extension.before_fragmentation == before_fragmentation:
                frame = inst.handle_send(frame)

        return frame

    def apply_recv_hooks(self, frame, before_fragmentation):
        for inst in reversed(self.extension_instances):
            if inst.extension.before_fragmentation == before_fragmentation:
                frame = inst.handle_recv(frame)

        return frame

    def send(self, *args):
        """
        Send a number of frames.
        """
        for frame in args:
            self.sock.sendall(self.apply_send_hooks(frame, False).pack())

    def recv(self):
        """
        Receive a single frames. This can be either a data frame or a control
        frame.
        """
        return self.apply_recv_hooks(receive_frame(self.sock), False)

    def recvn(self, n):
        """
        Receive exactly `n` frames. These can be either data frames or control
        frames, or a combination of both.
        """
        return [self.recv() for i in xrange(n)]

    def queue_send(self, frame, callback=None, recv_callback=None):
        """
        Enqueue `frame` to the send buffer so that it is send on the next
        `do_async_send`. `callback` is an optional callable to call when the
        frame has been fully written. `recv_callback` is an optional callable
        to quickly set the `recv_callback` attribute to.
        """
        frame = self.apply_send_hooks(frame, False)
        self.sendbuf += frame.pack()
        self.sendbuf_frames.append([frame, len(self.sendbuf), callback])

        if recv_callback:
            self.recv_callback = recv_callback

    def do_async_send(self):
        """
        Send any queued data. This function should only be called after a write
        event on a file descriptor.
        """
        assert len(self.sendbuf)

        nwritten = self.sock.send(self.sendbuf)
        nframes = 0

        for entry in self.sendbuf_frames:
            frame, offset, callback = entry

            if offset <= nwritten:
                nframes += 1

                if callback:
                    callback()
            else:
                entry[1] -= nwritten

        self.sendbuf = self.sendbuf[nwritten:]
        self.sendbuf_frames = self.sendbuf_frames[nframes:]

    def do_async_recv(self, bufsize):
        """
        Receive any completed frames from the socket. This function should only
        be called after a read event on a file descriptor.
        """
        data = self.sock.recv(bufsize)

        if len(data) == 0:
            raise socket.error('no data to receive')

        self.recvbuf += data

        while contains_frame(self.recvbuf):
            frame, self.recvbuf = pop_frame(self.recvbuf)
            frame = self.apply_recv_hooks(frame, False)

            if not self.recv_callback:
                raise ValueError('no callback installed for %s' % frame)

            self.recv_callback(frame)

    def can_send(self):
        return len(self.sendbuf) > 0

    def can_recv(self):
        return self.recv_callback is not None

    def enable_ssl(self, *args, **kwargs):
        """
        Transforms the regular socket.socket to an ssl.SSLSocket for secure
        connections. Any arguments are passed to ssl.wrap_socket:
        http://docs.python.org/dev/library/ssl.html#ssl.wrap_socket
        """
        if self.handshake_sent:
            raise SSLError('can only enable SSL before handshake')

        self.secure = True
        self.sock = ssl.wrap_socket(self.sock, *args, **kwargs)
