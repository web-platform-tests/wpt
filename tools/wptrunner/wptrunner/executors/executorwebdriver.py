import json
import logging
import os
import shutil
import socket
import subprocess
import tempfile
import threading
import traceback
import urllib
import urllib2
import urlparse
import uuid

from .base import (CallbackHandler,
                   RefTestExecutor,
                   RefTestImplementation,
                   TestharnessExecutor,
                   extra_timeout,
                   strip_server)
from .protocol import (BaseProtocolPart,
                       TestharnessProtocolPart,
                       Protocol,
                       SelectorProtocolPart,
                       ClickProtocolPart,
                       SendKeysProtocolPart,
                       ActionSequenceProtocolPart,
                       TestDriverProtocolPart)
from ..testrunner import Stop

import pyppeteer
import webdriver as client

here = os.path.join(os.path.split(__file__)[0])

class MozLogHandler(logging.Handler):
    def __init__(self, mozlog_logger):
        super(MozLogHandler, self).__init__()
        self.mozlog_logger = mozlog_logger

    def emit(self, record):
        method = getattr(self.mozlog_logger, record.levelname.lower())

        method(self.format(record))

class WebDriverBaseProtocolPart(BaseProtocolPart):
    @property
    def session(self):
        return self.parent.session

    def execute_script(self, script, async=False):
        method = 'execute_async_script' if async else 'execute_script'
        return getattr(self.session, method)(script)

    def set_timeout(self, timeout):
        self.session.set_script_timeout(timeout * 1000)

    @property
    def current_window(self):
        return self.webdriver.window_handle

    def set_window(self, handle):
        self.webdriver.window_handle = handle

    def wait(self):
        while True:
            try:
                self.session.execute_async_script("")
            except pyppeteer.ConnectionError:
                break
            except (client.TimeoutException, client.ScriptTimeoutException):
                pass
            except (socket.timeout, client.NoSuchWindowException,
                    client.UnknownErrorException, IOError):
                break
            except Exception as e:
                self.logger.error(traceback.format_exc(e))
                break


class WebDriverTestharnessProtocolPart(TestharnessProtocolPart):
    def setup(self):
        self.runner_handle = None
        with open(os.path.join(here, "runner.js")) as f:
            self.runner_script = f.read()

    @property
    def session(self):
        return self.parent.session

    def load_runner(self, url_protocol):
        if self.runner_handle:
            self.webdriver.window_handle = self.runner_handle
        url = urlparse.urljoin(self.parent.executor.server_url(url_protocol),
                               "/testharness_runner.html")
        self.logger.debug("Loading %s" % url)

        self.session.navigate(url)
        format_map = {"title": threading.current_thread().name.replace("'", '"')}
        self.session.execute_script(self.runner_script % format_map)

    def close_old_windows(self):
        targets = [target for target in self.session.targets() if target['targetId'] != self.session.target_id]
        for target in targets:
            self.session.close_target(target['targetId'])

        return self.session

    def get_test_window(self, window_id, parent):
        for target in self.session.targets():
            if target['type'] != 'page':
                continue

            session = self.session.connection.create_session(
                target['targetId']
            )

            if session.execute_script('return window.name;') == window_id:
                break
        else:
            raise Exception('Could not locate test window')

        return session


class WebDriverSelectorProtocolPart(SelectorProtocolPart):
    @property
    def session(self):
        return self.parent.session

    def elements_by_selector(self, selector):
        return self.session.query_selector_all(selector)


class WebDriverClickProtocolPart(ClickProtocolPart):
    @property
    def session(self):
        return self.parent.session

    def element(self, element):
        self.logger.info("click " + repr(element))
        return element.click()


class WebDriverSendKeysProtocolPart(SendKeysProtocolPart):
    @property
    def session(self):
        return self.parent.session

    def send_keys(self, element, keys):
        try:
            return element.send_keys(keys)
        except client.UnknownErrorException as e:
            # workaround https://bugs.chromium.org/p/chromedriver/issues/detail?id=1999
            if (e.http_status != 500 or
                e.status_code != "unknown error"):
                raise
            return element.send_element_command("POST", "value", {"value": list(keys)})


class WebDriverActionSequenceProtocolPart(ActionSequenceProtocolPart):
    @property
    def session(self):
        return self.parent.session

    def send_actions(self, actions):
        self.session.perform(actions)


class WebDriverTestDriverProtocolPart(TestDriverProtocolPart):
    @property
    def session(self):
        return self.parent.session

    def send_message(self, message_type, status, message=None):
        obj = {
            "type": "testdriver-%s" % str(message_type),
            "status": str(status)
        }
        if message:
            obj["message"] = str(message)
        self.session.execute_script("window.postMessage(%s, '*')" % json.dumps(obj))


