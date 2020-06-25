import time

from six import PY3

def main(request, response):
    headers = [(b'Content-Type', b'application/javascript'),
               (b'Cache-Control', b'max-age=0')]
    # Add timestamp to the worker so update() finds a new worker every time.
    body = u'''
// %s
importScripts('update-during-installation-worker.js');
    '''.strip() % (time.perf_counter() if PY3 else time.clock())
    return headers, body
