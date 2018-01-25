import sys
from os.path import join, dirname

import pytest

from mozlog import structured

sys.path.insert(0, join(dirname(__file__), "..", "..", ".."))

firefox = pytest.importorskip("wptrunner.browsers.firefox")

logger = structured.structuredlog.StructuredLogger("TestBrowsersFirefox")
structured.set_default_logger(logger)


def test_server_location():
    browser = firefox.FirefoxBrowser(logger,
                                     "foo/firefox",
                                      "foo/prefs",
                                      "testharness.js",
                                      config={
                                          "ports": {"http": [1234]},
                                          "domains": {"foo": "foo.bar.example.com"}
                                      },
                                      extra_prefs=[]
    )
    filename = browser.server_locations
    with open(filename, "rb") as f:
        assert f.readline() == "http://127.0.0.1:1234    primary\n"
        assert "http://foo.bar.example.com:1234" in f.read()
