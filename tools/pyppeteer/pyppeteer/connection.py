import json
import socket
import threading
import time

from six.moves import urllib
import wspy

from pyppeteer import logging, Session, timeout_lock
from pyppeteer.errors import ConnectionError, ProtocolError, PyppeteerError

_CLOSE_TARGET_TIMEOUT = 20
_CLOSE_TARGET_POLL_INTERVAL = 5./100
_MESSAGE_TIMEOUT = 60

class Connection(object):
    def __init__(self, http_port, ws_url):
        self._http_port = http_port
        url_parts = urllib.parse.urlparse(ws_url)
        netloc = url_parts.netloc.split(':')
        self._ws_host = netloc[0]
        self._ws_port = int(netloc[1])

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
        self._websocket.connect((self._ws_host, self._ws_port))
        self._open_event.set()

        while True:
            try:
                message = json.loads(self._websocket.recv().payload)
            except Exception as e:
                if isinstance(e, socket.error) and self._exit_event.is_set():
                    return

                self.close()

                raise

            self.logger.debug('RECV %s' % (message,))

            if 'id' in message:
                self._handle_method_result(message)
            else:
                self._handle_event(message)

    def is_open(self):
        return bool(self._reading_thread)

    def close(self):
        if not self.is_open():
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
        self._open_event.clear()
        self._exit_event.set()
        self._websocket.shutdown(socket.SHUT_RDWR)
        self._websocket.close()
        if threading.current_thread() != self._reading_thread:
            self._reading_thread.join()
        self._reading_thread = None
        self.logger.info('closed')

    def open(self):
        if self.is_open():
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

            # A navigation may be in progress as a result of opening the
            # browser. Cancel any such navigation prior to enabling page domain
            # notifications. Version 1.3 of the Chrome DevTools Protocol
            # implements a method named `Page.stopLoading`, but as of
            # 2019-02-22, that version is labeled as a release candidate.
            #self._sessions[target_id].evaluate('''
            #  try {
            #    stop();
            #  } catch (_) {}
            #''')
            self._sessions[target_id]._send('Page.enable')  # API status: stable

        return self._sessions[target_id]

    def send(self, method, params={}):
        if not self.is_open():
            raise ConnectionError('Connection is not open')

        self._message_id += 1
        message_id = self._message_id
        lock = timeout_lock.TimeoutLock()
        self._locks[message_id] = lock
        lock.acquire(0)

        message = {
            'id': message_id,
            'method': method,
            'params': params
        }

        self.logger.debug('SEND %s' % (message,))
        self._websocket.send(wspy.Frame(
            wspy.OPCODE_TEXT, json.dumps(message), mask=True
        ))

        try:
            # If Chrome's "render" sub-process crashes, both the parent process
            # and the DevTools WebSocket will remain alive, but no further
            # messages will be sent. In the absence of a method to conclusively
            # detect this event, assume it has occurred whenever no response is
            # received after an extended duration.
            lock.acquire(_MESSAGE_TIMEOUT)
        except Exception:
            self._locks.pop(message_id)
            raise
        result = self._results.pop(message_id)

        if 'error' in result:
            raise ProtocolError(method, result['error'])
        if isinstance(result, Exception):
            raise result

        return result['result']

    def targets(self):
        return self.send('Target.getTargets')['targetInfos']
        return json.load(urllib.request.urlopen(
            'http://localhost:{}/json'.format(self._http_port)
        ))

    def close_target(self, target_id):
        response = urllib.request.urlopen(
            'http://localhost:{}/json/close/{}'.format(
                self._http_port, target_id
            )
        )

        # > For valid targets, the response is 200: "Target is closing". If the
        # > target is invalid, the response is 404: "No such target id:
        # > {targetId}"
        if response.getcode() != 200:
            raise PyppeteerError(
                'Unable to close target "{}"'.format(target_id)
            )

        start = time.time()

        while time.time() - start < _CLOSE_TARGET_TIMEOUT:
            ids = [target['targetId'] for target in self.targets()]

            if target_id not in ids:
                return

            time.sleep(_CLOSE_TARGET_POLL_INTERVAL)

        raise PyppeteerError(
            'Unable to close target "{}" after {} seconds'.format(
                target_id, _CLOSE_TARGET_TIMEOUT
            )
        )
