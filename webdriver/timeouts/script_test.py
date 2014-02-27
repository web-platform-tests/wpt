# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

from selenium.common.exceptions import TimeoutException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class ScriptTimeoutsTest(base_test.WebDriverBaseTest):
    def test_default_async_timeout(self):
        # makes sure we can call async without setting timeout first
        self.driver.execute_async_script("arguments[arguments.length - 1]();")
        self.driver.timeouts("script", 0)
        self.driver.execute_async_script("arguments[arguments.length - 1]();")

    def test_async_pass(self):
        self.driver.timeouts("script", 3000)
        self.driver.execute_async_script("window.setTimeout(function(){arguments[arguments.length - 1]();}, 500);")

    def test_async_fail(self):
        self.driver.timeouts("script", 3000)
        with self.assertRaises(TimeoutException):
            self.driver.execute_async_script("window.setTimeout(function(){arguments[arguments.length - 1]();}, 6000);")


if __name__ == "__main__":
    unittest.main()
