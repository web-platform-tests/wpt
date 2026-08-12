# mypy: allow-untyped-defs

import json
import os

import pytest


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
