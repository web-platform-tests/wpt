import json
import socket
import threading

from six.moves import urllib
import wspy

from pyppeteer import logging, Session
from pyppeteer.errors import ConnectionError, ProtocolError

class Connection(object):
    def __init__(self, url):
        url_parts = urllib.parse.urlparse(url)
        netloc = url_parts.netloc.split(':')
        self._host = netloc[0]
        if len(netloc) > 1:
            self._port = int(netloc[1])
        elif url_parts.scheme == 'https':
            self._port = 443
        else:
            self._port = 80

        self._websocket = wspy.websocket(location=url_parts.path)
        self._message_id = 0
        self._locks = {}
        self._results = {}
        self._open_event = threading.Event()
        self._exit_event = threading.Event()
        self._reading_thread = None
        # A mapping from "targetId" to pyppeteer.Session instances
        self._sessions = {}

        self.logger = logging.getChild('connection')
        self.logger.debug('Hello there')

        # In cases where a behavior can be achieved via either a deprecated API
        # or an experimental API (e.g. disabling TLS certificate security
        # checks) this switch controls which of the two APIs will be used.
        self.prefer_experimental = True

    def _handle_event(self, message):
        method = message.get('method')

        if (method == 'Security.certificateError' and  # API status: deprecated
            not self.prefer_experimental):
            def target(connection, message):
                connection.send(
                    'Security.handleCertificateError',  # API status: deprecated
                    {
                        'eventId': message['params']['eventId'],
                        'action': 'continue'
                    }
                )
            threading.Thread(target=target, args=(self, message)).start()
        elif method == 'Target.receivedMessageFromTarget':
            session = self._sessions.get(message['params']['targetId'])
            if session:
                session.on_event(message['params']['message'])
        elif method == 'Target.detachedFromTarget':
            self._sessions.pop(message['params']['targetId'])
        elif method == 'Inspector.detached':
            self.close()

    def _handle_method_result(self, message):
        self._results[message['id']] = message
        self._locks.pop(message['id']).release()

    def _read_forever(self):
        self._websocket.connect((self._host, self._port))
        self._open_event.set()

        while True:
            try:
                message = json.loads(self._websocket.recv().payload)
            except socket.error:
                if self._exit_event.is_set():
                    return

                self.close()

                raise

            self.logger.debug('RECV %s' % (message,))

            if 'id' in message:
                self._handle_method_result(message)
            else:
                self._handle_event(message)

        self._open_event.clear()

    def close(self):
        if self._reading_thread is None:
            raise ConnectionError('Connection is not open')

        self.logger.info('closing')

        for message_id in list(self._locks.keys()):
            self._results[message_id] = ConnectionError(
                'Command interrupted by closing connection'
            )
            self._locks.pop(message_id).release()

        for target_id in list(self._sessions.keys()):
            session = self._sessions.pop(target_id)
            session.close()

        self._sessions.clear()
        self._exit_event.set()
        self._websocket.shutdown(socket.SHUT_RDWR)
        self._websocket.close()
        if threading.current_thread() != self._reading_thread:
            self._reading_thread.join()
        self._reading_thread = None
        self.logger.info('closed')

    def open(self):
        if self._reading_thread:
            raise ConnectionError('Connection is already open')

        self.logger.info('opening')
        self._reading_thread = threading.Thread(target=lambda: self._read_forever())
        self._reading_thread.start()
        self._open_event.wait()
        self.logger.info('opened')

        if self.prefer_experimental:
            self.send(
                'Security.setIgnoreCertificateErrors',  # API status: experimental
                {'ignore': True}
            )
        else:
            self.send('Security.enable', {})  # API status: stable
            self.send(
                'Security.setOverrideCertificateErrors',  # API status: deprecated
                {'override': True}
            )

    def create_session(self, target_id):
        if target_id not in self._sessions:
            result = self.send(
                'Target.attachToTarget',  # API status: stable
                {'targetId': target_id}
            )

            self._sessions[target_id] = Session(
                self, result['sessionId'], target_id
            )
            self._sessions[target_id]._send('Page.enable')  # API status: stable

        return self._sessions[target_id]

    def send(self, method, params={}):
        if self._reading_thread is None:
            raise ConnectionError('Connection is not open')

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

        self.logger.debug('SEND %s' % (message,))
        self._websocket.send(wspy.Frame(
            wspy.OPCODE_TEXT, json.dumps(message), mask=True
        ))

        lock.acquire()
        result = self._results.pop(message_id)

        if 'error' in result:
            raise ProtocolError(method, result['error'])
        if isinstance(result, Exception):
            raise result

        return result['result']
