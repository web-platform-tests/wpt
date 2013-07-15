# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import unittest
import ConfigParser

from webserver import Httpd
from selenium import webdriver


class WebDriverBaseTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        config = ConfigParser.ConfigParser()
        config.read('webdriver.cfg')
        cls.driver_class = getattr(webdriver, config.get("Default", 'browser'))
        cls.driver = cls.driver_class()
        cls.webserver = Httpd()
        cls.webserver.start()

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        cls.webserver.stop()
