import pytest

from webdriver.transport import Response

from tests.support.asserts import assert_error, assert_success


def pin_script(session, name, script):
    body = {"script": script}

    return session.transport.send(
        "POST", "/session/{session_id}/execute/pin/{script_name}".format(
            session_id=session.session_id,
            script_name=name),
        body)


def execute_async_script(session, script, name=None, args=None):
    if args is None:
        args = []
    body = {"script": script, "args": args}

    return session.transport.send(
        "POST", "/session/{session_id}/execute/async/{script_name}".format(
            session_id=session.session_id,
            script_name=name),
        body)


def test_execute_pinned(session):
    pin_script(session, "One", "return 1;")
    response = execute_async_script(session, name="One")
    assert_success(response, 1)


def test_name_and_script(session):
    pin_script(session, "One", "return 1;")
    response = execute_async_script(session, "return 1;", name="One")
    assert_error(response, "invalid argument")


def test_no_such_pinned_script(session):
    response = execute_async_script(session, name="One")
    assert_error(response, "no such script")


def test_execute_pinned_with_args(session, http):
    pin_script(session, "One", "arguments[arguments.length - 1](arguments[0] + arguments[1]);")
    response = execute_async_script(session, name="One", args=[1, 2])
    assert_success(response, 3)
