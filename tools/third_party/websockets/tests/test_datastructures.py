import unittest

from websockets.datastructures import *


class HeadersTests(unittest.TestCase):
    def setUp(self):
        self.headers = Headers([("Connection", "Upgrade"), ("Server", "websockets")])

    def test_str(self):
        self.assertEqual(
            str(self.headers), "Connection: Upgrade\r\nServer: websockets\r\n\r\n"
        )

    def test_repr(self):
        self.assertEqual(
            repr(self.headers),
            "Headers([('Connection', 'Upgrade'), ('Server', 'websockets')])",
        )

    def test_copy(self):
        self.assertEqual(repr(self.headers.copy()), repr(self.headers))

    def test_serialize(self):
        self.assertEqual(
            self.headers.serialize(),
            b"Connection: Upgrade\r\nServer: websockets\r\n\r\n",
        )

    def test_multiple_values_error_str(self):
        self.assertEqual(str(MultipleValuesError("Connection")), "'Connection'")
        self.assertEqual(str(MultipleValuesError()), "")

    def test_contains(self):
        self.assertIn("Server", self.headers)

    def test_contains_case_insensitive(self):
        self.assertIn("server", self.headers)

    def test_contains_not_found(self):
        self.assertNotIn("Date", self.headers)

    def test_contains_non_string_key(self):
        self.assertNotIn(42, self.headers)

    def test_iter(self):
        self.assertEqual(set(iter(self.headers)), {"connection", "server"})

    def test_len(self):
        self.assertEqual(len(self.headers), 2)

    def test_getitem(self):
        self.assertEqual(self.headers["Server"], "websockets")

    def test_getitem_case_insensitive(self):
        self.assertEqual(self.headers["server"], "websockets")

    def test_getitem_key_error(self):
        with self.assertRaises(KeyError):
            self.headers["Upgrade"]

    def test_getitem_multiple_values_error(self):
        self.headers["Server"] = "2"
        with self.assertRaises(MultipleValuesError):
            self.headers["Server"]

    def test_setitem(self):
        self.headers["Upgrade"] = "websocket"
        self.assertEqual(self.headers["Upgrade"], "websocket")

    def test_setitem_case_insensitive(self):
        self.headers["upgrade"] = "websocket"
        self.assertEqual(self.headers["Upgrade"], "websocket")

    def test_setitem_multiple_values(self):
        self.headers["Connection"] = "close"
        with self.assertRaises(MultipleValuesError):
            self.headers["Connection"]

    def test_delitem(self):
        del self.headers["Connection"]
        with self.assertRaises(KeyError):
            self.headers["Connection"]

    def test_delitem_case_insensitive(self):
        del self.headers["connection"]
        with self.assertRaises(KeyError):
            self.headers["Connection"]

    def test_delitem_multiple_values(self):
        self.headers["Connection"] = "close"
        del self.headers["Connection"]
        with self.assertRaises(KeyError):
            self.headers["Connection"]

    def test_eq(self):
        other_headers = Headers([("Connection", "Upgrade"), ("Server", "websockets")])
        self.assertEqual(self.headers, other_headers)

    def test_eq_not_equal(self):
        other_headers = Headers([("Connection", "close"), ("Server", "websockets")])
        self.assertNotEqual(self.headers, other_headers)

    def test_eq_other_type(self):
        self.assertNotEqual(
            self.headers, "Connection: Upgrade\r\nServer: websockets\r\n\r\n"
        )

    def test_clear(self):
        self.headers.clear()
        self.assertFalse(self.headers)
        self.assertEqual(self.headers, Headers())

    def test_get_all(self):
        self.assertEqual(self.headers.get_all("Connection"), ["Upgrade"])

    def test_get_all_case_insensitive(self):
        self.assertEqual(self.headers.get_all("connection"), ["Upgrade"])

    def test_get_all_no_values(self):
        self.assertEqual(self.headers.get_all("Upgrade"), [])

    def test_get_all_multiple_values(self):
        self.headers["Connection"] = "close"
        self.assertEqual(self.headers.get_all("Connection"), ["Upgrade", "close"])

    def test_raw_items(self):
        self.assertEqual(
            list(self.headers.raw_items()),
            [("Connection", "Upgrade"), ("Server", "websockets")],
        )
