# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

from selenium.common.exceptions import ElementNotVisibleException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class NaturalNonVisibleElementsTest(base_test.WebDriverBaseTest):
    def test_0x0_pixel_element_is_not_visible(self):
        self.driver.get(self.webserver.where_is("element_state/0x0-pixels.html"))
        el = self.driver.find_element_by_tag_name("div")
        self.assertFalse(el.is_displayed())

    def test_0x0_pixel_text_node_is_visible(self):
        self.driver.get(self.webserver.where_is("element_state/0x0-pixels-text-node.html"))
        el = self.driver.find_element_by_tag_name("p")
        self.assertTrue(el.is_displayed())

    def test_1x1_pixel_element(self):
        self.driver.get(self.webserver.where_is("element_state/1x1-pixels.html"))
        el = self.driver.find_element_by_tag_name("p")
        self.assertTrue(el.is_displayed())

    def test_zero_sized_element_is_shown_if_decendant_has_size(self):
        self.driver.get(self.webserver.where_is("element_state/zero-sized-element-with-sizable-decendant.html"))
        parent = self.driver.find_element_by_id("parent")
        child = self.driver.find_element_by_id("child")

        self.assertTrue(parent.is_displayed())
        self.assertTrue(child.is_displayed())

    def test_input_type_hidden_is_never_visible(self):
        self.driver.get(self.webserver.where_is("element_state/input-type-hidden.html"))
        input = self.driver.find_element_by_tag_name("input")
        self.assertFalse(input.is_displayed())

    def test_input_morphs_into_hidden(self):
        self.driver.get(self.webserver.where_is("element_state/input-morphs-into-hidden.html"))
        input = self.driver.find_element_by_tag_name("input")
        self.assertFalse(input.is_displayed())

    def test_parent_node_visible_when_all_children_are_absolutely_positioned_and_overflow_is_hidden(self):
        pass

    def test_parent_of_absolutely_positioned_elements_visible_where_ancestor_overflow_is_hidden(self):
        """When a parent's ancestor hides any overflow, absolutely positioned child elements are
        still visible.  The parent container is also considered visible by webdriver for this
        reason because it is interactable."""

        self.driver.get(self.webserver.where_is("element_state/absolute-children-ancestor-hidden-overflow.html"))

        ancestor = self.driver.find_element_by_tag_name("body")
        assert not ancestor.is_displayed()

        children = self.driver.find_elements_by_class("child")
        assert all(child.is_displayed() for child in children)

        parent = self.driver.find_element_by_id("parent")
        assert parent.is_displayed()

    def test_element_hidden_by_overflow_x_is_not_visible(self):
        # TODO(andreastt): This test should probably be split in three.  Also it's making two
        # assertions.
        pages = ["element_state/x-hidden-y-hidden.html",
                 "element_state/x-hidden-y-scroll.html",
                 "element_state/x-hidden-y-auto.html"]

        for page in pages:
            self.driver.get(self.webserver.where_is(page))
            right = self.driver.find_element_by_id("right")
            bottom_right = self.driver.find_element_by_id("bottom-right")

            self.assertFalse(right.is_displayed())
            self.assertFalse(bottom_right.is_displayed())

    def test_element_hidden_by_overflow_y_is_not_visible(self):
        # TODO(andreastt): This test should probably be split in three.  Also it's making two
        # assertions.
        pages = ["element_state/x-hidden-y-hidden.html",
                 "element_state/x-scroll-y-hidden.html",
                 "element_state/x-auto-y-hidden.html"]

        for page in pages:
            self.driver.get(self.webserver.where_is(page))
            bottom = self.driver.find_element_by_id("bottom")
            bottom_right = self.driver.find_element_by_id("bottom-right")

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
        self.driver.get(self.webserver.where_is("element_state/element-outside-viewport.html"))
        hidden = self.driver.find_element_by_tag_name("div")
        self.assertFalse(hidden.is_displayed())

    def test_element_dynamically_moved_outside_viewport(self):
        self.driver.get(self.webserver.where_is("element_state/element-dynamically-moved-outside-viewport.html"))
        hidden = self.driver.find_element_by_tag_name("div")
        self.assertFalse(hidden.is_displayed())

    def test_element_hidden_by_other_element(self):
        self.driver.get(self.webserver.where_is("element_state/element-hidden-by-other-element.html"))
        overlay = self.driver.find_element_by_id("overlay")
        hidden = self.driver.find_element_by_id("hidden")

        self.assertTrue(overlay.is_displayed())
        self.assertFalse(hidden.is_displayed())

    def test_element_partially_hidden_by_other_element(self):
        self.driver.get(self.webserver.where_is("element_state/element-partially-hidden-by-other-element.html"))
        partial = self.driver.find_element_by_id("partial")
        self.assertTrue(partial.is_displayed())

    def test_element_hidden_by_z_index(self):
        self.driver.get(self.webserver.where_is("element_state/element-hidden-by-z-index.html"))
        overlay = self.driver.find_element_by_id("overlay")
        hidden = self.driver.find_element_by_id("hidden")

        self.assertTrue(overlay.is_displayed())
        self.assertFalse(hidden.is_displayed())

    def test_element_moved_outside_viewport_by_transform(self):
        self.driver.get(self.webserver.where_is("element_state/element-moved-outside-viewport-by-transform.html"))
        el = self.driver.find_element_by_tag_name("div")
        self.assertFalse(el.is_displayed())

    def test_element_moved_behind_other_element_by_transform(self):
        self.driver.get(self.webserver.where_is("element_state/element-moved-behind-other-element-by-transform.html"))
        overlay = self.driver.find_element_by_id("overlay")
        hidden = self.driver.find_element_by_id("hidden")

        self.assertTrue(overlay.is_displayed())
        self.assertFalse(hidden.is_displayed())

    def test_text_with_same_color_as_background(self):
        self.driver.get(self.webserver.where_is("element_state/text-with-same-color-as-background.html"))
        p = self.driver.find_element_by_tag_name("p")
        self.assertFalse(p.is_displayed())

    def test_text_with_same_color_as_parent_background(self):
        self.driver.get(self.webserver.where_is("element_state/text-with-same-color-as-parent-background.html"))
        p = self.driver.find_element_by_tag_name("p")
        self.assertFalse(p.is_displayed())

    def test_text_with_matching_color_and_background(self):
        self.driver.get(self.webserver.where_is("element_state/text-with-matching-color-and-background.html"))
        p = self.driver.find_element_by_tag_name("p")
        self.assertTrue(p.is_displayed())

    def test_element_with_same_color_as_background(self):
        self.driver.get(self.webserver.where_is("element_state/element-with-same-color-as-background.html"))
        el = self.driver.find_element_by_tag_name("div")
        self.assertFalse(el.is_displayed())

    def test_element_with_same_color_as_parent_background(self):
        self.driver.get(self.webserver.where_is("element_state/element-with-same-color-as-parent-background.html"))
        hidden = self.driver.find_element_by_id("hidden")
        self.assertFalse(hidden.is_displayed())


