# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class EcmasScriptTest(base_test.WebDriverBaseTest):

    @classmethod
    def setUpClass(cls):
        super(EcmasScriptTest, cls).setUpClass()
        if cls.driver.capabilities['javascriptEnabled']:
            cls.javascriptEnabled = True
        else:
            cls.javascriptEnabled = False

    def test_that_ecmascript_returns_document_title(self):
        if not self.javascriptEnabled:
            return
        self.driver.get(self.webserver.where_is("ecmascript/res/ecmascript_test.html"))

        result = self.driver.execute_script("return document.title;");
        self.assertEquals("ecmascript test", result);


  

if __name__ == "__main__":
    unittest.main()
