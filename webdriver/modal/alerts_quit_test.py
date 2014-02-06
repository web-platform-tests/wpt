# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test

from selenium.common.exceptions import NoAlertPresentException
from selenium.webdriver.support.wait import WebDriverWait


class AlertsQuitTest(base_test.WebDriverBaseTest):

    def setUp(self):
        self.wait = WebDriverWait(self.driver, 5, ignored_exceptions = [NoAlertPresentException])
        self.driver.get(self.webserver.where_is('modal/alerts.html'))

    def test_can_quit_when_an_alert_is_present(self):
        self.driver.find_element_by_id('alert').click()
        alert = self.wait.until(lambda x: x.switch_to_alert())
        self.driver.quit()
        with self.assertRaises(Exception):
        	alert.accept()
        AlertsQuitTest.driver = None
