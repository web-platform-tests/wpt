# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import unittest
import ConfigParser

from webserver import Httpd
from selenium import webdriver

class WebDriverBaseTest(unittest.TestCase):
    
    def __init__(self, methodName):
        unittest.TestCase.__init__(self, methodName)
        self.driver = None
        self.webserver = None
    
    def setUp(self):
        config = ConfigParser.ConfigParser()
        config.read('webdriver.cfg')
        self.driver_class = getattr(webdriver, config.get("Default", 'browser')) 
        self.driver = self.driver_class()
        self.webserver = Httpd()
        self.webserver.start()

    def tearDown(self):
        self.driver.quit()
        self.webserver.stop()
