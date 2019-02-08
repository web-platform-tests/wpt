import socket

from frame import ControlFrame, OPCODE_CLOSE, OPCODE_PING, OPCODE_PONG, \
                  OPCODE_CONTINUATION, create_close_frame
from message import create_message
from errors import SocketClosed, PingError


class Connection(object):
    """
    A `Connection` uses a `websocket` instance to send and receive (optionally
    fragmented) messages, which are `Message` instances. Control frames are
    handled automatically in the way specified by RFC 6455.

    To use the `Connection` class, it should be extended and the extending
    class should implement the on*() event handlers.

    Example of an echo server (sends back what it receives):
    >>> import wspy

    >>> class EchoConnection(wspy.Connection):
    >>>     def onopen(self):
    >>>         print 'Connection opened at %s:%d' % self.sock.getpeername()

    >>>     def onmessage(self, message):
    >>>         print 'Received message "%s"' % message.payload
    >>>         self.send(wspy.TextMessage(message.payload))

    >>>     def onclose(self, code, reason):
    >>>         print 'Connection closed'

    >>> server = wspy.websocket()
    >>> server.bind(('', 8000))
    >>> server.listen()

    >>> while True:
    >>>     client, addr = server.accept()
    >>>     EchoConnection(client).receive_forever()
    """
    def __init__(self, sock):
        """
        `sock` is a websocket instance which has completed its handshake.
        """
        self.sock = sock

        self.close_frame_sent = False
        self.close_frame_received = False
        self.ping_sent = False
        self.ping_payload = None

        self.hooks_send = []
        self.hooks_recv = []

        self.onopen()

    def message_to_frames(self, message, fragment_size=None, mask=False):
        frame = self.sock.apply_send_hooks(message.frame(mask=mask), True)

        if fragment_size is None:
            yield frame
        else:
            for fragment in frame.fragment(fragment_size):
                yield fragment

    def send(self, message, fragment_size=None, mask=False):
        """
        Send a message. If `fragment_size` is specified, the message is
        fragmented into multiple frames whose payload size does not extend
        `fragment_size`.
        """
        for frame in self.message_to_frames(message, fragment_size, mask):
            self.send_frame(frame)

    def send_frame(self, frame, callback=None):
        self.sock.send(frame)

        if callback:
            callback()

    def recv(self):
        """
        Receive a message. A message may consist of multiple (ordered) data
        frames. A control frame may be delivered at any time, also when
        expecting the next continuation frame of a fragmented message. These
        control frames are handled immediately by handle_control_frame().
        """
        fragments = []

        while not len(fragments) or not fragments[-1].final:
            frame = self.sock.recv()

            if isinstance(frame, ControlFrame):
                self.handle_control_frame(frame)
            elif len(fragments) > 0 and frame.opcode != OPCODE_CONTINUATION:
                raise ValueError('expected continuation/control frame, got %s '
                                 'instead' % frame)
            else:
                fragments.append(frame)

        return self.concat_fragments(fragments)

    def concat_fragments(self, fragments):
        frame = fragments[0]

        for f in fragments[1:]:
            frame.payload += f.payload

        frame.final = True
        frame = self.sock.apply_recv_hooks(frame, True)
        return create_message(frame.opcode, frame.payload)

    def handle_control_frame(self, frame):
        """
        Handle a control frame as defined by RFC 6455.
        """
        if frame.opcode == OPCODE_CLOSE:
            self.close_frame_received = True
            code, reason = frame.unpack_close()

            if self.close_frame_sent:
                self.onclose(code, reason)
                self.sock.close()
                raise SocketClosed(True)
            else:
                self.close_params = (code, reason)
                self.send_close_frame(code, reason)

        elif frame.opcode == OPCODE_PING:
            # Respond with a pong message with identical payload
            self.send_frame(ControlFrame(OPCODE_PONG, frame.payload))

        elif frame.opcode == OPCODE_PONG:
            # Assert that the PONG payload is identical to that of the PING
            if not self.ping_sent:
                raise PingError('received PONG while no PING was sent')

            self.ping_sent = False

            if frame.payload != self.ping_payload:
                raise PingError('received PONG with invalid payload')

            self.ping_payload = None
            self.onpong(frame.payload)

    def receive_forever(self):
        """
        Receive and handle messages in an endless loop. A message may consist
        of multiple data frames, but this is not visible for onmessage().
        Control messages (or control frames) are handled automatically.
        """
        while True:
            try:
                self.onmessage(self.recv())
            except (KeyboardInterrupt, SystemExit, SocketClosed):
                break
            except Exception as e:
                self.onerror(e)
                self.onclose(None, 'error: %s' % e)

                try:
                    self.sock.close()
                except socket.error:
                    pass

                raise e

    def send_ping(self, payload=''):
        """
        Send a PING control frame with an optional payload.
        """
        self.send_frame(ControlFrame(OPCODE_PING, payload),
                        lambda: self.onping(payload))
        self.ping_payload = payload
        self.ping_sent = True

    def send_close_frame(self, code, reason):
        self.send_frame(create_close_frame(code, reason))
        self.close_frame_sent = True
        self.shutdown_write()

    def shutdown_write(self):
        if self.close_frame_received:
            self.onclose(*self.close_params)
            self.sock.close()
            raise SocketClosed(False)
        else:
            self.sock.shutdown(socket.SHUT_WR)

    def close(self, code=None, reason=''):
        """
        Close the socket by sending a CLOSE frame and waiting for a response
        close message, unless such a message has already been received earlier
        (prior to calling this function, for example). The onclose() handler is
        called after the response has been received, but before the socket is
        actually closed.
        """
        self.send_close_frame(code, reason)

        frame = self.sock.recv()

        if frame.opcode != OPCODE_CLOSE:
            raise ValueError('expected CLOSE frame, got %s' % frame)

        self.handle_control_frame(frame)

    def onopen(self):
        """
        Called after the connection is initialized.
        """
        return NotImplemented

    def onmessage(self, message):
        """
        Called when a message is received. `message` is a Message object, which
        can be constructed from a single frame or multiple fragmented frames.
        """
        return NotImplemented

    def onping(self, payload):
        """
        Called after a PING control frame has been sent. This handler could be
        used to start a timeout handler for a PONG frame that is not received
        in time.
        """
        return NotImplemented

    def onpong(self, payload):
        """
        Called when a PONG control frame is received.
        """
        return NotImplemented

    def onclose(self, code, reason):
        """
        Called when the socket is closed by either end point.
        """
        return NotImplemented

    def onerror(self, e):
        """
        Handle a raised exception.
        """
        return NotImplemented
