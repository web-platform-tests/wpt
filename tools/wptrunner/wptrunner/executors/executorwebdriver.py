import json
import os
import socket
import sys
import threading
import time
import traceback
import urlparse
import uuid
import requests
import time

from .base import (Protocol,
                   RefTestExecutor,
                   RefTestImplementation,
                   TestharnessExecutor,
                   extra_timeout,
                   strip_server)
from ..testrunner import Stop

here = os.path.join(os.path.split(__file__)[0])

class WebDriverTestharnessExecutor(TestharnessExecutor):
    supports_testdriver = True

    def __init__(self, browser, webdriver_binary=None, server_config=None, timeout_multiplier=1,
                 close_after_done=True, capabilities=None, debug_info=None,
                 **kwargs):
        """WebDriver-based executor for testharness.js tests"""
        TestharnessExecutor.__init__(self, browser, server_config,
                                     timeout_multiplier=timeout_multiplier,
                                     debug_info=debug_info)
        self.protocol = DriverProtocol(self, browser, capabilities)
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
            self.protocol.load_runner(new_environment["protocol"])

    def do_test(self, test):
        url = self.test_url(test)
        print(test.timeout)
        print(self.timeout_multiplier)
        success, data = WebDriverRun(self.do_testharness,
                                     url,
                                     test.timeout * self.timeout_multiplier).run()

        if success:
            return self.convert_result(test, data)

        return (test.result_cls(*data), [])

    def do_testharness(self, url, timeout):
        self.logger.debug("Running the test harness!")
        format_map = {"abs_url": url,
                      "url": strip_server(url),
                      "window_id": self.window_id,
                      "timeout_multiplier": self.timeout_multiplier,
                      "timeout": timeout * 1000}

        parent = webdriver.current_window_handle
        handles = [item for item in webdriver.window_handles if item != parent]
        for handle in handles:
            try:
                webdriver.switch_to_window(handle)
                webdriver.close()
            except exceptions.NoSuchWindowException:
                pass
        webdriver.switch_to_window(parent)

        webdriver.execute_script(self.script % format_map)
        try:
            # Try this, it's in Level 1 but nothing supports it yet
            win_s = webdriver.execute_script("return window['%s'];" % self.window_id)
            win_obj = json.loads(win_s)
            test_window = win_obj["window-fcc6-11e5-b4f8-330a88ab9d7f"]
        except:
            after = webdriver.window_handles
            if len(after) == 2:
                test_window = next(iter(set(after) - set([parent])))
            elif after[0] == parent and len(after) > 2:
                # Hope the first one here is the test window
                test_window = after[1]
            else:
                raise Exception("unable to find test window")
        assert test_window != parent

        handler = CallbackHandler(webdriver, test_window, self.logger)
        while True:
            result = webdriver.execute_async_script(
                self.script_resume % format_map)
            done, rv = handler(result)
            if done:
                break
        return rv


class CallbackHandler(object):
    pass

class DriverProtocol(Protocol):
    def __init__(self, executor, browser, capabilities, **kwargs):
        Protocol.__init__(self, executor, browser)
        self.url = browser.webdriver_url
        self.capabilities = capabilities

    def setup(self, runner):
        """Connect to browser using WebDriver API directly"""
        self.runner = runner
        self.logger.debug("Connecting to Webdriver on URL: %s" % self.url)


        session_started = False
        # time.sleep(100)

        try:
            # TODO
            driver_capabilities = {"alwaysMatch": self.capabilities}
            print(driver_capabilities)
            # str_driver_capabilities = str(driver_capabilities).replace('\'', '&')
            # str_driver_capabilities = str_driver_capabilities.replace('\"', "'")
            # str_driver_capabilities = str_driver_capabilities.replace('&', '"')
            # print(str_driver_capabilities)
            r = requests.post("{}/session".format(self.url.strip("/")), data=driver_capabilities)
            print(r.text)
        #     #webdriver.Remote(command_executor=RemoteConnection(self.url.strip("/"),
        #                                         #                                resolve_ip=False),
        #                                      # desired_capabilities=self.capabilities)
        except:
            self.logger.warning(
                "Connecting to WebDriver failed:\n%s" % traceback.format_exc())
        else:
            self.executor.runner.send_message("init_succeeded")
            session_started = True
        # else:
        #     self.logger.debug("Selenium session started")
        #     session_started = True
        #
        if not session_started:
            self.logger.warning("Failed to connect to Selenium")
            self.executor.runner.send_message("init_failed")
        # else:
        #     try:
        #         self.after_connect()
        #     except:
        #         print >> sys.stderr, traceback.format_exc()
        #         self.logger.warning(
        #             "Failed to connect to navigate initial page")
        #         self.executor.runner.send_message("init_failed")
        #     else:
        #         self.executor.runner.send_message("init_succeeded")

    def teardown(self):
        print('teardown')
        pass

    def is_alive(self):
        print('teardown')
        pass

    def after_connect(self):
        print('teardown')
        pass

    def load_runner(self):
        print('teardown')
        pass

    def wait(self):
        print('teardown')
        pass

class WebDriverRun(object):
    def __init__(self, func, url, timeout):
        self.func = func
        self.result = None
        self.url = url
        self.timeout = timeout
        self.result_flag = threading.Event()

    def run(self):
        timeout = self.timeout

        # try:
        #     self.webdriver.set_script_timeout((timeout + extra_timeout) * 1000)
        # except exceptions.ErrorInResponseException:
        #     self.logger.error("Lost WebDriver connection")
        #     return Stop

        executor = threading.Thread(target=self._run)
        executor.start()

        flag = self.result_flag.wait(timeout + 2 * extra_timeout)
        if self.result is None:
            assert not flag
            self.result = False, ("EXTERNAL-TIMEOUT", None)

        return self.result, None

    def _run(self):
        try:
            self.result = True, self.func(self.webdriver, self.url, self.timeout)
        except:
            print("BAD")
        # except exceptions.TimeoutException:
        #     self.result = False, ("EXTERNAL-TIMEOUT", None)
        # except (socket.timeout, exceptions.ErrorInResponseException):
        #     self.result = False, ("CRASH", None)
        # except Exception as e:
        #     message = getattr(e, "message", "")
        #     if message:
        #         message += "\n"
        #     message += traceback.format_exc(e)
        #     self.result = False, ("ERROR", e)
        # finally:
        #     self.result_flag.set()
        self.result = True
