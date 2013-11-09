# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class CookieTest(base_test.WebDriverBaseTest):
    def test_get_cookies(self):
        self.driver.get(self.webserver.where_is("cookies/cookies.html"))
        # Cookies added in html by DOM API
        for cookie in self.driver.get_cookies():
            self.assertTrue(cookie['name'])
            self.assertTrue(cookie['value'])
            self.assertTrue(cookie['path'])
            self.assertTrue(cookie['domain'])
            self.assertTrue(cookie['expiry'])
            self.assertFalse(cookie['httpOnly'])


if __name__ == "__main__":
    unittest.main()
