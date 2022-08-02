# mypy: allow-untyped-defs

from .base import RefTestExecutor, RefTestImplementation, CrashtestExecutor, TestharnessExecutor
from .protocol import ConnectionlessProtocol
from time import time
from queue import Empty
from base64 import b64encode
from os import linesep
import json


class CrashError(BaseException):
    pass


class ContentShellProtocol(ConnectionlessProtocol):
    """This class represents the protocol used by content_shell in protocol mode.
    For more details, see:
    https://chromium.googlesource.com/chromium/src.git/+/HEAD/content/web_test/browser/test_info_extractor.h
    """
    # Marker sent by content_shell after blocks.
    eof_marker = "#EOF" + linesep

    def teardown(self):
        # Close the queue properly to avoid broken pipe spam in the log.
        self.browser.stdin_queue.close()
        self.browser.stdin_queue.join_thread()

    def send_command(self, command):
        """Sends a single `command`, i.e. a URL to open, to content_shell.
        """
        self.browser.stdin_queue.put((command + linesep).encode("utf-8"))

    def read_errors(self):
        """Reads the entire content of the stderr queue as is available right now (no blocking).
        """
        result = ""

        while not self.browser.stderr_queue.empty():
            # There is no potential for race conditions here because this is the only place
            # where we read from the stderr queue.
            error = self.browser.stderr_queue.get()
            result += error.decode("utf-8", "replace") + "\n"

        return result

    def read_line(self, deadline=None, encoding=None, errors="strict", raise_crash=True):
        """Reads a single line from the stdout queue. The read must succeed before `deadline` or
        a TimeoutError is raised. The line is returned as a bytestring or optionally with the
        specified `encoding`. If `raise_crash` is set, a CrashError is raised if the line
        happens to be a crash message.
        """
        current_time = time()

        if deadline and current_time > deadline:
            raise TimeoutError()

        try:
            line = self.browser.stdout_queue.get(True,
                    deadline - current_time if deadline else None)

            if raise_crash and line.startswith(b"#CRASHED"):
                raise CrashError()
        except Empty:
            raise TimeoutError()

        return line.decode(encoding, errors) if encoding else line

    def is_alive(self):
        """Checks if content_shell is alive by determining if the IO pipes are still
        open. This does not guarantee that the process is responsive.
        """
        return self.browser.io_stopped.is_set()

    def do_test(self, url, timeout=None):
        """Sends a url to content_shell and returns the resulting text and image output.
        """
        self.send_command(url)

        deadline = time() + timeout if timeout else None
        # The first block can also contain audio data but not in WPT.
        text = self._read_block(deadline)
        image = self._read_block(deadline)

        return text, image

    def _read_block(self, deadline=None):
        """Tries to read a single block of content from stdout before the `deadline`.
        """
        while True:
            line = self.read_line(deadline, "latin-1").rstrip()

            if line == "Content-Type: text/plain":
                return self._read_text_block(deadline)

            if line == "Content-Type: image/png":
                return self._read_image_block(deadline)

            if line == "#EOF":
                return None

    def _read_text_block(self, deadline=None):
        """Tries to read a plain text block in utf-8 encoding before the `deadline`.
        """
        result = ""

        while True:
            line = self.read_line(deadline, "utf-8", "replace", False)

            if line.endswith(self.eof_marker):
                result += line[:-len(self.eof_marker)]
                break

            result += line

        return result

    def _read_image_block(self, deadline=None):
        """Tries to read an image block (as a binary png) before the `deadline`.
        """
        content_length_line = self.read_line(deadline, "utf-8")
        assert content_length_line.startswith("Content-Length:")
        content_length = int(content_length_line[15:])

        result = bytearray()

        while True:
            line = self.read_line(deadline, raise_crash=False)
            excess = len(line) + len(result) - content_length

            if excess > 0:
                # This is the line that contains the EOF marker.
                assert excess == len(self.eof_marker)
                result += line[:-excess]
                break

            result += line

        return result


def _convert_exception(test, exception, errors):
    """Converts our TimeoutError and CrashError exceptions into test results.
    """
    if isinstance(exception, TimeoutError):
        return (test.result_cls("EXTERNAL-TIMEOUT", errors), [])
    if isinstance(exception, CrashError):
        return (test.result_cls("CRASH", errors), [])
    raise exception


class ContentShellRefTestExecutor(RefTestExecutor):
    def __init__(self, logger, browser, server_config, timeout_multiplier=1, screenshot_cache=None,
            debug_info=None, reftest_screenshot="unexpected", **kwargs):
        super().__init__(logger, browser, server_config, timeout_multiplier, screenshot_cache,
                debug_info, reftest_screenshot, **kwargs)
        self.implementation = RefTestImplementation(self)
        self.protocol = ContentShellProtocol(self, browser)

    def reset(self):
        self.implementation.reset()

    def do_test(self, test):
        try:
            result = self.implementation.run_test(test)
            self.protocol.read_errors()
            return self.convert_result(test, result)
        except BaseException as exception:
            return _convert_exception(test, exception, self.protocol.read_errors())

    def screenshot(self, test, viewport_size, dpi, page_ranges):
        _, image = self.protocol.do_test(self.test_url(test),
                test.timeout * self.timeout_multiplier)

        if not image:
            return False, ("ERROR", self.protocol.read_errors())

        return True, b64encode(image).decode()


class ContentShellCrashtestExecutor(CrashtestExecutor):
    def __init__(self, logger, browser, server_config, timeout_multiplier=1, debug_info=None,
            **kwargs):
        super().__init__(logger, browser, server_config, timeout_multiplier, debug_info, **kwargs)
        self.protocol = ContentShellProtocol(self, browser)

    def do_test(self, test):
        try:
            _ = self.protocol.do_test(self.test_url(test), test.timeout * self.timeout_multiplier)
            self.protocol.read_errors()
            return self.convert_result(test, {"status": "PASS", "message": None})
        except BaseException as exception:
            return _convert_exception(test, exception, self.protocol.read_errors())


class ContentShellTestharnessExecutor(TestharnessExecutor):
    def __init__(self, logger, browser, server_config, timeout_multiplier=1, debug_info=None,
            **kwargs):
        super().__init__(logger, browser, server_config, timeout_multiplier, debug_info, **kwargs)
        self.protocol = ContentShellProtocol(self, browser)

    def do_test(self, test):
        try:
            text, _ = self.protocol.do_test(self.test_url(test),
                    test.timeout * self.timeout_multiplier)

            errors = self.protocol.read_errors()
            if not text:
                return (test.result_cls("ERROR", errors), [])

            return self.convert_result(test, json.loads(text))
        except BaseException as exception:
            return _convert_exception(test, exception, self.protocol.read_errors())
