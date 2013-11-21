# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test


class EcmasScriptTest(base_test.WebDriverBaseTest):

    def test_that_ecmascript_returns_document_title(self):
        self.driver.get(self.webserver.where_is("ecmascript/ecmascript_test.html"))

        result = self.driver.execute_script("return document.title;");
        self.assertEquals("ecmascript test", result);


  

if __name__ == "__main__":
    unittest.main()
