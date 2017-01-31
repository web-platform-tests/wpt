# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class SwitchingFramesTest(base_test.WebDriverBaseTest):

    def test_that_switching_to_frame_by_index_updates_context_for_future_commands(self):
        self.driver.get(self.webserver.where_is("switching_frames/res/switching_frames_by_index01.html"))

        self.driver.switch_to_frame(0)
        self.assertEquals("switching frames test", self.driver.find_element_by_css('#txt').text)


    def test_that_switching_to_frame_by_second_index_with_multiple_frames_updates_context_for_future_commands(self):
        self.driver.get(self.webserver.where_is("switching_frames/res/switching_frames_by_index02.html"))

        self.driver.switch_to_frame(1)
        self.assertEquals("switching frames test", self.driver.find_element_by_css('#txt').text)


if __name__ == "__main__":
    unittest.main()
