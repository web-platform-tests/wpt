import os
import sys
import random
import unittest

sys.path.insert(1, os.path.abspath(os.path.join(__file__, "../..")))
import base_test

repo_root = os.path.abspath(os.path.join(__file__, "../../.."))
sys.path.insert(1, os.path.join(repo_root, "tools", "webdriver"))
from webdriver import exceptions

class WindowSizeTest(base_test.WebDriverBaseTest):

    def test_send_simple_string(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")
        element.send_keys("lorem ipsum")

        self.assertEquals(self.driver.find_element_by_id("text").get_text(), u"lorem ipsum")

    def test_send_return(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")
        returnkey = unichr(int("E006", 16))
        element.send_keys([returnkey])

        self.assertEquals(u"" + self.driver.get_current_url(), u"" + self.webserver.where_is("user_input/res/text-form-landing.html?e=mc2"))

    def test_send_backspace(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")
        element.send_keys("world ")
        element.send_keys("wide ")
        element.send_keys("web ")
        element.send_keys("corporation")

        backspace= unichr(int("E003", 16))
        for i in range(0, 11):
            element.send_keys([backspace])

        element.send_keys("consortium")

        self.assertEquals(self.driver.find_element_by_id("text").get_text(), u"world wide web consortium")

    def test_send_tab(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element1 = self.driver.find_element_by_id("Text1")
        element2 = self.driver.find_element_by_id("Text2")
        element1.send_keys("typing here")

        tab= unichr(int("E004", 16))
        element1.send_keys([tab])

        output = self.driver.find_element_by_id("output")
        tab_pressed = output.get_attribute("checked")
        self.assertEquals(tab_pressed, u"true")

    def test_send_shift(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")
        element.send_keys("low ")

        shift= unichr(int("E008", 16))
        element.send_keys([shift , "u", "p", shift])

        self.assertEquals(self.driver.find_element_by_id("text").get_text(), u"low UP")

    def test_send_null(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")
        element.send_keys("low ")
        
        null= unichr(int("E000", 16))
        shift= unichr(int("E008", 16))
        element.send_keys([shift, "u", "p", null, " ", "l", "o", "w"])

        self.assertEquals(self.driver.find_element_by_id("text").get_text(), u"low UP low")

    def test_send_arrow_keys(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")
        
        element.send_keys("internet")
        
        backspace= unichr(int("E003", 16))
        left= unichr(int("E012", 16))
        right= unichr(int("E014", 16))
        for i in range(0, 4):
            element.send_keys([left])

        element.send_keys([backspace])
        element.send_keys([right])
        element.send_keys("a")

        self.assertEquals(self.driver.find_element_by_id("text").get_text(), u"intranet")

    def test_select_text_with_shift(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")
        
        element.send_keys("WebDriver")
        backspace= unichr(int("E003", 16))
        shift= unichr(int("E008", 16))
        left= unichr(int("E012", 16))

        element.send_keys([shift, left, left, left, left, left, left, backspace])

        self.assertEquals(self.driver.find_element_by_id("text").get_text(), u"Web")

    def test_send_special_math_symbols(self):
        self.driver.get(self.webserver.where_is("user_input/res/text-form.html"))
        element = self.driver.find_element_by_id("Text1")

        equals = unichr(int("E019", 16))
        numpad0 = unichr(int("E01A", 16))
        numpad1 = unichr(int("E01B", 16))
        numpad2 = unichr(int("E01C", 16))
        numpad3 = unichr(int("E01D", 16))
        numpad4 = unichr(int("E01E", 16))
        numpad5 = unichr(int("E01F", 16))
        numpad6 = unichr(int("E020", 16))
        numpad7 = unichr(int("E021", 16))
        numpad8 = unichr(int("E022", 16))
        numpad9 = unichr(int("E023", 16))
        multiply = unichr(int("E024", 16))
        add = unichr(int("E025", 16))
        separator = unichr(int("E026", 16))
        subtract = unichr(int("E027", 16))
        decimal = unichr(int("E028", 16))
        divide = unichr(int("E029", 16))
        
        element.send_keys([equals])
        element.send_keys([numpad0])
        element.send_keys([numpad1])
        element.send_keys([numpad2])
        element.send_keys([numpad3])
        element.send_keys([numpad4])
        element.send_keys([numpad5])
        element.send_keys([numpad6])
        element.send_keys([numpad7])
        element.send_keys([numpad8])
        element.send_keys([numpad9])
        element.send_keys([multiply])
        element.send_keys([add])
        element.send_keys([separator])
        element.send_keys([subtract])
        element.send_keys([decimal])
        element.send_keys([divide])
        
        self.assertEquals(self.driver.find_element_by_id("text").get_text(), u"=0123456789*+,-./")


if __name__ == "__main__":
    unittest.main()
