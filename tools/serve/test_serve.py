# mypy: allow-untyped-defs

import logging
import os
import pickle
import platform
import unittest
from unittest.mock import MagicMock

import pytest

import localpaths  # type: ignore
from . import serve
from .serve import ConfigBuilder, inject_script


logger = logging.getLogger()

@pytest.mark.skipif(platform.uname()[0] == "Windows",
                    reason="Expected contents are platform-dependent")
def test_make_hosts_file_nix():
    with ConfigBuilder(logger,
                       ports={"http": [8000]},
                       browser_host="foo.bar",
                       alternate_hosts={"alt": "foo2.bar"},
                       subdomains={"a", "b"},
                       not_subdomains={"x, y"}) as c:
        hosts = serve.make_hosts_file(c, "192.168.42.42")
        lines = hosts.split("\n")
        assert lines == [
            "# Start web-platform-tests hosts",
            "192.168.42.42\tfoo.bar",
            "192.168.42.42\ta.foo.bar",
            "192.168.42.42\tb.foo.bar",
            "192.168.42.42\tfoo2.bar",
            "192.168.42.42\ta.foo2.bar",
            "192.168.42.42\tb.foo2.bar",
            "# End web-platform-tests hosts",
            "",
        ]


@pytest.mark.skipif(platform.uname()[0] != "Windows",
                    reason="Expected contents are platform-dependent")
def test_make_hosts_file_windows():
    with ConfigBuilder(logger,
                       ports={"http": [8000]},
                       browser_host="foo.bar",
                       alternate_hosts={"alt": "foo2.bar"},
                       subdomains={"a", "b"},
                       not_subdomains={"x", "y"}) as c:
        hosts = serve.make_hosts_file(c, "192.168.42.42")
        lines = hosts.split("\n")
        assert lines == [
            "# Start web-platform-tests hosts",
            "192.168.42.42\tfoo.bar",
            "192.168.42.42\ta.foo.bar",
            "192.168.42.42\tb.foo.bar",
            "192.168.42.42\tfoo2.bar",
            "192.168.42.42\ta.foo2.bar",
            "192.168.42.42\tb.foo2.bar",
            "0.0.0.0\tx.foo.bar",
            "0.0.0.0\ty.foo.bar",
            "0.0.0.0\tx.foo2.bar",
            "0.0.0.0\ty.foo2.bar",
            "# End web-platform-tests hosts",
            "",
        ]


def test_ws_doc_root_default():
    with ConfigBuilder(logger) as c:
        assert c.doc_root == localpaths.repo_root
        assert c.ws_doc_root == os.path.join(localpaths.repo_root, "websockets", "handlers")
        assert c.paths["ws_doc_root"] == c.ws_doc_root


def test_init_ws_doc_root():
    with ConfigBuilder(logger, ws_doc_root="/") as c:
        assert c.doc_root == localpaths.repo_root  # check this hasn't changed
        assert c.ws_doc_root == "/"
        assert c.paths["ws_doc_root"] == c.ws_doc_root


def test_set_ws_doc_root():
    cb = ConfigBuilder(logger)
    cb.ws_doc_root = "/"
    with cb as c:
        assert c.doc_root == localpaths.repo_root  # check this hasn't changed
        assert c.ws_doc_root == "/"
        assert c.paths["ws_doc_root"] == c.ws_doc_root


def test_pickle():
    # Ensure that the config object can be pickled
    with ConfigBuilder(logger) as c:
        pickle.dumps(c)


def test_alternate_host_unspecified():
    ConfigBuilder(logger, browser_host="web-platform.test")


@pytest.mark.parametrize("primary, alternate", [
    ("web-platform.test", "web-platform.test"),
    ("a.web-platform.test", "web-platform.test"),
    ("web-platform.test", "a.web-platform.test"),
    ("a.web-platform.test", "a.web-platform.test"),
])
def test_alternate_host_invalid(primary, alternate):
    with pytest.raises(ValueError):
        ConfigBuilder(logger, browser_host=primary, alternate_hosts={"alt": alternate})

@pytest.mark.parametrize("primary, alternate", [
    ("web-platform.test", "not-web-platform.test"),
    ("a.web-platform.test", "b.web-platform.test"),
    ("web-platform-tests.dev", "web-platform-tests.live"),
])
def test_alternate_host_valid(primary, alternate):
    ConfigBuilder(logger, browser_host=primary, alternate_hosts={"alt": alternate})


# A token marking the location of expected script injection.
INJECT_SCRIPT_MARKER = b"<!-- inject here -->"


def test_inject_script_after_head():
    html = b"""<!DOCTYPE html>
    <html>
        <head>
        <!-- inject here --><script src="test.js"></script>
        </head>
        <body>
        </body>
    </html>"""
    assert INJECT_SCRIPT_MARKER in html
    assert inject_script(html.replace(INJECT_SCRIPT_MARKER, b""),
                         INJECT_SCRIPT_MARKER) == html


def test_inject_script_no_html_head():
    html = b"""<!DOCTYPE html>
    <!-- inject here --><div></div>"""
    assert INJECT_SCRIPT_MARKER in html
    assert inject_script(html.replace(INJECT_SCRIPT_MARKER, b""),
                         INJECT_SCRIPT_MARKER) == html


