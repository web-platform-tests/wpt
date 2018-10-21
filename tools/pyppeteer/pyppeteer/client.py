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
        self._timeout = float('inf')

        # TODO: Decide if this value needs to be dynamic
        self.target_id = target_id

    def close(self):
        self._exit_event.set()

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

    def execute_async_script(self, source):
        '''Execute a string as JavaScript, waiting for the returned Promise (if
        any) to settle and honoring any previously-set "timeout" value.

        This method approximates the W3C Webdriver "Execute Async Script"
        command [1] using the Chrome Debugger protocol's "Runtime.evaluate"
        method [2]

        [1] https://w3c.github.io/webdriver/#execute-async-script
        [2] https://chromedevtools.github.io/devtools-protocol/tot/Runtime#method-evaluate'''

        as_expression = '''(function() {{
          return new Promise(function() {{
              {source}
            }});
        }}())'''.format(source=source)

        return self.send('Runtime.evaluate', {
            'expression': source,
            'awaitPromise': True,
            'timeout': self._timeout
        })

    def execute_script(self, source):
        '''Execute a string as JavaScript, waiting for the returned Promise (if
        any) to settle and honoring any previously-set "timeout" value.

        This method approximates the W3C Webdriver "Execute Script" command [1]
        using the Chrome Debugger protocol's "Runtime.evaluate" method [2]

        [1] https://w3c.github.io/webdriver/#execute-script
        [2] https://chromedevtools.github.io/devtools-protocol/tot/Runtime#method-evaluate'''

        as_expression = '''(function() {{ {source} }}())'''.format(source=source)

        return self.send('Runtime.evaluate', {
            'expression': as_expression,
            # This parameter is set to `true` in all cases to mimic the
            # behavior of the "Execute Script" command in WebDriver
            # https://w3c.github.io/webdriver/#execute-script
            'awaitPromise': True,
            'timeout': self._timeout
        })

    def navigate(self, url):
        return self.send('Page.navigate', {'url': url})

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

    def screenshot(self):
        return self.send('Page.captureScreenshot', {})

    def set_script_timeout(self, value):
        '''Define a duration to wait before considering an expression failed

        :param value: duration in milliseconds'''
        self._timeout = value
