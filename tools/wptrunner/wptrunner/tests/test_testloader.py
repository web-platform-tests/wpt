# mypy: allow-untyped-calls

from __future__ import annotations

import os
import sys
import tempfile
from typing import TYPE_CHECKING, Iterable
from unittest.mock import Mock

import pytest
from mozlog import structured

from .. import wpttest
from ..testloader import (
    DirectoryHashChunker,
    IDHashChunker,
    ManifestPathData,
    PathHashChunker,
    Subsuite,
    TagFilter,
    TestFilter,
    TestLoader,
    read_test_prefixes_from_file,
)
from .test_wpttest import make_mock_manifest

if TYPE_CHECKING:
    from tools.manifest.item import URLManifestItem as WPTURLManifestItem
    from tools.manifest.manifest import Manifest as WPTManifest
else:
    from manifest.manifest import Manifest as WPTManifest

structured.set_default_logger(structured.structuredlog.StructuredLogger("TestLoader"))

TestFilter.__test__ = False  # type: ignore[attr-defined]
TestLoader.__test__ = False  # type: ignore[attr-defined]

include_ini = """\
skip: true
[test_\u53F0]
  skip: false
"""


@pytest.fixture
def manifest() -> WPTManifest:
    manifest_json = {
        "items": {
            "testharness": {
                "a": {
                    "foo.html": [
                        "abcdef123456",
                        ["a/foo.html?b", {}],
                        ["a/foo.html?c", {}],
                    ],
                    "bar.html": [
                        "uvwxyz987654",
                        [None, {}],
                    ],
                }
            }
        },
        "url_base": "/",
        "version": 9,
    }
    return WPTManifest.from_json("/", manifest_json)



def test_loader_h2_tests() -> None:
    manifest_json = {
        "items": {
            "testharness": {
                "a": {
                    "foo.html": [
                        "abcdef123456",
                        [None, {}],
                    ],
                    "bar.h2.html": [
                        "uvwxyz987654",
                        [None, {}],
                    ],
                }
            }
        },
        "url_base": "/",
        "version": 9,
    }
    manifest = WPTManifest.from_json("/", manifest_json)
    subsuites = {}
    subsuites[""] = Subsuite("", config={})

    test_manifests: dict[WPTManifest, ManifestPathData] = {
        manifest: {
            "metadata_path": "",
            "url_base": "/",
            "tests_path": "",
            "manifest_path": "",
        }
    }

    # By default, the loader should include the h2 test.
    loader = TestLoader(test_manifests, ["testharness"], {}, subsuites)
    assert "testharness" in loader.tests[""]
    assert len(loader.tests[""]["testharness"]) == 2
    assert len(loader.disabled_tests[""]) == 0

    # We can also instruct it to skip them.
    loader = TestLoader(test_manifests, ["testharness"], {}, subsuites, include_h2=False)
    assert "testharness" in loader.tests[""]
    assert len(loader.tests[""]["testharness"]) == 1
    assert "testharness" in loader.disabled_tests[""]
    assert len(loader.disabled_tests[""]["testharness"]) == 1
    assert loader.disabled_tests[""]["testharness"][0].url == "/a/bar.h2.html"


@pytest.mark.xfail(sys.platform == "win32",
                   reason="NamedTemporaryFile cannot be reopened on Win32")
def test_include_file() -> None:
    test_cases = """
# This is a comment
/foo/bar-error.https.html
/foo/bar-success.https.html
/foo/idlharness.https.any.html
/foo/idlharness.https.any.worker.html
    """

    with tempfile.NamedTemporaryFile(mode="wt") as f:
        f.write(test_cases)
        f.flush()

        include = read_test_prefixes_from_file(f.name)

        assert len(include) == 4
        assert "/foo/bar-error.https.html" in include
        assert "/foo/bar-success.https.html" in include
        assert "/foo/idlharness.https.any.html" in include
        assert "/foo/idlharness.https.any.worker.html" in include


@pytest.mark.xfail(sys.platform == "win32",
                   reason="NamedTemporaryFile cannot be reopened on Win32")
def test_filter_unicode() -> None:
    tests = make_mock_manifest(("test", "a", 10), ("test", "a/b", 10),
                               ("test", "c", 10))

    with tempfile.NamedTemporaryFile("wb", suffix=".ini") as f:
        f.write(include_ini.encode('utf-8'))
        f.flush()

        TestFilter(manifest_path=f.name, test_manifests=tests)


