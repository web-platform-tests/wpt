import os
import sys
import random
import unittest

sys.path.insert(1, os.path.abspath(os.path.join(__file__, "../..")))
import base_test

repo_root = os.path.abspath(os.path.join(__file__, "../../.."))
sys.path.insert(1, os.path.join(repo_root, "tools", "webdriver"))
from webdriver import exceptions


class WindowHandleTest(base_test.WebDriverBaseTest):
    def setUp(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))

    def test_window_handle_is_not_current(self):
        handle = self.driver.get_window_handle()
        self.assertNotEquals(handle, "current")

    def test_window_handles_are_unique(self):
        number_of_windows = 20
        
        new_window_button = self.driver.find_element_by_id("open_new_window")
        for i in range(0, number_of_windows):
            new_window_button.click()

        handles = self.driver.get_window_handles()
        
        if len(handles) > len(set(handles)):
            self.fail('At least one window handle was repeated')

    def test_number_of_windows(self):
        self.driver.find_element_by_id("open_new_window").click()
        self.driver.find_element_by_id("open_new_window").click()
        self.driver.find_element_by_id("open_new_window").click()

        self.driver.close()
        self.driver.switch_to_window(self.driver.get_window_handles()[0])
        self.driver.close()
        self.driver.switch_to_window(self.driver.get_window_handles()[0])
        self.driver.close()
        self.driver.switch_to_window(self.driver.get_window_handles()[0])

        self.driver.find_element_by_id("open_new_window").click()

        new_handles = self.driver.get_window_handles()
        after_open_and_close = len(new_handles)

        self.assertEquals(2, after_open_and_close)

if __name__ == "__main__":
    unittest.main()
