# mypy: allow-untyped-defs, allow-incomplete-defs

import collections
import copy
import json
import os

import pytest

from typing import Optional
from urllib.parse import urlencode


BOILERPLATES = {
    "html": "<!doctype html>\n<meta charset={charset}>\n{src}",
    "html_quirks": "{src}",
    "xhtml": """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
  <head>
    <title>XHTML might be the future</title>
  </head>

  <body>
    {src}
  </body>
</html>""",
    "xml": """<?xml version="1.0" encoding="{charset}"?>\n{src}""",
    "js": "{src}",
}
MIME_TYPES = {
    "html": "text/html",
    "html_quirks": "text/html",
    "xhtml": "application/xhtml+xml",
    "xml": "text/xml",
    "js": "text/javascript",
}


@pytest.fixture(scope="session")
def full_configuration():
    """Get test configuration information. Keys are:

    host - WebDriver server host.
    port -  WebDriver server port.
    capabilities - Capabilities passed when creating the WebDriver session
    timeout_multiplier - Multiplier for timeout values
    webdriver - Dict with keys `binary`: path to webdriver binary, and
                `args`: Additional command line arguments passed to the webdriver
                binary. This doesn't include all the required arguments e.g. the
                port.
    wptserve - Configuration of the wptserve servers."""

    with open(os.environ.get("WDSPEC_CONFIG_FILE"), "r") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def configuration(full_configuration):
    """Configuation minus server config.

    This makes logging easier to read."""

    config = full_configuration.copy()
    del config["wptserve"]

    return config


@pytest.fixture(scope="session")
def server_config(full_configuration):
    return full_configuration["wptserve"]


@pytest.fixture
def default_capabilities():
    """Default capabilities to use for a new WebDriver session."""
    return {}


def deep_update(source, overrides):
    """
    Update a nested dictionary or similar mapping.
    Modify ``source`` in place.
    """
    for key, value in overrides.items():
        if isinstance(value, collections.abc.Mapping) and value:
            source[key] = deep_update(source.get(key, {}), value)
        elif isinstance(value, list) and isinstance(source.get(key), list) and value:
            # Concatenate lists, ensuring all elements are kept without duplicates
            source[key] = list(dict.fromkeys(source[key] + value))
        else:
            source[key] = value

    return source


@pytest.fixture
def capabilities(request, default_capabilities):
    """Merges default capabilities with any test-specific capabilities from a marker."""
    marker = request.node.get_closest_marker("capabilities")
    if marker and marker.args:
        # Ensure the first positional argument is a dictionary
        assert isinstance(
            marker.args[0], dict), "capabilities marker must use a dictionary"
        caps = copy.deepcopy(default_capabilities)
        deep_update(caps, marker.args[0])
        return caps

    return default_capabilities  # Use defaults if no marker is present


def build_inline(build_url, src,
                 doctype: str = "html",
                 mime: Optional[str] = None, charset: Optional[str] = None,
                 parameters=None, **kwargs):
    if mime is None:
        mime = MIME_TYPES[doctype]
    if charset is None:
        charset = "UTF-8"
    if parameters is None:
        parameters = {}

    doc = BOILERPLATES[doctype].format(charset=charset, src=src)

    query = {"doc": doc, "mime": mime, "charset": charset}
    query.update(parameters)

    return build_url(
        "/webdriver/tests/support/inline.py",
        query=urlencode(query),
        **kwargs)


@pytest.fixture
def inline(url):
    """Take a source extract and produces well-formed documents.

    Based on the desired document type, the extract is embedded with
    predefined boilerplate in order to produce well-formed documents.
    The media type and character set may also be individually configured.

    This helper function originally used data URLs, but since these
    are not universally supported (or indeed standardised!) across
    browsers, it now delegates the serving of the document to wptserve.
    This file also acts as a wptserve handler (see the main function
    below) which configures the HTTP response using query parameters.

    This function returns a URL to the wptserve handler, which in turn
    will serve an HTTP response with the requested source extract
    inlined in a well-formed document, and the Content-Type header
    optionally configured using the desired media type and character set.

    Any additional keyword arguments are passed on to the build_url
    function, which comes from the url fixture.
    """
    def inline(src, **kwargs):
        return build_inline(url, src, **kwargs)

    return inline
