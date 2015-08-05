import unittest
import sys
import os

sys.path.insert(1, os.path.abspath(os.path.join(__file__, "../..")))
import base_test


class BackTest(base_test.WebDriverBaseTest):
    # Get a static page that must be the same upon refresh
    def test_back(self):
        self.driver.get(self.webserver.where_is('navigation/res/backStart.html'))
        body = self.driver.find_element_by_css("body").text
	self.driver.get(self.webserver.where_is('navigation/res/backNext.html'))
	currbody = self.driver.find_element_by_css("body").text
	self.assertNotEqual(body, currbody)
        self.driver.go_back()
        backbody = self.driver.find_element_by_css("body").text
        self.assertEqual(body, backbody)


if __name__ == '__main__':
    unittest.main()
