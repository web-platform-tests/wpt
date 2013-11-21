# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest
from selenium.webdriver.common.alert import Alert

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class PromptsTests(base_test.WebDriverBaseTest):

    def test_should_allow_users_to_accept_a_prompt_manually(self):
        self.driver.get(self.webserver.where_is("modals/prompt_test.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        alert.accept()
        self.assertEquals("Prompt Test", self.driver.title)

    def test_should_allow_users_to_dismiss_a_prompt_manually(self):
        self.driver.get(self.webserver.where_is("modals/prompt_test.html"))
        self.driver.find_element_by_id("prompt").click()
        alert = Alert(self.driver)
        alert.dismiss()
        self.assertEquals("Prompt Test", self.driver.title)

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