class DisplayTest(base_test.WebDriverBaseTest):
    def test_display_block(self):
        self.driver.get(self.webserver.where_is("element_state/display-block.html"))
        el = self.driver.find_element_by_tag_name("p")
        self.assertTrue(el.is_displayed())

    def test_display_none(self):
        self.driver.get(self.webserver.where_is("element_state/display-none.html"))
        el = self.driver.find_element_by_tag_name("p")
        self.assertFalse(el.is_displayed())

    def test_display_none_hides_child_node(self):
        self.driver.get(self.webserver.where_is("element_state/display-none-child.html"))
        parent = self.driver.find_element_by_id("parent")
        child = self.driver.find_element_by_id("child")

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_display_none_hides_child_node_link(self):
        self.driver.get(self.webserver.where_is("element_state/display-none-child-link.html"))
        child = self.driver.find_element_by_id("child")
        self.assertFalse(child.is_displayed())

    def test_display_none_hides_child_node_paragraph(self):
        self.driver.get(self.webserver.where_is("element_state/display-none-child-paragraph.html"))
        child = self.driver.find_element_by_id("child")
        self.assertFalse(child.is_displayed())

    def test_display_none_on_parent_takes_presedence(self):
        self.driver.get(self.webserver.where_is("element_state/display-none-parent-presedence.html"))
        child = self.driver.find_element_by_id("child")
        self.assertFalse(child.is_displayed())

    def test_display_none_on_parent_takes_presedence_over_visibility_visible(self):
        self.driver.get(self.webserver.where_is("element_state/display-none-parent-presedence-visibility.html"))
        child = self.driver.find_element_by_id("child")
        self.assertFalse(child.is_displayed())

    def test_display_none_hidden_dynamically(self):
        self.driver.get(self.webserver.where_is("element_state/display-none-dynamic.html"))
        hidden = self.driver.find_element_by_id("hidden")
        self.assertFalse(hidden.is_displayed())