def test_tag_filter() -> None:
    # Mock a structure with what `TagFilter` actually uses
    class Tagged(Mock):
        def __init__(self, tags: Iterable[str]) -> None:
            super().__init__(spec_set=wpttest.Test)
            self.tags = set(tags)

    # Case: empty filter (allow anything)
    filter = TagFilter({}, {})
    assert filter(Tagged({}))
    assert filter(Tagged({'a'}))
    assert filter(Tagged({'a', 'b'}))

    # Case: only inclusion specified, single tag
    filter = TagFilter({'a'}, {})
    assert not filter(Tagged({}))  # no `'a'`, no entry
    assert filter(Tagged({'a'}))
    assert not filter(Tagged({'b'}))
    assert filter(Tagged({'a', 'b'}))

    # Case: only inclusion specified, multiple tags
    filter = TagFilter({'a', 'b'}, {})
    assert not filter(Tagged({}))
    assert filter(Tagged({'a'}))
    assert filter(Tagged({'a', 'b'}))
    assert filter(Tagged({'b'}))
    assert not filter(Tagged({'c'}))

    # Case: only exclusion specified, single tag
    filter = TagFilter({}, {'a'})
    assert filter(Tagged({}))  # no `'a'`, no entry
    assert not filter(Tagged({'a'}))
    assert not filter(Tagged({'a', 'b'}))
    assert filter(Tagged({'b'}))

    # Case: only exclusion specified, multiple tags
    filter = TagFilter({}, {'a', 'b'})
    assert filter(Tagged({}))
    assert not filter(Tagged({'a'}))
    assert not filter(Tagged({'b'}))
    assert filter(Tagged({'c'}))

    # Case: disjoint inclusion and exclusion
    filter = TagFilter({'a'}, {'b'})
    assert not filter(Tagged({}))
    assert filter(Tagged({'a'}))
    assert not filter(Tagged({'b'}))
    assert not filter(Tagged({'a', 'b'}))  # `exclude` overrides `include`

    # Case: intersecting inclusion and exclusion
    filter = TagFilter({'a'}, {'a'})
    assert not filter(Tagged({}))
    assert not filter(Tagged({'a'}))
    assert not filter(Tagged({'a', 'b'}))  # exclusion takes precedence
    assert not filter(Tagged({'b'}))
    filter = TagFilter({'a', 'b'}, {'a'})
    assert not filter(Tagged({}))
    assert not filter(Tagged({'a'}))
    assert not filter(Tagged({'a', 'b'}))
    assert filter(Tagged({'b'}))
    filter = TagFilter({'a'}, {'a', 'b'})
    assert not filter(Tagged({}))
    assert not filter(Tagged({'a'}))
    assert not filter(Tagged({'a', 'b'}))  # exclusion takes precedence
    assert not filter(Tagged({'b'}))


def test_loader_filter_tags() -> None:
    manifest_json = {
        "items": {
            "testharness": {
                "a": {
                    "foo.html": [
                        "abcdef123456",
                        [None, {}],
                    ],
                    "bar.html": [  # will have `test-include` tag
                        "uvwxyz987654",
                        [None, {}],
                    ],
                },
                "b": {
                    "baz.html": [  # will have `test-include`, `test-exclude` tags
                        "quertyuiop@!",
                        [None, {}],
                    ],
                    "quux.html": [
                        "asdfghjkl_-'",
                        [None, {}],
                    ],
                },
            }
        },
        "url_base": "/",
        "version": 9,
    }
    manifest = WPTManifest.from_json("/", manifest_json)

    if sys.version_info >= (3, 10):
        tmpdir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
    else:
        tmpdir = tempfile.TemporaryDirectory()

    with tmpdir as metadata_path:
        a_path = os.path.join(metadata_path, "a")
        os.makedirs(a_path)
        with open(os.path.join(a_path, "bar.html.ini"), "w") as f:
            f.write("tags: [test-include]\n")

        subsuites = {}
        subsuites[""] = Subsuite("", config={})

        b_path = os.path.join(metadata_path, "b")
        os.makedirs(b_path)
        with open(os.path.join(b_path, "baz.html.ini"), "w") as f:
            f.write("tags: [test-include, test-exclude]\n")

        test_manifests: dict[WPTManifest, ManifestPathData] = {
            manifest: {
                "metadata_path": metadata_path,
                "url_base": "/",
                "tests_path": "",
                "manifest_path": "",
            }
        }

        # Check: no filter loads all tests
        loader = TestLoader(test_manifests, ["testharness"], {}, subsuites)
        assert len(loader.tests[""]["testharness"]) == 4

        # Check: specifying a single `test-include` inclusion yields `/a/bar` and `/b/baz`
        loader = TestLoader(test_manifests, ["testharness"], {}, subsuites,
                            test_filters=[TagFilter({"test-include"}, {})])
        assert len(loader.tests[""]["testharness"]) == 2
        assert loader.tests[""]["testharness"][0].id == "/a/bar.html"
        assert loader.tests[""]["testharness"][0].tags == {"dir:a", "test-include"}
        assert loader.tests[""]["testharness"][1].id == "/b/baz.html"
        assert loader.tests[""]["testharness"][1].tags == {"dir:b", "test-include", "test-exclude"}

        # Check: specifying a single `test-exclude` exclusion rejects only `/b/baz`
        loader = TestLoader(test_manifests, ["testharness"], {}, subsuites,
                            test_filters=[TagFilter({}, {"test-exclude"})])
        assert len(loader.tests[""]["testharness"]) == 3
        assert all(test.id != "/b/baz.html" for test in loader.tests[""]["testharness"])

        # Check: including `test-include` and excluding `test-exclude` yields only `/a/bar`
        loader = TestLoader(test_manifests, ["testharness"], {}, subsuites,
                            test_filters=[TagFilter({"test-include"}, {"test-exclude"})])
        assert len(loader.tests[""]["testharness"]) == 1
        assert loader.tests[""]["testharness"][0].id == "/a/bar.html"
        assert loader.tests[""]["testharness"][0].tags == {"dir:a", "test-include"}

        # Check: non-empty intersection of inclusion and exclusion yield zero tests

        loader = TestLoader(test_manifests, ["testharness"], {}, subsuites,
                            test_filters=[TagFilter({"test-include"}, {"test-include"})])
        assert len(loader.tests[""]["testharness"]) == 0

        loader = TestLoader(test_manifests, ["testharness"], {}, subsuites,
                            test_filters=[TagFilter({"test-include", "test-exclude"}, {"test-include"})])
        assert len(loader.tests[""]["testharness"]) == 0


