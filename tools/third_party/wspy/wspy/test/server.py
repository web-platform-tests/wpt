#!/usr/bin/env python
import sys
import logging
from os.path import abspath, dirname

basepath = abspath(dirname(abspath(__file__)) + '/..')
sys.path.insert(0, basepath)

from async import AsyncServer
from deflate_message import DeflateMessage
from deflate_frame import DeflateFrame


class EchoServer(AsyncServer):
    def onmessage(self, client, message):
        client.send(message)


if __name__ == '__main__':
    EchoServer(('localhost', 8000),
               extensions=[DeflateMessage(), DeflateFrame()],
               #ssl_args=dict(keyfile='cert.pem', certfile='cert.pem'),
               loglevel=logging.DEBUG).run()