class WebDriverProtocol(Protocol):
    implements = [WebDriverBaseProtocolPart,
                  WebDriverTestharnessProtocolPart,
                  WebDriverSelectorProtocolPart,
                  WebDriverClickProtocolPart,
                  WebDriverSendKeysProtocolPart,
                  WebDriverActionSequenceProtocolPart,
                  WebDriverTestDriverProtocolPart]

    def __init__(self, executor, browser, capabilities, **kwargs):
        super(WebDriverProtocol, self).__init__(executor, browser)
        self.binary = browser.binary or 'google-chrome'
        self.args = capabilities['goog:chromeOptions']['args'] or []
        self.session = None
        self.browser_process = None
        self.profile_dir = None
        self.capabilities = capabilities

    def connect(self):
        """Connect to browser via CDP."""
        self.logger.debug("Connecting to CDP")

        self.profile_dir = tempfile.mkdtemp()
        identifier = 'cdp-executor-%s' % urllib.quote(self.profile_dir)
        self.browser_process = subprocess.Popen([
                self.binary,
                '--user-data-dir=%s' % self.profile_dir,
                '--remote-debugging-port=0',
                'data:text/html,%s' % identifier
                ] + self.args,
            stderr=open(os.devnull, 'w')
        )

        # > How do I access the browser target?
        # >
        # > The endpoint is exposed as `webSocketDebuggerUrl` in
        # > `/json/version`. Note the `browser` in the URL, rather than `page`.
        # > If Chrome was launched with `--remote-debugging-port=0` and chose
        # > an open port, the browser endpoint is written to both stderr and
        # > the `DevToolsActivePort` file in browser profile folder.
        #
        # https://chromedevtools.github.io/devtools-protocol/
        self.logger.debug('inferring browser port')
        port = None
        while port is None and self.browser_process.returncode is None:
            try:
                with open('%s/DevToolsActivePort' % self.profile_dir) as handle:
                    contents = handle.read().strip()
                    port = contents.split('\n')[0]
            except IOError:
                pass

        targets_url = 'http://localhost:%s/json' % port
        candidates = json.loads(urllib2.urlopen(targets_url).read())
        for candidate in candidates:
            if identifier in candidate['url']:
                target = candidate
                break
        else:
            raise Exception('Could not locate browser process')

        handler = MozLogHandler(self.logger)
        handler.setFormatter(logging.Formatter('%(name)s:%(message)s'))
        pyppeteer.logging.addHandler(handler)
        pyppeteer.logging.setLevel(logging.DEBUG)

        self.connection = pyppeteer.Connection(target['webSocketDebuggerUrl'])
        self.connection.open()
        self.session = self.connection.create_session(target['id'])

    def after_conect(self):
        pass

    def teardown(self):
        self.logger.debug("Hanging up on CDP session")

        try:
            self.connection.close()
        except:
            pass

        self.session = None

        try:
            self.browser_process.kill()
        except Exception:
            pass

        self.browser_process = None

        try:
            shutil.rmtree(self.profile_dir)
        except:
            pass

        self.profile_dir = None

    def is_alive(self):
        if self.browser_process is None:
            return False

        self.browser_process.poll()
        return self.browser_process.returncode is None

    def after_connect(self):
        self.testharness.load_runner(self.executor.last_environment["protocol"])


class WebDriverRun(object):
    def __init__(self, func, protocol, url, timeout):
        self.func = func
        self.result = None
        self.protocol = protocol
        self.url = url
        self.timeout = timeout
        self.result_flag = threading.Event()

    def run(self):
        timeout = self.timeout

        try:
            self.protocol.base.set_timeout((timeout + extra_timeout))
        except client.UnknownErrorException:
            self.logger.error("Lost WebDriver connection")
            return Stop

        executor = threading.Thread(target=self._run)
        executor.start()

        flag = self.result_flag.wait(timeout + 2 * extra_timeout)
        if self.result is None:
            if flag:
                # flag is True unless we timeout; this *shouldn't* happen, but
                # it can if self._run fails to set self.result due to raising
                self.result = False, ("INTERNAL-ERROR", "self._run didn't set a result")
            else:
                self.result = False, ("EXTERNAL-TIMEOUT", None)

        return self.result

    def _run(self):
        try:
            self.result = True, self.func(self.protocol, self.url, self.timeout)
        except (client.TimeoutException, client.ScriptTimeoutException):
            self.result = False, ("EXTERNAL-TIMEOUT", None)
        except (socket.timeout, client.UnknownErrorException):
            self.result = False, ("CRASH", None)
        except Exception as e:
            if (isinstance(e, client.WebDriverException) and
                    e.http_status == 408 and
                    e.status_code == "asynchronous script timeout"):
                # workaround for https://bugs.chromium.org/p/chromedriver/issues/detail?id=2001
                self.result = False, ("EXTERNAL-TIMEOUT", None)
            else:
                message = str(getattr(e, "message", ""))
                if message:
                    message += "\n"
                message += traceback.format_exc(e)
                self.result = False, ("INTERNAL-ERROR", message)
        finally:
            self.result_flag.set()


