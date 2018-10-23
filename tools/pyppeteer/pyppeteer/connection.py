import json
import Queue
import threading

import lomond
from lomond.persist import persist

from . import logging, Session

class ConnectionError(Exception):
    def __init__(self, method, error_details):
        message = error_details['message']
        data = error_details['data']

        super(ConnectionError, self).__init__(
            '%s - %s - %s' % (method, message, data)
        )

class Connection(object):
    def __init__(self, url):
        self._websocket = lomond.WebSocket(url)
        self._message_id = 0
        self._messages = Queue.Queue()
        self._locks = {}
        self._results = {}
        self._exit_event = threading.Event()
        # A mapping from "targetId" to pyppeteer.Session instances
        self._sessions = {}

        self.logger = logging.getChild('connection')

    def _handle_event(self, message):
        session = self._sessions[message['params']['targetId']]
        session.on_event(message['params']['message'])

    def _handle_method_result(self, message):
        self._results[message['id']] = message
        self._locks.pop(message['id']).release()

    def close(self):
        self.logger.info('closing')
        self._sessions.clear()
        self._exit_event.set()

    def open(self):
        self.logger.info('opening')
        is_ready = False

        options = {
            'exit_event': self._exit_event,
            'poll': 0.1,
            'ping_rate': 0
        }

        for socket_event in persist(self._websocket, **options):
            if is_ready:
                try:
                    message = self._messages.get(False)
                    self.logger.debug('SEND %s' % (message,))
                    self._websocket.send_text(
                        unicode(json.dumps(message), 'utf-8')
                    )
                except Queue.Empty:
                    pass
            elif socket_event.name == 'ready':
                self.logger.info('opened')
                is_ready = True

            if socket_event.name == 'text':
                message = json.loads(socket_event.text)

                self.logger.debug('RECV %s' % (message,))

                if 'id' in message:
                    self._handle_method_result(message)
                elif message.get('method') == 'Target.receivedMessageFromTarget':
                    self._handle_event(message)

        self.logger.info('closed')

    def create_session(self, target_id):
        if target_id not in self._sessions:
            result = self.send(
                'Target.attachToTarget',
                {'targetId': target_id}
            )

            self._sessions[target_id] = Session(
                self, result['sessionId'], target_id
            )

        return self._sessions[target_id]

    def send(self, method, params={}):
        self._message_id += 1
        message_id = self._message_id
        lock = threading.Lock()
        self._locks[message_id] = lock
        lock.acquire()

        message = {
            'id': message_id,
            'method': method,
            'params': params
        }
        self._messages.put(message)

        lock.acquire()
        result = self._results.pop(message_id)

        if 'error' in result:
            raise ConnectionError(method, result['error'])

        return result['result']