class VisibilityTest(base_test.WebDriverBaseTest):
    def test_element_state_hidden(self):
        self.driver.get(self.webserver.where_is("element_state/visibility-hidden.html"))
        el = self.driver.find_element_by_tag_name("p")
        self.assertFalse(el.is_displayed())

    def test_element_state_visible(self):
        self.driver.get(self.webserver.where_is("element_state/visibility-visible.html"))
        el = self.driver.find_element_by_tag_name("p")
        self.assertTrue(el.is_displayed())

    def test_visibility_hidden_hides_child_node(self):
        self.driver.get(self.webserver.where_is("element_state/visibility-child.html"))
        parent = self.driver.find_element_by_id("parent")
        child = self.driver.find_element_by_id("child")

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_visibility_hidden_hides_child_node_link(self):
        self.driver.get(self.webserver.where_is("element_state/visibility-child-link.html"))
        parent = self.driver.find_element_by_id("parent")
        child = self.driver.find_element_by_id("child")

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_visibility_hidden_hides_child_node_paragraph(self):
        self.driver.get(self.webserver.where_is("element_state/visibility-child-paragraph.html"))
        parent = self.driver.find_element_by_id("parent")
        child = self.driver.find_element_by_id("child")

        self.assertFalse(parent.is_displayed())
        self.assertFalse(child.is_displayed())

    def test_visibility_hidden_on_child_takes_presedence(self):
        self.driver.get(self.webserver.where_is("element_state/visibility-child-presedence.html"))
        child = self.driver.find_element_by_id("child")
        self.assertTrue(child.is_displayed())

    def test_visibility_hidden_on_parent_takes_presedence_over_display_block(self):
        pass

    def test_visibility_hidden_set_dynamically(self):
        pass

    def test_should_show_element_not_visible_with_hidden_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/hidden.html"))
        singleHidden = self.driver.find_element('id', 'singleHidden')
        self.assertFalse(singleHidden.is_displayed())

    def test_should_show_element_not_visible_when_parent_element_has_hidden_attribute(self):
        self.driver.get(self.webserver.where_is("element_state/hidden.html"))
        child = self.driver.find_element('id', 'child')
        self.assertFalse(child.is_displayed())


class VisibilityInteractionTest(base_test.WebDriverBaseTest):
    def test_input_hidden_is_unclickable(self):
        self.driver.get(self.webserver.where_is("element_state/input-type-hidden-unclickable.html"))
        input = self.driver.find_element_by_tag_name("input")

        with self.assertRaises(ElementNotVisibleException):
            input.click()

    def test_hidden_input_checkbox_is_untogglable(self):
        self.driver.get(self.webserver.where_is("element_state/hidden-input-type-checkbox-untogglable.html"))
        checkbox = self.driver.find_element_by_tag_name("input")

        with self.assertRaises(ElementNotVisibleException):
            checkbox.click()

    def test_typing_in_hidden_input_is_impossible(self):
        self.driver.get(self.webserver.where_is("element_state/hidden-input-type-text-writing.html"))
        textfield = self.driver.find_element_by_tag_name("input")

        with self.assertRaises(ElementNotVisibleException):
            textfield.send_keys("Koha is a popular Indian cheese")


class OpacityTest(base_test.WebDriverBaseTest):
    pass

if __name__ == "__main__":
    unittest.main()