def test_inject_script_no_doctype():
    html = b"""<!-- inject here --><div></div>"""
    assert INJECT_SCRIPT_MARKER in html
    assert inject_script(html.replace(INJECT_SCRIPT_MARKER, b""),
                         INJECT_SCRIPT_MARKER) == html


def test_inject_script_parse_error():
    html = b"""<!--<!-- inject here --><div></div>"""
    assert INJECT_SCRIPT_MARKER in html
    # On a parse error, the script should not be injected and the original content should be
    # returned.
    assert INJECT_SCRIPT_MARKER not in inject_script(html.replace(INJECT_SCRIPT_MARKER, b""),
                                                 INJECT_SCRIPT_MARKER)

class TestTest262Handlers(unittest.TestCase):
    def setUp(self) -> None:
        from tools.serve.serve import (
            Test262WindowTestHandler,
            Test262WindowModuleTestHandler)
        self.Test262WindowTestHandler = Test262WindowTestHandler
        self.Test262WindowModuleTestHandler = Test262WindowModuleTestHandler

        self.tests_root = os.path.join(os.path.dirname(__file__), "tests", "testdata")
        self.url_base = "/"

        # Create dummy test files for TestRecord.parse to read
        os.makedirs(os.path.join(self.tests_root, "test262"), exist_ok=True)
        with open(os.path.join(self.tests_root, "test262", "basic.js"), "w") as f:
            f.write("""/*---\ndescription: A basic test
includes: [assert.js, sta.js]
---*/
assert.sameValue(1, 1);
""")
        with open(os.path.join(self.tests_root, "test262", "negative.js"), "w") as f:
            f.write("""/*---\ndescription: A negative test
negative:
  phase: runtime
  type: TypeError
---*/
throw new TypeError();
""")
        with open(os.path.join(self.tests_root, "test262", "module.js"), "w") as f:
            f.write("""/*---\ndescription: A module test
flags: [module]
---*/
import {} from 'some-module';
""")

    def tearDown(self) -> None:
        # Clean up dummy test files and directories
        os.remove(os.path.join(self.tests_root, "test262", "basic.js"))
        os.remove(os.path.join(self.tests_root, "test262", "negative.js"))
        os.remove(os.path.join(self.tests_root, "test262", "module.js"))
        os.rmdir(os.path.join(self.tests_root, "test262"))
        os.rmdir(self.tests_root)

    def _create_mock_request(self, path: str) -> MagicMock:
        mock_request = MagicMock()
        mock_request.url_parts.path = path
        mock_request.url_parts.query = ""
        return mock_request

    def test_test262_window_test_handler_path_replace(self) -> None:
        handler = self.Test262WindowTestHandler(base_path=self.tests_root, url_base=self.url_base)
        self.assertEqual(handler.path_replace, [(".test262-test.html", ".js")])

    def test_test262_window_test_handler_get_metadata_includes(self) -> None:
        handler = self.Test262WindowTestHandler(base_path=self.tests_root, url_base=self.url_base)
        mock_request = self._create_mock_request("/test262/basic.test262-test.html")
        metadata = list(handler._get_metadata(mock_request))
        self.assertIn(('script', '/test262/harness/assert.js'), metadata)
        self.assertIn(('script', '/test262/harness/sta.js'), metadata)

    def test_test262_window_test_handler_get_metadata_negative(self) -> None:
        handler = self.Test262WindowTestHandler(base_path=self.tests_root, url_base=self.url_base)
        mock_request = self._create_mock_request("/test262/negative.test262-test.html")
        metadata = list(handler._get_metadata(mock_request))
        self.assertIn(('negative', 'TypeError'), metadata)

    def test_test262_window_test_handler_wrapper_content(self) -> None:
        handler = self.Test262WindowTestHandler(base_path=self.tests_root, url_base=self.url_base)
        mock_request = self._create_mock_request("/test262/basic.test262-test.html")
        mock_response = MagicMock()
        handler.handle_request(mock_request, mock_response)
        content = mock_response.content
        self.assertIn("<script src=\"/resources/test262/testharness-client.js\"></script>", content)
        self.assertIn("<script src=\"/test262/harness/assert.js\"></script>", content)
        self.assertIn("<script src=\"/test262/harness/sta.js\"></script>", content)
        self.assertIn("<script>test262Setup()</script>", content)
        self.assertIn("<script src=\"/test262/basic.js\"></script>", content)
        self.assertIn("<script>test262Done()</script>", content)

    def test_test262_window_module_test_handler_path_replace(self) -> None:
        handler = self.Test262WindowModuleTestHandler(base_path=self.tests_root, url_base=self.url_base)
        self.assertEqual(handler.path_replace, [(".test262-module-test.html", ".js")])

    def test_test262_window_module_test_handler_wrapper_content(self) -> None:
        handler = self.Test262WindowModuleTestHandler(base_path=self.tests_root, url_base=self.url_base)
        mock_request = self._create_mock_request("/test262/module.test262-module-test.html")
        mock_response = MagicMock()
        handler.handle_request(mock_request, mock_response)
        content = mock_response.content
        self.assertIn("<script type=\"module\">", content)
        self.assertIn("import {} from \"/test262/module.js\";", content)