# type: ignore
import unittest
import os

from tools.manifest.sourcefile import SourceFile

class TestSourceFileTest262(unittest.TestCase):
    def test_name_is_test262(self) -> None:
        # Create a mock SourceFile object
        tests_root = "/tmp"
        rel_path = "test262/test.js"
        url_base = "/"
        sf = SourceFile(tests_root, rel_path, url_base)
        self.assertTrue(sf.name_is_test262)

        rel_path = "other/test.js"
        sf = SourceFile(tests_root, rel_path, url_base)
        self.assertFalse(sf.name_is_test262)

    def test_test262_test_record(self) -> None:
        tests_root = os.path.join(os.path.dirname(__file__), "testdata")
        rel_path = "test262/test.js"
        url_base = "/"
        sf = SourceFile(tests_root, rel_path, url_base)
        record = sf.test262_test_record
        self.assertIsNotNone(record)
        self.assertEqual(record["description"], "A simple test")

    def test_manifest_items_test262(self) -> None:
        tests_root = os.path.join(os.path.dirname(__file__), "testdata")
        rel_path = "test262/test.js"
        url_base = "/"
        sf = SourceFile(tests_root, rel_path, url_base)
        item_type, items = sf.manifest_items()
        self.assertEqual(item_type, "testharness")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].url, "/test262/test.test262.html")

    def test_manifest_items_test262_module(self) -> None:
        tests_root = os.path.join(os.path.dirname(__file__), "testdata")
        rel_path = "test262/module.js"
        url_base = "/"
        sf = SourceFile(tests_root, rel_path, url_base)
        item_type, items = sf.manifest_items()
        self.assertEqual(item_type, "testharness")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].url, "/test262/module.test262-module.html")

    def test_manifest_items_test262_strict(self) -> None:
        tests_root = os.path.join(os.path.dirname(__file__), "testdata")
        rel_path = "test262/strict.js"
        url_base = "/"
        sf = SourceFile(tests_root, rel_path, url_base)
        item_type, items = sf.manifest_items()
        self.assertEqual(item_type, "testharness")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].url, "/test262/strict.test262.strict.html")

if __name__ == '__main__':
    unittest.main()
