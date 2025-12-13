# type: ignore
import os

from tools.manifest.sourcefile import SourceFile

def test_name_is_test262() -> None:
    # Create a mock SourceFile object
    tests_root = "/tmp"
    rel_path = "test262/test.js"
    url_base = "/"
    sf = SourceFile(tests_root, rel_path, url_base)
    assert sf.name_is_test262

    rel_path = "other/test.js"
    sf = SourceFile(tests_root, rel_path, url_base)
    assert not sf.name_is_test262

def test_test262_test_record() -> None:
    tests_root = os.path.join(os.path.dirname(__file__), "testdata")
    rel_path = "test262/test.js"
    url_base = "/"
    sf = SourceFile(tests_root, rel_path, url_base)
    record = sf.test262_test_record
    assert record is not None
    assert record["description"] == "A simple test"

def test_manifest_items_test262() -> None:
    tests_root = os.path.join(os.path.dirname(__file__), "testdata")
    rel_path = "test262/test.js"
    url_base = "/"
    sf = SourceFile(tests_root, rel_path, url_base)
    item_type, items = sf.manifest_items()
    assert item_type == "test262"
    assert len(items) == 1
    assert items[0].url == "/test262/test.test262.html"

def test_manifest_items_test262_module() -> None:
    tests_root = os.path.join(os.path.dirname(__file__), "testdata")
    rel_path = "test262/module.js"
    url_base = "/"
    sf = SourceFile(tests_root, rel_path, url_base)
    item_type, items = sf.manifest_items()
    assert item_type == "test262"
    assert len(items) == 1
    assert items[0].url == "/test262/module.test262-module.html"

def test_manifest_items_test262_strict() -> None:
    tests_root = os.path.join(os.path.dirname(__file__), "testdata")
    rel_path = "test262/strict.js"
    url_base = "/"
    sf = SourceFile(tests_root, rel_path, url_base)
    item_type, items = sf.manifest_items()
    assert item_type == "test262"
    assert len(items) == 1
    assert items[0].url == "/test262/strict.test262.strict.html"
