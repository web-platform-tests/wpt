#!/usr/bin/env python
import sys
import socket
from os.path import abspath, dirname

basepath = abspath(dirname(abspath(__file__)) + '/..')
sys.path.insert(0, basepath)

from websocket import websocket
from connection import Connection
from message import TextMessage
from errors import SocketClosed


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print >> sys.stderr, 'Usage: python %s HOST PORT' % sys.argv[0]
        sys.exit(1)

    host = sys.argv[1]
    port = int(sys.argv[2])

    sock = websocket()
    sock.connect((host, port))
    sock.settimeout(1.0)
    conn = Connection(sock)

    try:
        try:
            while True:
                msg = TextMessage(raw_input())
                print 'send:', msg
                conn.send(msg)

                try:
                    print 'recv:', conn.recv()
                except socket.timeout:
                    print 'no response'
        except EOFError:
            conn.close()
    except SocketClosed as e:
        if e.initialized:
            print 'closed connection'
        else:
            print 'other side closed connection'
