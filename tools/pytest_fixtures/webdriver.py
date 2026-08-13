# mypy: allow-untyped-defs

import copy
import json
import os

import pytest

from tests.support.helpers import deep_update

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


@pytest.fixture
def default_capabilities():
    """Default capabilities to use for a new WebDriver session."""
    return {}


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
