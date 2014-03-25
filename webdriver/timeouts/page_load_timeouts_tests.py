# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest
from selenium.common.exceptions import TimeoutException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test

class PageLoadTimeoutTest(base_test.WebDriverBaseTest):

    def test_should_timeout_on_page_load_taking_too_long(self):
        self.driver.set_page_load_timeout(0.01)
        with self.assertRaises(TimeoutException):
            self.load_page()

    def test_should_not_timeout_on_page_load(self):
        self.driver.set_page_load_timeout(30)
        self.load_page()
        pass

    def load_page(self):
        self.driver.get(self.webserver.where_is('timeouts/res/page_load_timeouts_tests.html'))

if __name__ == "__main__":
    unittest.main()
