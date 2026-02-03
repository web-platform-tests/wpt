from copy import deepcopy

import pytest

from webdriver.transport import HTTPWireProtocol


def product(a, b):
    return [(a, item) for item in b]


def flatten(a):
    return [item for x in a for item in x]


@pytest.fixture(name="add_browser_capabilities")
def fixture_add_browser_capabilities(capabilities):
    existing_capabilities = capabilities
    assert "firstMatch" not in existing_capabilities, "Cannot handle firstMatch capabilities in add_browser_capabilities"

    def add_browser_capabilities(capabilities):
        assert "alwaysMatch" not in capabilities and "firstMatch" not in capabilities, "add_browser_capabilities can only add alwaysMatch capabailities"
        existing_alwaysMatch = existing_capabilities.get("alwaysMatch", {})
        # Make sure there aren't keys in common.
        assert not set(existing_alwaysMatch).intersection(set(capabilities))
        result = deepcopy(existing_alwaysMatch)
        result.update(capabilities)

        return result

    return add_browser_capabilities


@pytest.fixture(name="default_capabilities")
def fixture_default_capabilities(default_capabilities):
    """Remove "acceptInsecureCerts" from capabilities if it exists.

    Some browser configurations add acceptInsecureCerts capability by default.
    Remove it during new_session tests to avoid interference.
    """

    # Check we aren't somehow dealing with capabilities without alwaysMatch/firstMatch:
    assert len(default_capabilities) == 0 or "alwaysMatch" in default_capabilities or "firstMatch" in default_capabilities

    capabilities = deepcopy(default_capabilities)

    alwaysMatch = capabilities.get("alwaysMatch", {})
    if "acceptInsecureCerts" in alwaysMatch:
        del alwaysMatch["acceptInsecureCerts"]

    firstMatch = capabilities.get("firstMatch", [])
    for caps in firstMatch:
        if "acceptInsecureCerts" in firstMatch:
            del firstMatch["acceptInsecureCerts"]

    return capabilities


@pytest.fixture(name="new_session")
def fixture_new_session(configuration, current_session):
    """Start a new session for tests which themselves test creating new sessions.

    :param body: The content of the body for the new session POST request.

    :param delete_existing_session: Allows the fixture to delete an already
     created custom session before the new session is getting created. This
     is useful for tests which call this fixture multiple times within the
     same test.
    """
    transport = HTTPWireProtocol(
        configuration["host"],
        configuration["port"],
        url_prefix="/",
    )

    custom_session = {
        "capabilities": None,
        "sessionId": None,
        "transport": transport,
    }

    def _delete_session(session_id):
        response = transport.send("DELETE", "session/{}".format(session_id))
        if response.status != 200:
            raise Exception("Failed to delete WebDriver session")

    def new_session(body, delete_existing_session=False):
        # If there is an active session from the global session fixture,
        # delete that one first
        if current_session is not None:
            current_session.end()

        if delete_existing_session:
            _delete_session(custom_session["sessionId"])

        response = transport.send("POST", "session", body)
        if response.status == 200:
            custom_session["sessionId"] = response.body["value"]["sessionId"]
            custom_session["capabilities"] = response.body["value"]["capabilities"]
        return response, custom_session

    yield new_session

    if custom_session["sessionId"] is not None:
        _delete_session(custom_session["sessionId"])
        custom_session = None
