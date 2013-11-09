# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import unittest
import sys
import os

sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test

class RefreshPageTest(base_test.WebDriverBaseTest):

    # Get a static page that must be the same upon refresh
    def test_refreshPage(self):
        
        self.driver.get(self.webserver.where_is('navigation/refreshPageStatic.html'))
        body = self.driver.find_element_by_tag_name("body").text
        self.driver.execute_script("document.getElementById('body').innerHTML=''")
        self.driver.refresh()
        newbody = self.driver.find_element_by_tag_name("body").text
        self.assertEqual(body, newbody)

        self.driver.get(self.webserver.where_is('navigation/refreshPageDynamic.html'))
        body = self.driver.find_element_by_tag_name("body").text
        self.driver.refresh()
        newbody = self.driver.find_element_by_tag_name("body").text
        self.assertNotEqual(body, newbody)

if __name__ == '__main__':
    unittest.main()
