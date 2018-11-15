import json
import Queue
import threading

import lomond
from lomond.persist import persist

from . import logging, Element
from errors import ConnectionError, ProtocolError, ScriptError
import action_handlers

_DEFAULT_TIMEOUT = 10 * 1000

# https://chromedevtools.github.io/devtools-protocol/tot/Runtime#type-RemoteObject
def unpack_remote_object(result):
    if result['type'] == 'undefined':
        return None

    return result['value']

class Session(object):
    def __init__(self, connection, session_id, target_id):
        self._id = session_id
        self.target_id = target_id

        self._message_id = 0
        self._messages = Queue.Queue()
        self._locks = {}
        self._results = {}
        self._timeout = _DEFAULT_TIMEOUT

        self.logger = logging.getChild('session')

        self.connection = connection
        self.mouse_position = {'x': 0, 'y': 0}

    def _on_mouse_move(self, params):
        '''The WebDriver Actions API allows mouse events to be issued relative
        to the current position of the mouse. Neither the DOM nor the Chrome
        Debugger protocol offer a method to retrieve the current mouse
        position. This class observes all commands which alter the mouse
        position and assumes that the mouse is located at the coordinates
        defined by the most recent such command.'''

        self.mouse_position['x'] = params['x']
        self.mouse_position['y'] = params['y']

    def on_event(self, message_text):
        message = json.loads(message_text)

        self.logger.debug('RECV %s' % (message,))

        if 'id' not in message:
            return

        self._results[message['id']] = message
        self._locks.pop(message['id']).release()

    def close(self):
        for message_id in self._locks.keys():
            self._results[message_id] = ConnectionError(
                'Command interrupted by closing connection'
            )
            self._locks.pop(message_id).release()

    def _send(self, method, params={}):
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
        self.connection.send(
            'Target.sendMessageToTarget', # API status: stable
            {'sessionId': self._id, 'message': json.dumps(message)}
        )

        lock.acquire()
        result = self._results.pop(message_id)

        if 'error' in result:
            raise ProtocolError(method, result['error'])

        if isinstance(result, Exception):
            raise result

        if method == 'Input.dispatchMouseEvent':
            self._on_mouse_move(params)

        return result['result']

    def close_target(self, target_id):
        return self._send(
            'Target.closeTarget', # API status: stable
            {'targetId': target_id}
        )

    def evaluate(self, source):
        result = self._send('Runtime.evaluate', { # API status: stable
            'expression': source
        })

        if 'exceptionDetails' in result:
            details = result['exceptionDetails']
            try:
                self._send('Runtime.releaseObject', { # API status: stable
                    'objectId': details['exception']['objectId']
                })
            finally:
                raise ScriptError(details)

        return result['result']

    def execute_async_script(self, source):
        '''Execute a string as JavaScript, waiting for the returned Promise (if
        any) to settle and honoring any previously-set "timeout" value.

        This method approximates the W3C Webdriver "Execute Async Script"
        command [1] using the Chrome Debugger protocol's "Runtime.evaluate"
        method [2]

        [1] https://w3c.github.io/webdriver/#execute-async-script
        [2] https://chromedevtools.github.io/devtools-protocol/tot/Runtime#method-evaluate'''

        # A wrapper between the Promise executor and the evaluated code is
        # necessary to ensure that the length of the `arguments` object is `1`
        # as guaranteed by WebDriver.
        as_expression = '''(function() {{
          return new Promise(function(resolve) {{
              return (function() {{
                  {source}
                }}(resolve));
            }});
        }}())'''.format(source=source)

        result = self._send('Runtime.evaluate', { # API status: stable
            'expression': as_expression,
            'awaitPromise': True,
            'returnByValue': True,
            'timeout': self._timeout # API status: experimental
        })

        if 'exceptionDetails' in result:
            details = result['exceptionDetails']
            try:
                self._send('Runtime.releaseObject', { # API status: stable
                    'objectId': details['exception']['objectId']
                })
            finally:
                raise ScriptError(details)

        return unpack_remote_object(result['result'])

    def execute_script(self, source):
        '''Execute a string as JavaScript, waiting for the returned Promise (if
        any) to settle and honoring any previously-set "timeout" value.

        This method approximates the W3C Webdriver "Execute Script" command [1]
        using the Chrome Debugger protocol's "Runtime.evaluate" method [2]

        [1] https://w3c.github.io/webdriver/#execute-script
        [2] https://chromedevtools.github.io/devtools-protocol/tot/Runtime#method-evaluate'''

        as_expression = '''(function() {{
          return Promise.resolve()
            .then(function() {{
                {source}
              }});
        }}())'''.format(source=source)

        result = self._send('Runtime.evaluate', { # API status: stable
            'expression': as_expression,
            # This parameter is set to `true` in all cases to mimic the
            # behavior of the "Execute Script" command in WebDriver
            # https://w3c.github.io/webdriver/#execute-script
            'awaitPromise': True,
            'returnByValue': True,
            'timeout': self._timeout # API status: experimental
        })

        if 'exceptionDetails' in result:
            details = result['exceptionDetails']
            try:
                self._send('Runtime.releaseObject', { # API status: stable
                    'objectId': details['exception']['objectId']
                })
            finally:
                raise ScriptError(details)

        return unpack_remote_object(result['result'])

    def targets(self):
        return self._send('Target.getTargets')['targetInfos'] # API status: stable

    def navigate(self, url):
        return self._send('Page.navigate', {'url': url}) # API status: stable

    def perform(self, actions):
        # Restructure the WebDriver actions object into a two-dimensional list.
        # Each element is a list of actions for a given device.
        two_dimensional = [
            [
                {
                    'type': track['type'],
                    'parameters': track.get('parameters'),
                    'action': action
                } for action in track['actions']
            ] for track in actions['actions']
        ]

        # Transpose the actions. Each element is a list of actions for a
        # distinct "tick."
        ticks = list(zip(*two_dimensional))

        exceptions = Queue.Queue()

        def create_thread(action, exceptions):
            handler = getattr(action_handlers, action['type'])
            def target():
                try:
                    handler(self, action)
                except Exception as e:
                    exceptions.put(e)

            return threading.Thread(target=target)

        for tick in ticks:
            threads = [
                create_thread(action['action'], exceptions) for action in tick
            ]

            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()

            try:
                thread_exception = exceptions.get(block=False)
            except Queue.Empty:
                pass
            else:
                raise thread_exception

    def query_selector_all(self, selector):
        document_object = self.evaluate(
            'Array.from(document.querySelectorAll(%s))' % json.dumps(selector)
        )
        props = self._send('Runtime.getProperties', { # API status: stable
            'objectId': document_object['objectId'],
            'ownProperties': True
        })['result']
        self._send('Runtime.releaseObject', { # API status: stable
            'objectId': document_object['objectId']
        })

        by_name = {}
        for prop in props:
            by_name[prop['name']] = prop
        node_ids = [None] * by_name['length']['value']['value']
        for index in xrange(len(node_ids)):
            node_ids[index] = by_name[str(index)]['value']['objectId']

        return [Element(self, node_id) for node_id in node_ids]

    def screenshot(self):
        return self._send('Page.captureScreenshot', {}) # API status: stable

    def set_window_bounds(self, bounds):
        result = self._send(
            'Browser.getWindowForTarget', # API status: experimental
            {'targetId': self.target_id}
        )
        return self._send(
            'Browser.setWindowBounds', # API status: experimental
            {
                'windowId': result['windowId'],
                'bounds': bounds
            }
        )

    def set_script_timeout(self, value):
        '''Define a duration to wait before considering an expression failed

        :param value: duration in milliseconds'''
        self._timeout = value
