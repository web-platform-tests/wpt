import pytest
from tests.support.asserts import assert_error, assert_success


def get_shadow_root(session, shadow_id):
    return session.transport.send(
        "GET", "session/{session_id}/element/{shadow_id}/shadow".format(
            session_id=session.session_id,
            shadow_id=shadow_id))


def test_no_top_browsing_context(session, closed_window):
    original_handle, element = closed_window
    response = get_shadow_root(session, element.id)
    assert_error(response, "no such window")
    response = get_shadow_root(session, "foo")
    assert_error(response, "no such window")

    session.window_handle = original_handle
    response = get_shadow_root(session, element.id)
    assert_error(response, "no such element")


def test_no_browsing_context(session, closed_frame):
    response = get_shadow_root(session, "foo")
    assert_error(response, "no such window")


def test_element_not_found(session):
    result = get_shadow_root(session, "foo")
    assert_error(result, "no such element")


def test_element_stale(session, get_checkbox_dom):
    session.url = get_checkbox_dom
    element = session.find.css("custom-checkbox-element", all=False)
    session.refresh()

    result = get_shadow_root(session, element.id)
    assert_error(result, "stale element reference")


def test_get_shadow_root(session, get_checkbox_dom):
    session.url = get_checkbox_dom
    custom_element = session.find.css("custom-checkbox-element", all=False)
    response = get_shadow_root(session, custom_element)
    assert_success(response)


def test_no_shadow_root(session, inline):
    session.url = inline("<div><p>no shadow root</p></div>")
    element = session.find.css("div", all=False)
    response = get_shadow_root(session, element)
    assert_error(response, "no such shadow root")