class WebDriverTestharnessExecutor(TestharnessExecutor):
    supports_testdriver = True

    def __init__(self, browser, server_config, timeout_multiplier=1,
                 close_after_done=True, capabilities=None, debug_info=None,
                 **kwargs):
        """WebDriver-based executor for testharness.js tests"""
        TestharnessExecutor.__init__(self, browser, server_config,
                                     timeout_multiplier=timeout_multiplier,
                                     debug_info=debug_info)
        self.protocol = WebDriverProtocol(self, browser, capabilities)
        with open(os.path.join(here, "testharness_webdriver.js")) as f:
            self.script = f.read()
        with open(os.path.join(here, "testharness_webdriver_resume.js")) as f:
            self.script_resume = f.read()
        self.close_after_done = close_after_done
        self.window_id = str(uuid.uuid4())

    def is_alive(self):
        return self.protocol.is_alive()

    def on_environment_change(self, new_environment):
        if new_environment["protocol"] != self.last_environment["protocol"]:
            self.protocol.testharness.load_runner(new_environment["protocol"])

    def do_test(self, test):
        url = self.test_url(test)

        success, data = WebDriverRun(self.do_testharness,
                                    self.protocol,
                                    url,
                                    test.timeout * self.timeout_multiplier).run()

        if success:
            return self.convert_result(test, data)

        return (test.result_cls(*data), [])

    def do_testharness(self, protocol, url, timeout):
        format_map = {"abs_url": url,
                      "url": strip_server(url),
                      "window_id": self.window_id,
                      "timeout_multiplier": self.timeout_multiplier,
                      "timeout": timeout * 1000}

        parent_window = protocol.testharness.close_old_windows()
        # Now start the test harness
        protocol.base.execute_script(self.script % format_map, async=True)
        test_window = protocol.testharness.get_test_window(self.window_id, parent_window)
        handler = CallbackHandler(self.logger, protocol, test_window)
        while True:
            self.protocol.session = test_window
            result = protocol.base.execute_script(
                self.script_resume % format_map, async=True)
            done, rv = handler(result)
            if done:
                break
        self.protocol.session = parent_window
        return rv


class WebDriverRefTestExecutor(RefTestExecutor):
    def __init__(self, browser, server_config, timeout_multiplier=1,
                 screenshot_cache=None, close_after_done=True,
                 debug_info=None, capabilities=None, **kwargs):
        """WebDriver-based executor for reftests"""
        RefTestExecutor.__init__(self,
                                 browser,
                                 server_config,
                                 screenshot_cache=screenshot_cache,
                                 timeout_multiplier=timeout_multiplier,
                                 debug_info=debug_info)
        self.protocol = WebDriverProtocol(self, browser,
                                          capabilities=capabilities)
        self.implementation = RefTestImplementation(self)
        self.close_after_done = close_after_done
        self.has_window = False

        with open(os.path.join(here, "reftest.js")) as f:
            self.script = f.read()
        with open(os.path.join(here, "reftest-wait_webdriver.js")) as f:
            self.wait_script = f.read()

    def is_alive(self):
        return self.protocol.is_alive()

    def do_test(self, test):
        self.protocol.session.set_window_bounds({'width': 600, 'height': 600})

        result = self.implementation.run_test(test)

        return self.convert_result(test, result)

    def screenshot(self, test, viewport_size, dpi):
        # https://github.com/w3c/wptrunner/issues/166
        assert viewport_size is None
        assert dpi is None

        return WebDriverRun(self._screenshot,
                           self.protocol,
                           self.test_url(test),
                           test.timeout).run()

    def _screenshot(self, protocol, url, timeout):
        protocol.session.navigate(url)

        protocol.session.execute_async_script(self.wait_script)

        screenshot = protocol.session.screenshot()['data']

        # strip off the data:img/png, part of the url
        if screenshot.startswith("data:image/png;base64,"):
            screenshot = screenshot.split(",", 1)[1]

        return screenshot
