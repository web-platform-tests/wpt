import os
import pytest

from tests.support.asserts import assert_error, assert_success
from urllib.parse import quote

def load_extension(session, parameters):
    return session.transport.send(
        "POST", "session/%s/webextension" % session.session_id,
        {"type": parameters.get("type"), "value": parameters.get("value")})


def unload_extension(session, extension_id):
    return session.transport.send("DELETE", "session/%s/webextension/%s" % (session.session_id, extension_id))


def test_no_top_browsing_context(session, closed_window):
    response = unload_extension(session, "extension_id")
    assert_error(response, "no such window")


def test_unload_extension_invalid_extension_id(session):
    response = unload_extension(session, "extension_id")
    assert_error(response, "no such extension")


def test_unload_extension(session):
    extension = {
        "type": "path",
        "value": os.path.join(os.path.dirname(__file__), "resources/extension/")
    }

    response = load_extension(session, extension)
    assert_success(response)

    extension_id = quote(response.body["value"]["extensionId"])
    response = unload_extension(session, extension_id)
    assert_success(response)
