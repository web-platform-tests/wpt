# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test

from selenium.common.exceptions import ElementNotVisibleException, NoAlertPresentException
from selenium.webdriver.support.wait import WebDriverWait


class AlertsOnUnloadTest(base_test.WebDriverBaseTest):

    def setUp(self):
        self.wait = WebDriverWait(self.driver, 5)
        self.driver.get(self.webserver.where_is('modal/alerts_onunload.html'))

    def test_alert_opened_on_get_is_dismissed(self):
        self.wait.until(lambda x: x.title == 'Testing Alerts on Unload')
        self.driver.get(self.webserver.where_is('modal/alerts.html'))
        self.wait.until(lambda x: x.title == 'Testing Alerts')

    def test_alert_opened_when_navigating_away_is_dismissed(self):
        self.wait.until(lambda x: x.title == 'Testing Alerts on Unload')
        self.driver.find_element_by_id('navigate').click()
        self.driver.get(self.webserver.where_is('modal/alerts.html'))
        self.wait.until(lambda x: x.title == 'Testing Alerts')

if __name__ == '__main__':
    unittest.main()
