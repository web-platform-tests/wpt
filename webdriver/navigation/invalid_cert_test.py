# -*- mode: python; fill-column: 100; comment-column: 100; -*-

import BaseHTTPServer
import os
import ssl
import sys
import unittest

sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
import base_test

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))


class InvalidCertTest(base_test.WebDriverBaseTest):

    def testCanNavigateToSiteWithSelfSignedCert(self):
        self.webserver.httpd.socket = ssl.wrap_socket(
            self.webserver.httpd.socket,
            certfile=os.path.join(_THIS_DIR, 'self-signed.key'),
            server_side=True)

        self.driver.get(
            self.webserver.where_is('navigation/empty.html').replace('http:', 'https:', 1))

        self.assertEquals('Cheese', self.driver.title)


if __name__ == '__main__':
    unittest.main()
