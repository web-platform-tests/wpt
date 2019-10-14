import pytest

from webdriver.transport import Response

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline


def pin_script(session, name, script):
    body = {"script": script}

    return session.transport.send(
        "POST", "/session/{session_id}/execute/pin/{script_name}".format(
            session_id=session.session_id,
            script_name=name),
        body)


def test_pinning(session):
    response = pin_script(session, "One", "return 1;")
    assert_success(response)


def test_null_parameter_value(session, http):
    path = "/session/{session_id}/execute/sync/one".format(**vars(session))
    with http.post(path, None) as response:
        assert_error(Response.from_http(response), "invalid argument")


def test_no_browsing_context(session, closed_window):
    response = pin_script(session, "one", "return 1;")
    assert_error(response, "no such window")


def test_no_name(session):
    response = pin_script(session, None, "return 1;")
    assert_error(response, "invalid argument")


def test_not_string(session):
    response = pin_script(session, "One", "return 1;")
    assert_error(response, "invalid argument")


def test_duplicate_no_error(session):
    pin_script(session, "One", "return 2;")
    response = pin_script(session, "One", "return 1;")
    assert_success(response)