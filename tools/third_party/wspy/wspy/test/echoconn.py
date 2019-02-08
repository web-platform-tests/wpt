#!/usr/bin/env python
import socket
import wspy

class EchoConnection(wspy.Connection):
    def onopen(self):
        print 'Connection opened at %s:%d' % self.sock.getpeername()

    def onmessage(self, message):
        print 'Received message "%s"' % message.payload
        self.send(wspy.TextMessage(message.payload))

    def onclose(self, code, reason):
        print 'Connection closed'

server = wspy.websocket()
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('', 8000))
server.listen(5)

try:
    while True:
        client, addr = server.accept()
        EchoConnection(client).receive_forever()
except KeyboardInterrupt:
    pass
