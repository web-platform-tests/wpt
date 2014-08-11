import os
import sys
import unittest

sys.path.insert(1, os.path.abspath(os.path.join(__file__, "../..")))
import base_test


class GetElementAttributeTest(base_test.WebDriverBaseTest):
    def test_get_element_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-with-id-attribute.html"))
        el = self.driver.find_element_by_css("div")
        self.assertEqual("myId", el.get_attribute("id"))

    def test_style_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-with-style-attribute.html"))
        el = self.driver.find_element_by_css("div")
        expected_style = """
                         font-family: \"Gill Sans Extrabold\",Helvetica,sans-serif;
                         line-height: 1.2; font-weight: bold;
                         """
        self.assertEqual(expected_style, el.get_attribute("style"))

    def test_color_serialization_of_style_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-with-color-style-attribute.html"))
        el = self.driver.find_element_by_css("div")
        self.assertEqual("color: rgba(255, 0, 0, 1.0);", el.get_attribute("style"))

    def test_true_if_boolean_attribute_present(self):
        self.driver.get(self.webserver.where_is("element_state/res/input-with-checked-attribute.html"))
        el = self.driver.find_element_by_css("input")
        self.assertEqual("true", el.get_attribute("checked"))

    def test_none_if_boolean_attribute_absent(self):
        self.driver.get(self.webserver.where_is("element_state/res/input-without-checked-attribute.html"))
        el = self.driver.find_element_by_css("input")
        self.assertIsNone(el.get_attribute("checked"))

    def test_option_with_attribute_value(self):
        self.driver.get(self.webserver.where_is("element_state/res/option-with-value-attribute.html"))
        el = self.driver.find_element_by_css("option")
        self.assertEqual("value1", el.get_attribute("value"))

    def test_option_without_value_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/option-without-value-attribute.html"))
        el = self.driver.find_element_by_css("option")
        self.assertEqual("Value 1", el.get_attribute("value"))

    def test_a_href_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/a-with-href-attribute.html"))
        el = self.driver.find_element_by_css("a")
        self.assertEqual("http://web-platform.test:8000/path#fragment", el.get_attribute("href"))

    def test_img_src_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/img-with-src-attribute.html"))
        el = self.driver.find_element_by_css("img")
        self.assertEqual("http://web-platform.test:8000/images/blue.png", el.get_attribute("src"))

    def test_custom_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-with-custom-attribute.html"))
        el = self.driver.find_element_by_css("div")
        self.assertEqual("attribute value", el.get_attribute("webdriver-custom-attribute"))

    def test_attribute_not_present(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-without-attribute.html"))
        el = self.driver.find_element_by_css("div")
        self.assertIsNone(el.get_attribute("class"))

    def test_find_span_element_in_first_level_under_body(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("div1")
        attribute = element.get_attribute("name")
        self.assertEquals("div-name", attribute)

    def test_find_a_value_element_in_option_element_that_doesnt_have_a_value_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("opt-1")
        attribute = element.get_attribute("value")
        self.assertEquals("My Option 1", attribute)

    def test_find_value_for_a_style_attribute_in_option_element(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("opt-1")
        attribute = element.get_attribute("style")
        self.assertEquals("font-size: 11px; display: block;", attribute)

    #def test_find_attribute_that_does_not_exist(self):
    #    self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
    #    element = self.driver.find_element_by_id("attribute_that_does_not_exist")
    #    attribute = element.get_attribute("lang")
    #    self.assertEquals('', attribute)

    def test_find_attribute_accesskey(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_attribute_accesskey")
        attribute = element.get_attribute("accesskey")
        self.assertEquals("nothing", attribute)

    def test_multiple_element_state_with_same_class_nested_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_multiple_elements_same_class_nested_div_depth_2")
        attribute = element.get_attribute("class")
        self.assertEquals("multiple_elements_same_class_nested", attribute)

    def test_find_attribute_with_special_characters(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_special_char_attribute_name")
        attribute = element.get_attribute("*")
        self.assertEquals("special_char_attribute_name", attribute)

    def test_find_attribute_with_special_char_name_and_value(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_special_char_attribute_name_and_value")
        attribute = element.get_attribute("@")
        self.assertEquals("(", attribute)

    def test_find_attribute_with_numeric_name(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_attribute_name_numeric")
        attribute = element.get_attribute("1")
        self.assertEquals("numeric attribute name", attribute)

    def test_find_attribute_with_numeric_value(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_attribute_value_numeric")
        attribute = element.get_attribute("one")
        self.assertEquals("2", attribute)

    def test_find_attribute_with_negative_numeric_name(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_attribute_negative_numeric_name")
        attribute = element.get_attribute("-5")
        self.assertEquals("attribute name is -5", attribute)

    def test_find_attribute_with_negative_numeric_value(self):
        self.driver.get(self.webserver.where_is("element_state/res/get-element-attribute-extended.html"))
        element = self.driver.find_element_by_id("id_attribute_negative_numeric_value")
        attribute = element.get_attribute("negative_numeric_value")
        self.assertEquals("-9", attribute)


if __name__ == "__main__":
    unittest.main()
