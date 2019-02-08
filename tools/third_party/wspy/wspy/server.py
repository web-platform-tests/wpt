import socket
import logging
import time
from traceback import format_exc
from threading import Thread
from ssl import SSLError

from websocket import websocket
from connection import Connection
from errors import HandshakeError


class Server(object):
    """
    Websocket server, manages multiple client connections.

    Example usage:
    >>> import wspy

    >>> class EchoServer(wspy.Server):
    >>>     def onopen(self, client):
    >>>         print 'Client %s connected' % client

    >>>     def onmessage(self, client, message):
    >>>         print 'Received message "%s"' % message.payload
    >>>         client.send(wspy.TextMessage(message.payload))

    >>>     def onclose(self, client, code, reason):
    >>>         print 'Client %s disconnected' % client

    >>> EchoServer(('', 8000)).run()
    """

    def __init__(self, address, loglevel=logging.INFO, ssl_args=None,
                 max_join_time=2.0, backlog_size=32, **kwargs):
        """
        Constructor for a simple web socket server.

        `address` is a (hostname, port) tuple to bind the web socket to.

        `loglevel` values should be imported from the logging module.
        logging.INFO only shows server start/stop messages, logging.DEBUG shows
        clients (dis)connecting and messages being sent/received.

        `protocols` and `extensions` are passed directly to the websocket
        constructor.

        `ssl_args` is a dictionary with arguments for `websocket.enable_ssl`
        (and thus to ssl.wrap_socket).  If omitted, the server is not
        SSL-enabled. If specified, at least the dictionary keys "keyfile" and
        "certfile" must be present because these are required arguments for
        `websocket.enable_ssl` for a server socket.

        `max_join_time` is the maximum time (in seconds) to wait for client
        responses after sending CLOSE frames, it defaults to 2 seconds.

        `backlog_size` is directly passed to `websocket.listen`.
        """
        logging.basicConfig(level=loglevel,
                format='%(asctime)s: %(levelname)s: %(message)s',
                datefmt='%H:%M:%S')

        scheme = 'wss' if ssl_args else 'ws'
        hostname, port = address
        logging.info('Starting server at %s://%s:%d', scheme, hostname, port)

        self.sock = websocket(**kwargs)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        if ssl_args:
            self.sock.enable_ssl(server_side=True, **ssl_args)

        self.sock.bind(address)
        self.sock.listen(backlog_size)

        self.max_join_time = max_join_time

    def run(self):
        self.clients = []
        self.client_threads = []

        while True:
            try:
                sock, address = self.sock.accept()

                client = Client(self, sock)
                self.clients.append(client)
                logging.debug('Registered client %s', client)

                thread = Thread(target=client.receive_forever)
                thread.daemon = True
                thread.start()
                self.client_threads.append(thread)
            except SSLError as e:
                logging.error('SSL error: %s', e)
            except HandshakeError as e:
                logging.error('Invalid request: %s', e.message)
            except KeyboardInterrupt:
                logging.info('Received interrupt, stopping server...')
                break
            except Exception as e:
                logging.error(format_exc(e))

        self.quit_gracefully()

    def quit_gracefully(self):
        # Send a CLOSE frame so that the client connection will receive a
        # response CLOSE frame
        for client in self.clients:
            client.send_close_frame()

        # Wait for the CLOSE frames to be received. Wait for all threads in one
        # loop instead of joining separately, so that timeouts are not
        # propagated
        start_time = time.time()

        while time.time() - start_time <= self.max_join_time \
                and any(t.is_alive() for t in self.client_threads):
            time.sleep(0.050)

        # Close remaining sockets, this will trigger a socket.error in the
        # receive_forever() thread, causing the Connection.onclose() handler to
        # be invoked
        for client in self.clients:
            try:
                client.sock.close()
            except socket.error:
                pass

        # Wait for the onclose() handlers to finish
        for thread in self.client_threads:
            thread.join()

    def remove_client(self, client, code, reason):
        self.clients.remove(client)
        self.onclose(client, code, reason)

    def onopen(self, client):
        return NotImplemented

    def onmessage(self, client, message):
        return NotImplemented

    def onping(self, client, payload):
        return NotImplemented

    def onpong(self, client, payload):
        return NotImplemented

    def onclose(self, client, code, reason):
        return NotImplemented

    def onerror(self, client, e):
        return NotImplemented


class Client(Connection):
    def __init__(self, server, sock):
        self.server = server
        super(Client, self).__init__(sock)

    def __str__(self):
        try:
            return '<Client at %s:%d>' % self.sock.getpeername()
        except socket.error:
            return '<Client on closed socket>'

    def send(self, message, fragment_size=None, mask=False):
        logging.debug('Sending %s to %s', message, self)
        Connection.send(self, message, fragment_size=fragment_size, mask=mask)

    def onopen(self):
        logging.debug('Opened socket to %s', self)
        self.server.onopen(self)

    def onmessage(self, message):
        logging.debug('Received %s from %s', message, self)
        self.server.onmessage(self, message)

    def onping(self, payload):
        logging.debug('Sent ping "%s" to %s', payload, self)
        self.server.onping(self, payload)

    def onpong(self, payload):
        logging.debug('Received pong "%s" from %s', payload, self)
        self.server.onpong(self, payload)

    def onclose(self, code, reason):
        msg = 'Closed socket to %s' % self

        if code is not None:
            msg += ': [%d] %s' % (code, reason)

        logging.debug(msg)
        self.server.remove_client(self, code, reason)

    def onerror(self, e):
        logging.error(format_exc(e))
        self.server.onerror(self, e)


if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    Server(('', port), loglevel=logging.DEBUG).run()
