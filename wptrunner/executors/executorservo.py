import urlparse
import threading
import json

from mozprocess import ProcessHandler

from .base import testharness_result_converter
from .process import ProcessTestExecutor


class ServoTestharnessExecutor(ProcessTestExecutor):
    convert_result = testharness_result_converter

    def __init__(self, *args, **kwargs):
        ProcessTestExecutor.__init__(self, *args, **kwargs)
        self.result_data = None
        self.result_flag = None

    def run_test(self, test):
        self.result_data = None
        self.result_flag = threading.Event()

        proc = ProcessHandler([self.binary,
                               urlparse.urljoin(self.http_server_url, test.url)],
                              processOutputLine=[self.on_output])
        proc.run()

        timeout = test.timeout * self.timeout_multiplier

        #Now wait to get the output we expect, or until we reach the timeout
        self.result_flag.wait(timeout + 5)

        if self.result_flag.is_set():
            assert self.result_data is not None
            self.result_data["test"] = test.url
            result = self.convert_result(test, self.result_data)
            proc.kill()
        else:
            if proc.pid is None:
                result = (test.result_cls("CRASH", None), [])
            else:
                proc.kill()
                result = (test.result_cls("TIMEOUT", None), [])
        self.runner.send_message("test_ended", test, result)

    def on_output(self, line):
        prefix = "ALERT: RESULT: "
        line = line.decode("utf8")
        if line.startswith(prefix):
            self.result_data = json.loads(line[len(prefix):])
            self.result_flag.set()
