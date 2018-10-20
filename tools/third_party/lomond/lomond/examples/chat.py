from __future__ import print_function
from __future__ import unicode_literals

import logging
logging.basicConfig(format='%(message)s', level=logging.DEBUG)

from threading import Thread

from six.moves import input
from lomond import WebSocket

def get_input(text=''):
    i = input(text)
    if isinstance(i, bytes):
        return i.decode('utf-8', errors='replace')
    return i

name = get_input("your name: ")
ws = WebSocket('wss://ws.willmcgugan.com/chat/')

def run():
    for event in ws:
        print(event)
        if event.name == 'connected':
            ws.send_text("<{} connected>".format(name))
        elif event.name == 'text':
            print(event.text)

Thread(target=run).start()

while True:
    try:
        ws.send_text("[{}] {}".format(name, get_input()))
    except KeyboardInterrupt:
        ws.close()
        break
