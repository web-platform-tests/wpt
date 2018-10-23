import json
import Queue
import threading

import lomond
from lomond.persist import persist

from . import logging

_DEFAULT_TIMEOUT = 10 * 1000

# https://chromedevtools.github.io/devtools-protocol/tot/Runtime#type-RemoteObject
def unpack_remote_object(result):
    if result['type'] == 'undefined':
        return None

    return result['value']

# https://chromedevtools.github.io/devtools-protocol/tot/Runtime#type-ExceptionDetails
class ScriptError(Exception):
    def __init__(self, exception_details):
        super(ScriptError, self).__init__(
            '{lineNumber}:{columnNumber} {text}'.format(**exception_details)
        )

class SessionError(Exception):
    def __init__(self, method, error_details):
        message = error_details['message']
        data = error_details['data']

        super(SessionError, self).__init__(
            '%s - %s - %s' % (method, message, data)
        )

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

    def on_event(self, message_text):
        message = json.loads(message_text)

        self.logger.debug('RECV %s' % (message,))

        self._results[message['id']] = message
        self._locks.pop(message['id']).release()

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
            'Target.sendMessageToTarget',
            {'sessionId': self._id, 'message': json.dumps(message)}
        )

        lock.acquire()
        result = self._results.pop(message_id)

        if 'error' in result:
            raise SessionError(method, result['error'])

        return result['result']

    def close_target(self, target_id):
        return self._send('Target.closeTarget', {'targetId': target_id})

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

        result = self._send('Runtime.evaluate', {
            'expression': as_expression,
            'awaitPromise': True,
            'returnByValue': True,
            'timeout': self._timeout
        })

        if 'exceptionDetails' in result:
            raise ScriptError(result['exceptionDetails'])

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

        result = self._send('Runtime.evaluate', {
            'expression': as_expression,
            # This parameter is set to `true` in all cases to mimic the
            # behavior of the "Execute Script" command in WebDriver
            # https://w3c.github.io/webdriver/#execute-script
            'awaitPromise': True,
            'returnByValue': True,
            'timeout': self._timeout
        })

        if 'exceptionDetails' in result:
            raise ScriptError(result['exceptionDetails'])

        return unpack_remote_object(result['result'])

    def targets(self):
        return self._send('Target.getTargets')['targetInfos']

    def navigate(self, url):
        return self._send('Page.navigate', {'url': url})

    def screenshot(self):
        return self._send('Page.captureScreenshot', {})

    def set_window_bounds(self, bounds):
        result = self._send(
            'Browser.getWindowForTarget',
            {'targetId': self.target_id}
        )
        return self._send(
            'Browser.setWindowBounds',
            {
                'windowId': result['windowId'],
                'bounds': bounds
            }
        )

    def set_script_timeout(self, value):
        '''Define a duration to wait before considering an expression failed

        :param value: duration in milliseconds'''
        self._timeout = value
