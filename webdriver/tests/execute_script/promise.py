# META: timeout=long

import pytest

from tests.support.asserts import assert_dialog_handled, assert_error, assert_success


def execute_script(session, script, args=None):
    if args is None:
        args = []
    body = {"script": script, "args": args}

    return session.transport.send(
        "POST", "/session/{session_id}/execute/sync".format(
            session_id=session.session_id),
        body)


def set_timeouts(session, timeouts):
    return session.transport.send(
        "POST", "session/{session_id}/timeouts".format(**vars(session)),
        timeouts)


def test_promise_resolve(session):
    response = execute_script(session, """
        return new Promise(
            (resolve) => setTimeout(
                () => resolve('foobar'),
                1
            )
        );
        """)
    assert_success(response, "foobar")


def test_promise_reject(session):
    response = execute_script(session, """
        return new Promise(
            (resolve, reject) => setTimeout(
                () => reject('some_error'),
                1
            )
        );
        """)
    assert_error(response, "some_error")


def test_promise_timeout(session):
    response = set_timeouts(session, {"script": 100})
    response = execute_script(session, """
        return new Promise(
            (resolve) => setTimeout(
                () => resolve('timeout_error'),
                200
            )
        );
        """)
    assert_error(response, "timeout_error")