def test_chunk_hash(manifest: WPTManifest) -> None:
    chunker1 = PathHashChunker(total_chunks=2, chunk_number=1)
    chunker2 = PathHashChunker(total_chunks=2, chunk_number=2)
    # Check that the chunkers partition the manifest (i.e., each item is
    # assigned to exactly one chunk).
    items = sorted([*chunker1(manifest), *chunker2(manifest)],  # type: ignore[arg-type]
                   key=lambda item: item[1])
    assert len(items) == 2
    test_type, test_path, tests = items[0]
    assert test_type == "testharness"
    assert test_path == os.path.join("a", "bar.html")
    assert {test.id for test in tests} == {"/a/bar.html"}
    test_type, test_path, tests = items[1]
    assert test_type == "testharness"
    assert test_path == os.path.join("a", "foo.html")
    assert {test.id for test in tests} == {"/a/foo.html?b", "/a/foo.html?c"}


def test_chunk_id_hash(manifest: WPTManifest) -> None:
    chunker1 = IDHashChunker(total_chunks=2, chunk_number=1)
    chunker2 = IDHashChunker(total_chunks=2, chunk_number=2)
    items: list[tuple[str, str, WPTURLManifestItem]] = []
    for test_type, test_path, tests in [*chunker1(manifest), *chunker2(manifest)]:  # type: ignore[arg-type]
        assert len(tests) > 0
        items.extend((test_type, test_path, test) for test in tests)
    assert len(items) == 3
    items.sort(key=lambda item: item[2].id)
    test_type, test_path, test = items[0]
    assert test_type == "testharness"
    assert test_path == os.path.join("a", "bar.html")
    assert test.id == "/a/bar.html"
    test_type, test_path, test = items[1]
    assert test_type == "testharness"
    assert test_path == os.path.join("a", "foo.html")
    assert test.id == "/a/foo.html?b"
    test_type, test_path, test = items[2]
    assert test_type == "testharness"
    assert test_path == os.path.join("a", "foo.html")
    assert test.id == "/a/foo.html?c"


def test_chunk_dir_hash(manifest: WPTManifest) -> None:
    chunker1 = DirectoryHashChunker(total_chunks=2, chunk_number=1)
    chunker2 = DirectoryHashChunker(total_chunks=2, chunk_number=2)
    # Check that tests in the same directory are located in the same chunk
    # (which particular chunk is irrelevant).
    empty_chunk, chunk_a = sorted([
        list(chunker1(manifest)),  # type: ignore[arg-type]
        list(chunker2(manifest)),  # type: ignore[arg-type]
    ], key=len)
    assert len(empty_chunk) == 0
    assert len(chunk_a) == 2
    test_type, test_path, tests = chunk_a[0]
    assert test_type == "testharness"
    assert test_path == os.path.join("a", "bar.html")
    assert {test.id for test in tests} == {"/a/bar.html"}
    test_type, test_path, tests = chunk_a[1]
    assert test_type == "testharness"
    assert test_path == os.path.join("a", "foo.html")
    assert {test.id for test in tests} == {"/a/foo.html?b", "/a/foo.html?c"}
