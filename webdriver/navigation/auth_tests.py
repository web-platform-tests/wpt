# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest
import ConfigParser

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))

from webserver import Httpd
from selenium import webdriver
from selenium.common.exceptions import TimeoutException

class WebDriverAuthTest(unittest.TestCase):

    # Set up class to start HTTP Server that responds to 
    # test URLs with various 401 responses
    @classmethod
    def setUpClass(cls):
        config = ConfigParser.ConfigParser()
        config.read('webdriver.cfg')
        cls.driver_class = getattr(webdriver, config.get("Default", 'browser'))
        cls.driver = cls.driver_class()

        def basic_response_func( request, *args ):
            return (401, {"WWW-Authenticate" : "Basic"}, None)

        basic_auth_handler = { 'method': 'GET',
                               'path' : '/navigation/auth_required_basic',
                               'function' : basic_response_func }
        urlhandlers = [ basic_auth_handler ]

        cls.webserver = Httpd( urlhandlers=urlhandlers )
        cls.webserver.start()

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        cls.webserver.stop()

    # Test that when 401 is seen by browser, a WebDriver response is still sent
    def test_response_401_auth_basic(self):
        page = self.webserver.where_is('navigation/auth_required_basic')
        self.driver.set_page_load_timeout(5)
        try:
            self.driver.get( page )
            # if we got a responses instead of timeout, that's success
            self.assertTrue(True)
        except TimeoutException:
            self.fail("Did not get response from browser.")
        except:
            self.fail("Unexpected failure. Please investigate.")

if __name__ == "__main__":
    unittest.main()