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

    def test_retrieve_handle_and_ensure_it_isnt_current(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))

        handle = self.driver.get_window_handle()

        self.assertNotEquals(handle, "current")

    def test_switch_window(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))

        first_title = self.driver.find_element_by_id("title").get_text()

        self.driver.find_element_by_id("open_new_window").click()

        handles = self.driver.get_window_handles()
        self.driver.switch_to_window(handles[0])
        new_title1 = self.driver.find_element_by_id("title").get_text()
        self.driver.switch_to_window(handles[1])
        new_title2 = self.driver.find_element_by_id("title").get_text()

        self.assertNotEquals(new_title1, new_title2)
        
        self.driver.close()
        self.driver.switch_to_window(self.driver.get_window_handles()[0])

    def test_close_window(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))
        
        self.driver.find_element_by_id("open_new_window").click()
        self.driver.close()

        self.assertEquals(1, len(self.driver.get_window_handles()))

        self.driver.switch_to_window(self.driver.get_window_handles()[0])

    def test_no_such_window(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))
        self.driver.find_element_by_id("open_new_window").click()
        self.driver.close()

        caught= False
        try:
            self.driver.find_element_by_id("open_new_window")
        except exceptions.NoSuchWindowException:
            caught= True
        except exceptions.NoSuchFrameException:
            caught= True
        except:
            pass

        self.assertTrue(caught)

        self.driver.switch_to_window(self.driver.get_window_handles()[0])

    def test_open_several_new_windows(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))

        number_of_windows = random.randrange(5, 8, 1)

        for i in range(0, number_of_windows):
            self.driver.find_element_by_id("open_new_window").click()

        handles = self.driver.get_window_handles()

        self.assertEquals(len(handles), 1 + number_of_windows)
        
        for i in range(0, number_of_windows):
            self.driver.switch_to_window(handles[i])
            self.driver.close()

        self.driver.switch_to_window(self.driver.get_window_handles()[0])

    def test_window_handles_are_unique(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))

        number_of_windows = 20

        for i in range(0, number_of_windows):
            self.driver.find_element_by_id("open_new_window").click()

        handles = self.driver.get_window_handles()

        unique = True
        for i in range(0, len(handles)):
            for j in range(i + 1, len(handles)):
                unique= unique and handles[i] != handles[j]

        self.assertTrue(unique)
        
        for i in range(0, number_of_windows):
            self.driver.switch_to_window(handles[i])
            self.driver.close()

        self.driver.switch_to_window(self.driver.get_window_handles()[0])

    def test_number_of_handles(self):
        self.driver.get(self.webserver.where_is("controlling_windows/res/first-page.html"))

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
        
        self.driver.close()
        self.driver.switch_to_window(self.driver.get_window_handles()[0])

if __name__ == "__main__":
    unittest.main()
