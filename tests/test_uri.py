import unittest

from websockets.exceptions import InvalidURI
from websockets.uri import *


VALID_URIS = [
    ("ws://localhost/", (False, "localhost", 80, "/", None)),
    ("wss://localhost/", (True, "localhost", 443, "/", None)),
    ("ws://localhost/path?query", (False, "localhost", 80, "/path?query", None)),
    ("WS://LOCALHOST/PATH?QUERY", (False, "localhost", 80, "/PATH?QUERY", None)),
    ("ws://user:pass@localhost/", (False, "localhost", 80, "/", ("user", "pass"))),
    ("ws://høst/", (False, "xn--hst-0na", 80, "/", None)),
    (
        "ws://üser:påss@høst/πass",
        (False, "xn--hst-0na", 80, "/%CF%80ass", ("%C3%BCser", "p%C3%A5ss")),
    ),
]

INVALID_URIS = [
    "http://localhost/",
    "https://localhost/",
    "ws://localhost/path#fragment",
    "ws://user@localhost/",
]


class URITests(unittest.TestCase):
    def test_success(self):
        for uri, parsed in VALID_URIS:
            with self.subTest(uri=uri):
                self.assertEqual(parse_uri(uri), parsed)

    def test_error(self):
        for uri in INVALID_URIS:
            with self.subTest(uri=uri):
                with self.assertRaises(InvalidURI):
                    parse_uri(uri)
