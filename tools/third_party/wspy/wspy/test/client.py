#!/usr/bin/env python
import sys
import ssl
from os.path import abspath, dirname

basepath = abspath(dirname(abspath(__file__)) + '/..')
sys.path.insert(0, basepath)

from websocket import websocket
from connection import Connection
from message import TextMessage

ADDR = ('localhost', 8000)


class EchoClient(Connection):
    def onopen(self):
        print 'Connection established, sending "foo"'
        self.send(TextMessage('foo'))

    def onmessage(self, msg):
        print 'Received', msg
        self.close(None, 'response received')

    def onerror(self, e):
        print 'Error:', e

    def onclose(self, code, reason):
        print 'Connection closed'


if __name__ == '__main__':
    secure = '-s' in sys.argv[1:]
    scheme = 'wss' if secure else 'ws'
    print 'Connecting to %s://%s' % (scheme, '%s:%d' % ADDR)
    sock = websocket()

    if secure:
        sock.enable_ssl(ca_certs='cert.pem', cert_reqs=ssl.CERT_REQUIRED)

    sock.connect(ADDR)
    EchoClient(sock).receive_forever()
