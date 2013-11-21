# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest
from selenium.webdriver.common.alert import Alert
from selenium.common.exceptions import ElementNotVisibleException, NoAlertPresentException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class AlertsTest(base_test.WebDriverBaseTest):

    def test_should_allow_users_to_accept_an_alert_manually(self):
        self.driver.get(self.webserver.where_is("modals/manual_alert.html"))
        self.driver.find_element_by_id("alert").click()
        alert = Alert(self.driver)
        alert.accept()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_should_allow_users_to_dismiss_an_alert_manually(self):
        self.driver.get(self.webserver.where_is("modals/manual_alert.html"))
        self.driver.find_element_by_id("alert").click()
        alert = Alert(self.driver)
        alert.dismiss()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_should_allow_users_to_accept_an_alert_with_no_text(self):
        self.driver.get(self.webserver.where_is("modals/empty_alerts.html"))
        self.driver.find_element_by_id("alert").click()
        alert = Alert(self.driver)
        alert.accept()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_should_get_text_of_alert_opened_in_setTimeout(self):
        self.driver.get(self.webserver.where_is("modals/slow_alert.html"))
        self.driver.find_element_by_id("alert").click()
        alert = Alert(self.driver)
        try:
            self.assertEquals("Slow", alert.text)
        finally:
            alert.accept()

    def test_should_throw_when_trying_to_send_text_to_alert(self):
        self.driver.get(self.webserver.where_is("modals/manual_alert.html"))
        self.driver.find_element_by_id("alert").click()
        alert = Alert(self.driver)
        try:
            alert.send_keys("cheese")
        except ElementNotVisibleException:
            pass
        finally:
            alert.dismiss()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_should_allow_the_user_to_get_the_text_of_an_alert(self):
        self.driver.get(self.webserver.where_is("modals/manual_alert.html"))
        self.driver.find_element_by_id("alert").click()
        alert = Alert(self.driver)
        value = alert.text
        alert.accept()
        self.assertEquals("cheese", value)

    def test_should_not_allow_additional_modal_commands_after_dismissed(self):
        self.driver.get(self.webserver.where_is("modals/manual_alert.html"))
        self.driver.find_element_by_id('alert').click()
        alert = Alert(self.driver)
        alert.dismiss()
        try:
            alert.text
        except NoAlertPresentException:
            pass

    def test_should_allow_users_to_accept_an_alert_in_a_frame(self):
        self.driver.get(self.webserver.where_is("modals/page_with_iframe.html"))
        self.driver.switch_to_frame('iframeWithAlert')
        self.driver.find_element_by_id('alertInFrame').click()
        alert = Alert(self.driver)
        alert.accept()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_should_allow_users_to_accept_an_alert_in_a_nested_frame(self):
        self.driver.get(self.webserver.where_is("modals/page_with_iframe.html"))
        self.driver.switch_to_frame('iframeWithIframe')
        self.driver.switch_to_frame('iframeWithAlert')
        self.driver.find_element_by_id('alertInFrame').click()
        alert = Alert(self.driver)
        alert.accept()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_switching_to_missing_alert_throws(self):
        try:
            Alert(self.driver)
            self.fail("Expected NoAlertPresentException")
        except NoAlertPresentException:
            pass

    def test_should_handle_alert_on_page_load_using_get(self):
        self.driver.get(self.webserver.where_is("modals/page_with_onload.html"))
        alert = Alert(self.driver)
        value = alert.text
        alert.accept()
        self.assertEquals("onload", value)

    def test_should_handle_alert_on_pageload(self):
        self.driver.get(self.webserver.where_is("modals/manual_alert.html"))
        self.driver.find_element_by_id("open-page-with-onload-alert").click()
        alert = Alert(self.driver)
        value = alert.text
        alert.accept()
        self.assertEquals("onload", value)

    def test_should_handle_alert_on_page_unload(self):
        self.driver.get(self.webserver.where_is("modals/page_with_unload.html"))
        self.driver.back()
        alert = Alert(self.driver)
        value = alert.text
        alert.accept()
        self.assertEquals("onunload", value)


class PromptsTests(base_test.WebDriverBaseTest):

    def test_should_allow_users_to_accept_a_prompt_manually(self):
        self.driver.get(self.webserver.where_is("modals/prompt_test.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        alert.accept()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_should_allow_users_to_dismiss_a_prompt_manually(self):
        self.driver.get(self.webserver.where_is("modals/prompt_test.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        alert.dismiss()
        self.assertEquals("Testing Alerts", self.driver.title)

    def test_should_allow_users_to_enter_text_into_a_prompt_manually(self):
        self.driver.get(self.webserver.where_is("modals/prompt_test.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        alert.send_keys("cheese")
        alert.accept()
        self.assertEquals("cheese", self.driver.find_element('id', 'text').text)

    def test_should_allow_users_to_get_text_of_prompt(self):
        self.driver.get(self.webserver.where_is("modals/prompt_test.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        value = alert.text
        alert.accept()
        self.assertEquals("Enter something", value)

    def test_prompt_should_use_default_value_if_no_keys_sent(self):
        self.driver.get(self.webserver.where_is("modals/prompt_with_default.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        value = alert.text
        alert.accept()
        self.assertEquals("This is the default value", value)

    def test_prompt_should_have_null_if_dismissed(self):
        self.driver.get(self.webserver.where_is("modals/prompt_with_default.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        value = alert.text
        alert.dismiss()
        self.assertEquals("null", value)

if __name__ == "__main__":
    unittest.main()
