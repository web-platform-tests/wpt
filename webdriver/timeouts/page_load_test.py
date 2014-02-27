# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

from selenium.common.exceptions import TimeoutException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class PageTimeoutsTest(base_test.WebDriverBaseTest):
    def test_pagetimeout_default_pass(self):
        self.driver.get(self.webserver.where_is("timeouts/res/pageload.html"))
        self.assertTrue(self.driver.execute_script("return document.readyState;"), "complete")

    def test_pagetimeout_fail(self):
        self.driver.timeouts("page load", 0)
        with self.assertRaises(TimeoutException):
            self.driver.get(self.webserver.where_is("timeouts/res/pageload.html"))

    def test_pagetimeout_pass(self):
        self.driver.timeouts("page load", 60000)
        self.driver.get(self.webserver.where_is("timeouts/res/pageload.html"))
        self.assertTrue(self.driver.execute_script("return document.readyState;"), "complete")


if __name__ == "__main__":
    unittest.main()
