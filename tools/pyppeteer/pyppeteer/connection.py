import json
import Queue
import threading

import lomond
from lomond.persist import persist

from . import logging, Session
from errors import ConnectionError, ProtocolError, PyppeteerError

class Connection(object):
    def __init__(self, url):
        self._websocket = lomond.WebSocket(url)
        self._message_id = 0
        self._messages = Queue.Queue()
        self._locks = {}
        self._results = {}
        self._open_event = threading.Event()
        self._exit_event = threading.Event()
        self._polling_thread = None
        # A mapping from "targetId" to pyppeteer.Session instances
        self._sessions = {}

        self.logger = logging.getChild('connection')

        # In cases where a behavior can be achieved via either a deprecated API
        # or an experimental API (e.g. disabling TLS certificate security
        # checks) this switch controls which of the two APIs will be used.
        self.prefer_experimental = True

    def _handle_event(self, message):
        method = message.get('method')

        if (method == 'Security.certificateError' and # API status: deprecated
            not self.prefer_experimental):
            def target(connection, message):
                connection.send(
                    'Security.handleCertificateError', # API status: deprecated
                    {
                        'eventId': message['params']['eventId'],
                        'action': 'continue'
                    }
                )
            threading.Thread(target=target, args=(self, message)).start()
        elif method == 'Target.receivedMessageFromTarget':
            session = self._sessions[message['params']['targetId']]
            session.on_event(message['params']['message'])
        elif method == 'Target.detachedFromTarget':
            self._sessions.pop(message['params']['targetId'])
        elif method == 'Inspector.detached':
            self.close()

    def _handle_method_result(self, message):
        self._results[message['id']] = message
        self._locks.pop(message['id']).release()

    def _poll(self):
        is_ready = False

        options = {
            'exit_event': self._exit_event,
            'poll': 0.01,
            'ping_rate': 0
        }

        for socket_event in persist(self._websocket, **options):
            if self._polling_thread is None:
                continue

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
                self._open_event.set()
                is_ready = True

            if socket_event.name == 'text':
                message = json.loads(socket_event.text)

                self.logger.debug('RECV %s' % (message,))

                if 'id' in message:
                    self._handle_method_result(message)
                else:
                    self._handle_event(message)

        self._open_event.clear()

    def close(self):
        if self._polling_thread is None:
            raise PyppeteerError('Connection is not open')

        self.logger.info('closing')

        for message_id in self._locks.keys():
            self._results[message_id] = ConnectionError(
                'Command interrupted by closing connection'
            )
            self._locks.pop(message_id).release()

        for target_id in self._sessions.keys():
            session = self._sessions.pop(target_id)
            session.close()

        self._sessions.clear()
        self._exit_event.set()
        self._websocket.close()
        if threading.current_thread() != self._polling_thread:
            self._polling_thread.join()
        self._polling_thread = None
        self.logger.info('closed')

    def open(self):
        if self._polling_thread:
            raise PypetteerError('Connection is already open')

        self.logger.info('opening')
        self._polling_thread = threading.Thread(target=lambda: self._poll())
        self._polling_thread.start()
        self._open_event.wait()
        self.logger.info('opened')

        if self.prefer_experimental:
            self.send(
                'Security.setIgnoreCertificateErrors', # API status: experimental
                {'ignore': True}
            )
        else:
            self.send('Security.enable', {}) # API status: stable
            self.send(
                'Security.setOverrideCertificateErrors', # API status: deprecated
                {'override': True}
            )

    def create_session(self, target_id):
        if target_id not in self._sessions:
            result = self.send(
                'Target.attachToTarget', # API status: stable
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
            raise ProtocolError(method, result['error'])
        if isinstance(result, Exception):
            raise result

        return result['result']
