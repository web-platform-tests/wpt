import json
import Queue
import threading

import lomond
from lomond.persist import persist

class Client(object):
    def __init__(self, target_id, url):
        self._websocket = lomond.WebSocket(url)
        self._message_id = 0
        self._messages = Queue.Queue()
        self._locks = {}
        self._results = {}
        self._exit_event = threading.Event()

        # TODO: Decide if this value needs to be dynamic
        self.target_id = target_id

    def connect(self):
        is_ready = False

        options = {
            'exit_event': self._exit_event,
            'poll': 0.1,
            'ping_rate': 0
        }

        for event in persist(self._websocket, **options):
            print event.name
            if is_ready:
                try:
                    message = self._messages.get(False)
                    self._websocket.send_text(
                        unicode(json.dumps(message), 'utf-8')
                    )
                except Queue.Empty:
                    pass
            elif event.name == 'ready':
                is_ready = True

            if event.name == 'text':
                body = json.loads(event.text)
                if 'id' in body:
                    self._results[body['id']] = body
                    self._locks.pop(body['id']).release()

    def send(self, method, params):
        self._message_id += 1
        message_id = self._message_id
        lock = threading.Lock()
        self._locks[message_id] = lock
        lock.acquire()
        self._messages.put({
            'id': message_id,
            'method': method,
            'params': params
        })
        lock.acquire()
        result = self._results.get(message_id)
        if 'error' in result:
            raise Exception('%s - %s - %s' % (method, result['error']['message'], result['error']['data']))
        return self._results.pop(message_id)['result']

    def close(self):
        self._exit_event.set()
