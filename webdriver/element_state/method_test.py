# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class GetElementAttributeTest(base_test.WebDriverBaseTest):
    def test_get_element_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-with-attribute.html"))
        el = self.driver.find_element_by_css("div")
        self.assertEqual("myId", el.get_attribute("id"))

if __name__ == "__main__":
    unittest.main()
