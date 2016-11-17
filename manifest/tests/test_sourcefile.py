import pytest

from ..sourcefile import SourceFile

def create(filename, contents=b""):
    assert isinstance(contents, bytes)
    return SourceFile("/", filename, "/", contents=contents)


def items(s):
    item_type, items = s.manifest_items()
    if item_type == "support":
        return []
    else:
        return [(item_type, item.url) for item in items]


@pytest.mark.parametrize("rel_path", [
    ".gitignore",
    ".travis.yml",
    "MANIFEST.json",
    "tools/test.html",
    "resources/test.html",
    "common/test.html",
    "support/test.html",
    "conformance-checkers/test.html",
    "conformance-checkers/README.md",
    "conformance-checkers/html/Makefile",
    "conformance-checkers/html/test.html",
    "foo/tools/test.html",
    "foo/resources/test.html",
    "foo/support/test.html",
])
def test_name_is_non_test(rel_path):
    s = create(rel_path)
    assert s.name_is_non_test or s.name_is_conformance_support

    assert not s.content_is_testharness

    assert items(s) == []


@pytest.mark.parametrize("rel_path", [
    "foo/common/test.html",
    "foo/conformance-checkers/test.html",
    "foo/_certs/test.html",
])
def test_not_name_is_non_test(rel_path):
    s = create(rel_path)
    assert not (s.name_is_non_test or s.name_is_conformance_support)
    # We aren't actually asserting what type of test these are, just their
    # name doesn't prohibit them from being tests.


@pytest.mark.parametrize("rel_path", [
    "html/test-manual.html",
    "html/test-manual.xhtml",
    "html/test-manual.https.html",
    "html/test-manual.https.xhtml"
])
def test_name_is_manual(rel_path):
    s = create(rel_path)
    assert not s.name_is_non_test
    assert s.name_is_manual

    assert not s.content_is_testharness

    assert items(s) == [("manual", "/" + rel_path)]


def test_worker():
    s = create("html/test.worker.js")
    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert s.name_is_worker
    assert not s.name_is_reference

    assert not s.content_is_testharness

    assert items(s) == [("testharness", "/html/test.worker.html")]


def test_multi_global():
    s = create("html/test.any.js")
    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert not s.content_is_testharness

    assert items(s) == [
        ("testharness", "/html/test.any.html"),
        ("testharness", "/html/test.any.worker.html"),
    ]


@pytest.mark.parametrize("ext", ["htm", "html"])
def test_testharness(ext):
    content = b"<script src=/resources/testharness.js></script>"

    filename = "html/test." + ext
    s = create(filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert s.content_is_testharness

    assert items(s) == [("testharness", "/" + filename)]


@pytest.mark.parametrize("ext", ["htm", "html"])
def test_relative_testharness(ext):
    content = b"<script src=../resources/testharness.js></script>"

    filename = "html/test." + ext
    s = create(filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert not s.content_is_testharness

    assert items(s) == []


@pytest.mark.parametrize("ext", ["xhtml", "xht", "xml"])
def test_testharness_xhtml(ext):
    content = b"""
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
</head>
<body/>
</html>
"""

    filename = "html/test." + ext
    s = create(filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert s.content_is_testharness

    assert items(s) == [("testharness", "/" + filename)]


@pytest.mark.parametrize("ext", ["xhtml", "xht", "xml"])
def test_relative_testharness_xhtml(ext):
    content = b"""
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<script src="../resources/testharness.js"></script>
<script src="../resources/testharnessreport.js"></script>
</head>
<body/>
</html>
"""

    filename = "html/test." + ext
    s = create(filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert not s.content_is_testharness

    assert items(s) == []


def test_testharness_svg():
    content = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:h="http://www.w3.org/1999/xhtml"
     version="1.1"
     width="100%" height="100%" viewBox="0 0 400 400">
<title>Null test</title>
<h:script src="/resources/testharness.js"/>
<h:script src="/resources/testharnessreport.js"/>
</svg>
"""

    filename = "html/test.svg"
    s = create(filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert s.root
    assert s.content_is_testharness

    assert items(s) == [("testharness", "/" + filename)]


def test_relative_testharness_svg():
    content = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:h="http://www.w3.org/1999/xhtml"
     version="1.1"
     width="100%" height="100%" viewBox="0 0 400 400">
<title>Null test</title>
<h:script src="../resources/testharness.js"/>
<h:script src="../resources/testharnessreport.js"/>
</svg>
"""

    filename = "html/test.svg"
    s = create(filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert s.root
    assert not s.content_is_testharness

    assert items(s) == []


@pytest.mark.parametrize("filename", ["test", "test.test"])
def test_testharness_ext(filename):
    content = b"<script src=/resources/testharness.js></script>"

    s = create("html/" + filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference

    assert not s.root
    assert not s.content_is_testharness

    assert items(s) == []


@pytest.mark.parametrize("ext", ["htm", "html"])
def test_reftest_node(ext):
    content = b"<link rel=match href=ref.html>"

    filename = "foo/test." + ext
    s = create(filename, content)

    assert not s.name_is_non_test
    assert not s.name_is_manual
    assert not s.name_is_multi_global
    assert not s.name_is_worker
    assert not s.name_is_reference
    assert not s.content_is_testharness

    assert s.content_is_ref_node

    assert items(s) == [("reftest_node", "/" + filename)]
