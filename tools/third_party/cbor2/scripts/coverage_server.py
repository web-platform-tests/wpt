# A trivial script for serving lcov's HTML coverage output

import os
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler
from signal import pause
from socketserver import TCPServer
from threading import Thread


class Httpd(Thread):
    def __init__(self):
        super().__init__()
        self.server = TCPServer(("127.0.0.1", 8000), SimpleHTTPRequestHandler)
        self.start()

    def run(self):
        self.server.serve_forever()


os.chdir(os.path.dirname(__file__) + "/../coverage/")
httpd = Httpd()
webbrowser.open_new_tab("http://localhost:8000/")
try:
    pause()
finally:
    httpd.server.shutdown()
    sys.exit(0)
