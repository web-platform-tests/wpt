import os
import sys
import unittest

sys.path.insert(1, os.path.abspath(os.path.join(__file__, "../..")))
import base_test
<<<<<<< HEAD
from selenium.common import exceptions
=======
from webdriver import exceptions
>>>>>>> upstream/master


class NaturalNonVisibleElementsTest(base_test.WebDriverBaseTest):
    def test_0x0_pixel_element_is_not_visible(self):
        self.driver.get(self.webserver.where_is("element_state/res/0x0-pixels.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("div")
=======
        el = self.driver.find_element_by_css("div")
>>>>>>> upstream/master
        self.assertFalse(el.is_displayed())

    def test_0x0_pixel_text_node_is_visible(self):
        self.driver.get(self.webserver.where_is("element_state/res/0x0-pixels-text-node.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("p")
=======
        el = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertTrue(el.is_displayed())

    def test_1x1_pixel_element(self):
        self.driver.get(self.webserver.where_is("element_state/res/1x1-pixels.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("p")
=======
        el = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertTrue(el.is_displayed())

    def test_zero_sized_element_is_shown_if_decendant_has_size(self):
        self.driver.get(self.webserver.where_is("element_state/res/zero-sized-element-with-sizable-decendant.html"))
<<<<<<< HEAD
        parent = self.driver.find_element_by_css_selector("#parent")
        child = self.driver.find_element_by_css_selector("#child")
=======
        parent = self.driver.find_element_by_css("#parent")
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master

        self.assertTrue(parent.is_displayed())
        self.assertTrue(child.is_displayed())

    def test_input_type_hidden_is_never_visible(self):
        self.driver.get(self.webserver.where_is("element_state/res/input-type-hidden.html"))
<<<<<<< HEAD
        input = self.driver.find_element_by_css_selector("input")
=======
        input = self.driver.find_element_by_css("input")
>>>>>>> upstream/master
        self.assertFalse(input.is_displayed())

    def test_input_morphs_into_hidden(self):
        self.driver.get(self.webserver.where_is("element_state/res/input-morphs-into-hidden.html"))
<<<<<<< HEAD
        input = self.driver.find_element_by_css_selector("input")
=======
        input = self.driver.find_element_by_css("input")
>>>>>>> upstream/master
        self.assertFalse(input.is_displayed())

    def test_parent_node_visible_when_all_children_are_absolutely_positioned_and_overflow_is_hidden(self):
        pass

    def test_parent_of_absolutely_positioned_elements_visible_where_ancestor_overflow_is_hidden(self):
        """When a parent's ancestor hides any overflow, absolutely positioned child elements are
        still visible.  The parent container is also considered visible by webdriver for this
        reason because it is interactable."""

        self.driver.get(self.webserver.where_is("element_state/res/absolute-children-ancestor-hidden-overflow.html"))

<<<<<<< HEAD
        children = self.driver.find_elements_by_css_selector(".child")
        assert all(child.is_displayed() for child in children)

        parent = self.driver.find_element_by_css_selector("#parent")
=======
        children = self.driver.find_elements_by_css(".child")
        assert all(child.is_displayed() for child in children)

        parent = self.driver.find_element_by_css("#parent")
>>>>>>> upstream/master
        assert parent.is_displayed()

    def test_element_hidden_by_overflow_x_is_not_visible(self):
        # TODO(andreastt): This test should probably be split in three.  Also it's making two
        # assertions.
        pages = ["element_state/res/x-hidden-y-hidden.html",
                 "element_state/res/x-hidden-y-scroll.html",
                 "element_state/res/x-hidden-y-auto.html"]

        for page in pages:
            self.driver.get(self.webserver.where_is(page))
<<<<<<< HEAD
            right = self.driver.find_element_by_css_selector("#right")
            bottom_right = self.driver.find_element_by_css_selector("#bottom-right")
=======
            right = self.driver.find_element_by_css("#right")
            bottom_right = self.driver.find_element_by_css("#bottom-right")
>>>>>>> upstream/master

            self.assertFalse(right.is_displayed())
            self.assertFalse(bottom_right.is_displayed())

    def test_element_hidden_by_overflow_y_is_not_visible(self):
        # TODO(andreastt): This test should probably be split in three.  Also it's making two
        # assertions.
        pages = ["element_state/res/x-hidden-y-hidden.html",
                 "element_state/res/x-scroll-y-hidden.html",
                 "element_state/res/x-auto-y-hidden.html"]

        for page in pages:
            self.driver.get(self.webserver.where_is(page))
<<<<<<< HEAD
            bottom = self.driver.find_element_by_css_selector("#bottom")
            bottom_right = self.driver.find_element_by_css_selector("#bottom-right")
=======
            bottom = self.driver.find_element_by_css("#bottom")
            bottom_right = self.driver.find_element_by_css("#bottom-right")
>>>>>>> upstream/master

            self.assertFalse(bottom.is_displayed())
            self.assertFalse(bottom_right.is_displayed())

    def test_parent_node_visible_when_all_children_are_absolutely_position_and_overflow_is_hidden(self):
        pass

    def test_element_scrollable_by_overflow_x_is_visible(self):
        pass

    def test_element_scrollable_by_overflow_y_is_visible(self):
        pass

    def test_element_scrollable_by_overflow_x_and_y_is_visible(self):
        pass

    def test_element_scrollable_by_overflow_y_is_visible(self):
        pass

    def test_element_outside_viewport(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-outside-viewport.html"))
<<<<<<< HEAD
        hidden = self.driver.find_element_by_css_selector("div")
=======
        hidden = self.driver.find_element_by_css("div")
>>>>>>> upstream/master
        self.assertFalse(hidden.is_displayed())

    def test_element_dynamically_moved_outside_viewport(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-dynamically-moved-outside-viewport.html"))
<<<<<<< HEAD
        hidden = self.driver.find_element_by_css_selector("div")
=======
        hidden = self.driver.find_element_by_css("div")
>>>>>>> upstream/master
        self.assertFalse(hidden.is_displayed())

    def test_element_hidden_by_other_element(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-hidden-by-other-element.html"))
<<<<<<< HEAD
        overlay = self.driver.find_element_by_css_selector("#overlay")
        hidden = self.driver.find_element_by_css_selector("#hidden")
=======
        overlay = self.driver.find_element_by_css("#overlay")
        hidden = self.driver.find_element_by_css("#hidden")
>>>>>>> upstream/master

        self.assertTrue(overlay.is_displayed())
        self.assertFalse(hidden.is_displayed())

    def test_element_partially_hidden_by_other_element(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-partially-hidden-by-other-element.html"))
<<<<<<< HEAD
        partial = self.driver.find_element_by_css_selector("#partial")
=======
        partial = self.driver.find_element_by_css("#partial")
>>>>>>> upstream/master
        self.assertTrue(partial.is_displayed())

    def test_element_hidden_by_z_index(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-hidden-by-z-index.html"))
<<<<<<< HEAD
        overlay = self.driver.find_element_by_css_selector("#overlay")
        hidden = self.driver.find_element_by_css_selector("#hidden")
=======
        overlay = self.driver.find_element_by_css("#overlay")
        hidden = self.driver.find_element_by_css("#hidden")
>>>>>>> upstream/master

        self.assertTrue(overlay.is_displayed())
        self.assertFalse(hidden.is_displayed())

    def test_element_moved_outside_viewport_by_transform(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-moved-outside-viewport-by-transform.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("div")
=======
        el = self.driver.find_element_by_css("div")
>>>>>>> upstream/master
        self.assertFalse(el.is_displayed())

    def test_element_moved_behind_other_element_by_transform(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-moved-behind-other-element-by-transform.html"))
<<<<<<< HEAD
        overlay = self.driver.find_element_by_css_selector("#overlay")
        hidden = self.driver.find_element_by_css_selector("#hidden")
=======
        overlay = self.driver.find_element_by_css("#overlay")
        hidden = self.driver.find_element_by_css("#hidden")
>>>>>>> upstream/master

        self.assertTrue(overlay.is_displayed())
        self.assertFalse(hidden.is_displayed())

    def test_text_with_same_color_as_background(self):
        self.driver.get(self.webserver.where_is("element_state/res/text-with-same-color-as-background.html"))
<<<<<<< HEAD
        p = self.driver.find_element_by_css_selector("p")
=======
        p = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertFalse(p.is_displayed())

    def test_text_with_same_color_as_parent_background(self):
        self.driver.get(self.webserver.where_is("element_state/res/text-with-same-color-as-parent-background.html"))
<<<<<<< HEAD
        p = self.driver.find_element_by_css_selector("p")
=======
        p = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertFalse(p.is_displayed())

    def test_text_with_matching_color_and_background(self):
        self.driver.get(self.webserver.where_is("element_state/res/text-with-matching-color-and-background.html"))
<<<<<<< HEAD
        p = self.driver.find_element_by_css_selector("p")
=======
        p = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertTrue(p.is_displayed())

    def test_element_with_same_color_as_background(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-with-same-color-as-background.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("div")
=======
        el = self.driver.find_element_by_css("div")
>>>>>>> upstream/master
        self.assertFalse(el.is_displayed())

    def test_element_with_same_color_as_parent_background(self):
        self.driver.get(self.webserver.where_is("element_state/res/element-with-same-color-as-parent-background.html"))
<<<<<<< HEAD
        hidden = self.driver.find_element_by_css_selector("#hidden")
=======
        hidden = self.driver.find_element_by_css("#hidden")
>>>>>>> upstream/master
        self.assertFalse(hidden.is_displayed())


class BodyElementIsAlwaysDisplayedTest(base_test.WebDriverBaseTest):
    def assert_body_is_displayed_on(self, page):
        self.driver.get(self.webserver.where_is(page))
<<<<<<< HEAD
        body = self.driver.find_element_by_css_selector("body")
=======
        body = self.driver.find_element_by_css("body")
>>>>>>> upstream/master
        assert body.is_displayed()

    def test_implicit(self):
        self.assert_body_is_displayed_on("element_state/res/body_implicit.html")

    def test_empty(self):
        self.assert_body_is_displayed_on("element_state/res/body_empty.html")

    def test_visibility_hidden(self):
        self.assert_body_is_displayed_on("element_state/res/body_visibility_hidden.html")

    def test_overflow_hidden(self):
        self.assert_body_is_displayed_on("element_state/res/body_overflow_hidden.html")


class DisplayTest(base_test.WebDriverBaseTest):
    def test_display_block(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-block.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("p")
=======
        el = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertTrue(el.is_displayed())

    def test_display_none(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-none.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("p")
=======
        el = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertFalse(el.is_displayed())

    def test_display_none_hides_child_node(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-none-child.html"))
<<<<<<< HEAD
        parent = self.driver.find_element_by_css_selector("#parent")
        child = self.driver.find_element_by_css_selector("#child")
=======
        parent = self.driver.find_element_by_css("#parent")
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_display_none_hides_child_node_link(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-none-child-link.html"))
<<<<<<< HEAD
        child = self.driver.find_element_by_css_selector("#child")
=======
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master
        self.assertFalse(child.is_displayed())

    def test_display_none_hides_child_node_paragraph(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-none-child-paragraph.html"))
<<<<<<< HEAD
        child = self.driver.find_element_by_css_selector("#child")
=======
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master
        self.assertFalse(child.is_displayed())

    def test_display_none_on_parent_takes_presedence(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-none-parent-presedence.html"))
<<<<<<< HEAD
        child = self.driver.find_element_by_css_selector("#child")
=======
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master
        self.assertFalse(child.is_displayed())

    def test_display_none_on_parent_takes_presedence_over_visibility_visible(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-none-parent-presedence-visibility.html"))
<<<<<<< HEAD
        child = self.driver.find_element_by_css_selector("#child")
=======
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master
        self.assertFalse(child.is_displayed())

    def test_display_none_hidden_dynamically(self):
        self.driver.get(self.webserver.where_is("element_state/res/display-none-dynamic.html"))
<<<<<<< HEAD
        hidden = self.driver.find_element_by_css_selector("#hidden")
=======
        hidden = self.driver.find_element_by_css("#hidden")
>>>>>>> upstream/master
        self.assertFalse(hidden.is_displayed())


class VisibilityTest(base_test.WebDriverBaseTest):
    def test_element_state_hidden(self):
        self.driver.get(self.webserver.where_is("element_state/res/visibility-hidden.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("p")
=======
        el = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertFalse(el.is_displayed())

    def test_element_state_visible(self):
        self.driver.get(self.webserver.where_is("element_state/res/visibility-visible.html"))
<<<<<<< HEAD
        el = self.driver.find_element_by_css_selector("p")
=======
        el = self.driver.find_element_by_css("p")
>>>>>>> upstream/master
        self.assertTrue(el.is_displayed())

    def test_visibility_hidden_hides_child_node(self):
        self.driver.get(self.webserver.where_is("element_state/res/visibility-child.html"))
<<<<<<< HEAD
        parent = self.driver.find_element_by_css_selector("#parent")
        child = self.driver.find_element_by_css_selector("#child")
=======
        parent = self.driver.find_element_by_css("#parent")
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_visibility_hidden_hides_child_node_link(self):
        self.driver.get(self.webserver.where_is("element_state/res/visibility-child-link.html"))
<<<<<<< HEAD
        parent = self.driver.find_element_by_css_selector("#parent")
        child = self.driver.find_element_by_css_selector("#child")
=======
        parent = self.driver.find_element_by_css("#parent")
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_visibility_hidden_hides_child_node_paragraph(self):
        self.driver.get(self.webserver.where_is("element_state/res/visibility-child-paragraph.html"))
<<<<<<< HEAD
        parent = self.driver.find_element_by_css_selector("#parent")
        child = self.driver.find_element_by_css_selector("#child")
=======
        parent = self.driver.find_element_by_css("#parent")
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_visibility_hidden_on_child_takes_precedence(self):
        self.driver.get(self.webserver.where_is("element_state/res/visibility-child-presedence.html"))
<<<<<<< HEAD
        child = self.driver.find_element_by_css_selector("#child")
=======
        child = self.driver.find_element_by_css("#child")
>>>>>>> upstream/master
        self.assertTrue(child.is_displayed())

    def test_visibility_hidden_on_parent_takes_precedence_over_display_block(self):
        pass

    def test_visibility_hidden_set_dynamically(self):
        pass

    def test_should_show_element_not_visible_with_hidden_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/hidden.html"))
<<<<<<< HEAD
        singleHidden = self.driver.find_element_by_css_selector('#singleHidden')
=======
        singleHidden = self.driver.find_element_by_css('#singleHidden')
>>>>>>> upstream/master
        self.assertFalse(singleHidden.is_displayed())

    def test_should_show_element_not_visible_when_parent_element_has_hidden_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/res/hidden.html"))
<<<<<<< HEAD
        child = self.driver.find_element_by_css_selector('#child')
=======
        child = self.driver.find_element_by_css('#child')
>>>>>>> upstream/master
        self.assertFalse(child.is_displayed())


class VisibilityInteractionTest(base_test.WebDriverBaseTest):
    def test_input_hidden_is_unclickable(self):
        self.driver.get(self.webserver.where_is("element_state/res/input-type-hidden-unclickable.html"))
<<<<<<< HEAD
        input = self.driver.find_element_by_css_selector("input")
=======
        input = self.driver.find_element_by_css("input")
>>>>>>> upstream/master

        with self.assertRaises(exceptions.ElementNotVisibleException):
            input.click()

    def test_hidden_input_checkbox_is_untogglable(self):
        self.driver.get(self.webserver.where_is("element_state/res/hidden-input-type-checkbox-untogglable.html"))
<<<<<<< HEAD
        checkbox = self.driver.find_element_by_css_selector("input")
=======
        checkbox = self.driver.find_element_by_css("input")
>>>>>>> upstream/master

        with self.assertRaises(exceptions.ElementNotVisibleException):
            checkbox.click()

    def test_typing_in_hidden_input_is_impossible(self):
        self.driver.get(self.webserver.where_is("element_state/res/hidden-input-type-text-writing.html"))
<<<<<<< HEAD
        textfield = self.driver.find_element_by_css_selector("input")
=======
        textfield = self.driver.find_element_by_css("input")
>>>>>>> upstream/master

        with self.assertRaises(exceptions.ElementNotVisibleException):
            textfield.send_keys("Koha is a popular Indian cheese")


class OpacityTest(base_test.WebDriverBaseTest):
    pass


if __name__ == "__main__":
    unittest.main()
