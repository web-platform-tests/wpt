import socket
from select import epoll, EPOLLIN, EPOLLOUT, EPOLLHUP
from traceback import format_exc
import logging

from connection import Connection
from frame import ControlFrame, OPCODE_PING, OPCODE_CONTINUATION, \
                  create_close_frame
from server import Server, Client
from errors import HandshakeError, SocketClosed


class AsyncConnection(Connection):
    def __init__(self, sock):
        sock.recv_callback = self.contruct_message
        sock.recv_close_callback = self.onclose
        self.recvbuf = []
        Connection.__init__(self, sock)

    def contruct_message(self, frame):
        if isinstance(frame, ControlFrame):
            self.handle_control_frame(frame)
            return

        self.recvbuf.append(frame)

        if frame.final:
            message = self.concat_fragments(self.recvbuf)
            self.recvbuf = []
            self.onmessage(message)
        elif len(self.recvbuf) > 1 and frame.opcode != OPCODE_CONTINUATION:
            raise ValueError('expected continuation/control frame, got %s '
                             'instead' % frame)

    def send(self, message, fragment_size=None, mask=False):
        frames = list(self.message_to_frames(message, fragment_size, mask))

        for frame in frames[:-1]:
            self.sock.queue_send(frame)

        self.sock.queue_send(frames[-1], lambda: self.onsent(message))

    def send_frame(self, frame, callback):
        self.sock.queue_send(frame, callback)

    def do_async_send(self):
        self.execute_controlled(self.sock.do_async_send)

    def do_async_recv(self, bufsize):
        self.execute_controlled(self.sock.do_async_recv, bufsize)

    def execute_controlled(self, func, *args, **kwargs):
        try:
            func(*args, **kwargs)
        except (KeyboardInterrupt, SystemExit, SocketClosed):
            raise
        except Exception as e:
            self.onerror(e)
            self.onclose(None, 'error: %s' % e)

            try:
                self.sock.close()
            except socket.error:
                pass

            raise e

    def send_close_frame(self, code, reason):
        self.sock.queue_send(create_close_frame(code, reason),
                             self.shutdown_write)
        self.close_frame_sent = True

    def close(self, code=None, reason=''):
        self.send_close_frame(code, reason)

    def send_ping(self, payload=''):
        self.sock.queue_send(ControlFrame(OPCODE_PING, payload),
                             lambda: self.onping(payload))
        self.ping_payload = payload
        self.ping_sent = True

    def onsent(self, message):
        """
        Called after a message has been written.
        """
        return NotImplemented


class AsyncServer(Server):
    def __init__(self, *args, **kwargs):
        Server.__init__(self, *args, **kwargs)

        self.recvbuf_size = kwargs.get('recvbuf_size', 2048)

        self.epoll = epoll()
        self.epoll.register(self.sock.fileno(), EPOLLIN)
        self.conns = {}

    @property
    def clients(self):
        return self.conns.values()

    def remove_client(self, client, code, reason):
        self.epoll.unregister(client.fno)
        del self.conns[client.fno]
        self.onclose(client, code, reason)

    def handle_events(self):
        for fileno, event in self.epoll.poll(1):
            if fileno == self.sock.fileno():
                try:
                    sock, addr = self.sock.accept()
                except HandshakeError as e:
                    logging.error('Invalid request: %s', e.message)
                    continue

                client = AsyncClient(self, sock)
                client.fno = sock.fileno()
                sock.setblocking(0)
                self.epoll.register(client.fno, EPOLLIN)
                self.conns[client.fno] = client
                logging.debug('Registered client %s', client)

            elif event & EPOLLHUP:
                self.epoll.unregister(fileno)
                del self.conns[fileno]

            else:
                conn = self.conns[fileno]

                try:
                    if event & EPOLLOUT:
                        conn.do_async_send()
                    elif event & EPOLLIN:
                        conn.do_async_recv(self.recvbuf_size)
                except (KeyboardInterrupt, SystemExit):
                    raise
                except SocketClosed:
                    continue
                except Exception as e:
                    logging.error(format_exc(e).rstrip())
                    continue

                self.update_mask(conn)

    def run(self):
        try:
            while True:
                self.handle_events()
        except (KeyboardInterrupt, SystemExit):
            logging.info('Received interrupt, stopping server...')
        finally:
            self.epoll.unregister(self.sock.fileno())
            self.epoll.close()
            self.sock.close()

    def update_mask(self, conn):
        mask = 0

        if conn.sock.can_send():
            mask |= EPOLLOUT

        if conn.sock.can_recv():
            mask |= EPOLLIN

        self.epoll.modify(conn.sock.fileno(), mask)

    def onsent(self, client, message):
        return NotImplemented


class AsyncClient(Client, AsyncConnection):
    def __init__(self, server, sock):
        self.server = server
        AsyncConnection.__init__(self, sock)

    def send(self, message, fragment_size=None, mask=False):
        logging.debug('Enqueueing %s to %s', message, self)
        AsyncConnection.send(self, message, fragment_size, mask)
        self.server.update_mask(self)

    def onsent(self, message):
        logging.debug('Finished sending %s to %s', message, self)
        self.server.onsent(self, message)


if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    AsyncServer(('', port), loglevel=logging.DEBUG).run()
