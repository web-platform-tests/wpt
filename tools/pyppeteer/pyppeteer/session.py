import json
import threading
import time

from six.moves import queue, xrange
from pyppeteer import action_handlers, Element, exclusive_ops, logging, timeout_lock
from pyppeteer.errors import ConnectionError, ProtocolError, ScriptError

_DEFAULT_NAVIGATION_TIMEOUT = 3
_DEFAULT_SCRIPT_TIMEOUT = 10 * 1000
_MESSAGE_TIMEOUT = 60

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
        self._messages = queue.Queue()
        self._locks = {}
        self._results = {}
        self._navigations = exclusive_ops.ExclusiveOps()
        self._navigation_timeout = _DEFAULT_NAVIGATION_TIMEOUT
        self._script_timeout = _DEFAULT_SCRIPT_TIMEOUT

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

        if 'id' in message:
            self._results[message['id']] = message
            self._locks.pop(message['id']).release()
        elif message['method'] == 'Page.frameNavigated':
            frame_id = message['params']['frame']['id']

            try:
                self._navigations.complete(frame_id)
            except exclusive_ops.NameError:
                # Ignore script-triggered navigations
                pass

    def close(self):
        for message_id in list(self._locks.keys()):
            self._results[message_id] = ConnectionError(
                'Command interrupted by closing connection'
            )
            self._locks.pop(message_id).release()

    def _send(self, method, params={}):
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
        self.connection.send(
            'Target.sendMessageToTarget',  # API status: stable
            {'sessionId': self._id, 'message': json.dumps(message)}
        )

        try:
            # A lock which respects a timeout is necessary to recover from
            # browser process crashes.
            lock.acquire(_MESSAGE_TIMEOUT)
        except Exception:
            self._locks.pop(message_id)
            raise
        result = self._results.pop(message_id)

        if 'error' in result:
            raise ProtocolError(method, result['error'])

        if isinstance(result, Exception):
            raise result

        if method == 'Input.dispatchMouseEvent':
            self._on_mouse_move(params)

        return result['result']

    def evaluate(self, source):
        '''Execute a string as a JavaScript expression.

        :param source: the JavaScript source text to evaluate
        :returns: an object describing the evaluated result [1]. This is
                  limited to primitive JavaScript values.

        [1] https://chromedevtools.github.io/devtools-protocol/tot/Runtime#method-evaluate'''
        result = self._send('Runtime.evaluate', {  # API status: stable
            'expression': source
        })

        if 'exceptionDetails' in result:
            details = result['exceptionDetails']

            try:
                self._send('Runtime.releaseObject', {  # API status: stable
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

        :param source: the JavaScript source text to evaluate
        :returns: the evaluated result

        [1] https://w3c.github.io/webdriver/#execute-async-script
        [2] https://chromedevtools.github.io/devtools-protocol/tot/Runtime#method-evaluate'''

        # A wrapper between the Promise executor and the evaluated code is
        # necessary to ensure that the length of the `arguments` object is `1`
        # as guaranteed by WebDriver.
        as_expression = '''(function() {{
          return new Promise(function(resolve) {{
              var result = (function() {{
                  {source}
                }}(resolve));

              if (result && typeof result.then === 'function') {{
                resolve(result);
              }}
            }});
        }}())'''.format(source=source)

        result = self._send('Runtime.evaluate', {  # API status: stable
            'expression': as_expression,
            'awaitPromise': True,
            'returnByValue': True,
            'timeout': self._script_timeout  # API status: experimental
        })

        if 'exceptionDetails' in result:
            details = result['exceptionDetails']
            try:
                self._send('Runtime.releaseObject', {  # API status: stable
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

        :param source: the JavaScript source text to evaluate
        :returns: the evaluated result

        [1] https://w3c.github.io/webdriver/#execute-script
        [2] https://chromedevtools.github.io/devtools-protocol/tot/Runtime#method-evaluate'''

        as_expression = '''(function() {{
          return Promise.resolve()
            .then(function() {{
                {source}
              }});
        }}())'''.format(source=source)

        result = self._send('Runtime.evaluate', {  # API status: stable
            'expression': as_expression,
            # This parameter is set to `true` in all cases to mimic the
            # behavior of the "Execute Script" command in WebDriver
            # https://w3c.github.io/webdriver/#execute-script
            'awaitPromise': True,
            'returnByValue': True,
            'timeout': self._script_timeout  # API status: experimental
        })

        if 'exceptionDetails' in result:
            details = result['exceptionDetails']
            try:
                self._send('Runtime.releaseObject', {  # API status: stable
                    'objectId': details['exception']['objectId']
                })
            finally:
                raise ScriptError(details)

        return unpack_remote_object(result['result'])

    def navigate(self, url):
        '''Transition to a given URL and wait for the operation to complete.

        :param url: the location to which to navigate
        '''
        frame_id = self._send('Page.getFrameTree')['frameTree']['frame']['id']

        with self._navigations.start(frame_id):
            self._send('Page.navigate', {'url': url})  # API status: stable

        # This class uses the `_navigations` object to ensure that each
        # invocation of `Page.navigate` waits for a corresponding
        # `Page.frameNavigated` event. That event has been observed to occur
        # before the document has reached the "complete" ready state. In order
        # to match the default semantics of the "Navigate To" WebDriver
        # command, this method must explicitly pause until the document reaches
        # the "complete" ready state.
        self.execute_async_script('''
          (function poll(done) {
            if (document.readyState === 'complete') {
              done();
              return;
            }
            setTimeout(poll.bind(null, done), 100);
          }(arguments[0]));
        ''')

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

        exceptions = queue.Queue()

        def create_thread(action, exceptions):
            handler = getattr(action_handlers, action['type'])
            duration = action.get('duration', 0) / 1000

            def target():
                start = time.time()
                try:
                    handler(self, action)

                    time.sleep(max(0, duration - (time.time() - start)))
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
            except queue.Empty:
                pass
            else:
                raise thread_exception

    def query_selector_all(self, selector):
        '''Query the DOM for elements which match a given CSS selector.

        :param selector: a CSS selector
        :returns: a list of references to the matched element(s)
        '''
        document_object = self.evaluate(
            'Array.from(document.querySelectorAll(%s))' % json.dumps(selector)
        )
        props = self._send('Runtime.getProperties', {  # API status: stable
            'objectId': document_object['objectId'],
            'ownProperties': True
        })['result']
        self._send('Runtime.releaseObject', {  # API status: stable
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
        '''Capture the visual state of the document.

        :returns: an object whose "data" property is a Base64-encoded png

        https://chromedevtools.github.io/devtools-protocol/1-3/Page#method-captureScreenshot
        '''
        return self._send('Page.captureScreenshot', {})  # API status: stable

    def set_window_bounds(self, bounds):
        '''Set position and/or size of the browser window.

        :param bounds: an object with numeric "left", "top", "width", and
                       "height" properties

        https://chromedevtools.github.io/devtools-protocol/tot/Browser#method-setWindowBounds
        '''
        result = self._send(
            'Browser.getWindowForTarget',  # API status: experimental
            {'targetId': self.target_id}
        )

        return self._send(
            'Browser.setWindowBounds',  # API status: experimental
            {
                'windowId': result['windowId'],
                'bounds': bounds
            }
        )

    def set_script_timeout(self, value):
        '''Define a duration to wait before considering an expression failed

        :param value: duration in milliseconds'''
        self._script_timeout = value
