
import ConfigParser
import json
import os
import unittest

from webserver import Httpd
from selenium import webdriver
from network import get_lan_ip

class WebDriverBaseTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        config = ConfigParser.ConfigParser()
        config.read('webdriver.cfg')
        section = os.environ.get("WD_BROWSER", 'firefox')
        cls.driver_class = getattr(webdriver, config.get(section, 'browser'))
        url = None
        if config.has_option(section, 'url'):
            url = config.get(section, "url")
        capabilities = None
        if config.has_option(section, 'capabilities'):
            try:
                capabilities = json.loads(config.get(section, "capabilities"))
            except:
              pass

        if url != None and url.strip() != '':
            if capabilities != None and type(capabilities) is dict:
                cls.driver = cls.driver_class(command_executor=url,
                                              desired_capabilities=capabilities)
            else:
                cls.driver = cls.driver_class(command_executor=url)
        else:
            if capabilities != None and type(capabilities) is dict:
                cls.driver = cls.driver_class(desired_capabilities=capabilities)
            else:
                cls.driver = cls.driver_class()
        cls.webserver = Httpd(host=get_lan_ip()))
        cls.webserver.start()

    @classmethod
    def tearDownClass(cls):
        cls.webserver.stop()
        if cls.driver:
            cls.driver.quit()
