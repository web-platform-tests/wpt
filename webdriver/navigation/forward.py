# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import unittest
import sys
import os

sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test

class ForwardTest(base_test.WebDriverBaseTest):

    # Get a static page that must be the same upon refresh
    def test_forward(self):
        
        self.driver.get(self.webserver.where_is('navigation/res/forwardStart.html'))
        self.driver.get(self.webserver.where_is('navigation/res/forwardNext.html'))
        nextbody = self.driver.find_element_by_css("body").get_text()
        self.driver.go_back()
        currbody = self.driver.find_element_by_css("body").get_text()
        self.assertNotEqual(nextbody, currbody)
        self.driver.go_forward()
        currbody = self.driver.find_element_by_css("body").get_text()
        self.assertEqual(nextbody, currbody)

if __name__ == '__main__':
    unittest.main()
