import unittest

from websockets.http import *


class HTTPTests(unittest.TestCase):
    def test_build_host(self):
        for (host, port, secure), result in [
            (("localhost", 80, False), "localhost"),
            (("localhost", 8000, False), "localhost:8000"),
            (("localhost", 443, True), "localhost"),
            (("localhost", 8443, True), "localhost:8443"),
            (("example.com", 80, False), "example.com"),
            (("example.com", 8000, False), "example.com:8000"),
            (("example.com", 443, True), "example.com"),
            (("example.com", 8443, True), "example.com:8443"),
            (("127.0.0.1", 80, False), "127.0.0.1"),
            (("127.0.0.1", 8000, False), "127.0.0.1:8000"),
            (("127.0.0.1", 443, True), "127.0.0.1"),
            (("127.0.0.1", 8443, True), "127.0.0.1:8443"),
            (("::1", 80, False), "[::1]"),
            (("::1", 8000, False), "[::1]:8000"),
            (("::1", 443, True), "[::1]"),
            (("::1", 8443, True), "[::1]:8443"),
        ]:
            with self.subTest(host=host, port=port, secure=secure):
                self.assertEqual(build_host(host, port, secure), result)
