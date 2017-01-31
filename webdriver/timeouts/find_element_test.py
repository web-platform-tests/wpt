# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

from selenium.common.exceptions import NoSuchElementException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class FindElementTest(base_test.WebDriverBaseTest):
    def test_we_get_timed_out_by_default(self):
        self.driver.get(self.webserver.where_is("timeouts/res/delayed-element.html"))
        with self.assertRaises(NoSuchElementException):
            self.driver.find_element_by_id("newDiv")

    def test_we_get_timed_out_with_small_wait(self):
        self.driver.get(self.webserver.where_is("timeouts/res/delayed-element.html"))
        self.driver.timeouts("implicit", 10)
        with self.assertRaises(NoSuchElementException):
            self.driver.find_element_by_id("newDiv")

    def test_we_wait_for_element(self):
        self.driver.get(self.webserver.where_is("timeouts/res/delayed-element.html"))
        self.driver.timeouts("implicit", 10000)
        self.driver.find_element_by_id("newDiv")

if __name__ == "__main__":
    unittest.main()
