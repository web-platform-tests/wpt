import pytest

from webdriver import Element
from webdriver.transport import Response

from tests.support.asserts import assert_error, assert_success


def element_send_keys(session, element, text):
    return session.transport.send(
        "POST", "/session/{session_id}/element/{element_id}/value".format(
            session_id=session.session_id,
            element_id=element.id),
        {"text": text})


def test_null_parameter_value(session, http, inline):
    session.url = inline("<input>")
    element = session.find.css("input", all=False)

    path = "/session/{session_id}/element/{element_id}/value".format(
        session_id=session.session_id, element_id=element.id)
    with http.post(path, None) as response:
        assert_error(Response.from_http(response), "invalid argument")


def test_null_response_value(session, inline):
    session.url = inline("<input>")
    element = session.find.css("input", all=False)

    response = element_send_keys(session, element, "foo")
    value = assert_success(response)
    assert value is None


def test_no_top_browsing_context(session, closed_window):
    element = Element("foo", session)
    response = element_send_keys(session, element, "foo")
    assert_error(response, "no such window")

    original_handle, element = closed_window
    response = element_send_keys(session, element, "foo")
    assert_error(response, "no such window")

    session.window_handle = original_handle
    response = element_send_keys(session, element, "foo")
    assert_error(response, "no such element")


def test_no_browsing_context(session, closed_frame):
    element = Element("foo", session)

    response = element_send_keys(session, element, "foo")
    assert_error(response, "no such window")


@pytest.mark.parametrize("value", [True, None, 1, [], {}])
def test_invalid_text_type(session, inline, value):
    session.url = inline("<input>")
    element = session.find.css("input", all=False)

    response = element_send_keys(session, element, value)
    assert_error(response, "invalid argument")


def test_stale_element(session, inline):
    session.url = inline("<input>")
    element = session.find.css("input", all=False)

    session.refresh()

    response = element_send_keys(session, element, "foo")
    assert_error(response, "stale element reference")

@pytest.mark.parametrize("value, expected",[
    (u'\uE01A', "0"),
    (u'\uE01B', "1"),
    (u'\uE01C', "2"),
    (u'\uE01D', "3"),
    (u'\uE01E', "4"),
    (u'\uE01F', "5"),
    (u'\ue018', ";"),
    (u'\ue019', "="),
    (u'\ue020', "6"),
    (u'\ue021', "7"),
    (u'\ue022', "8"),
    (u'\ue023', "9"),
    (u'\ue024', "*"),
    (u'\ue025', "+"),
    (u'\ue026', ","),
    (u'\ue027', "-"),
    (u'\ue028', "."),
    (u'\ue029', "/"),
    ])
def test_printable_normalised_key_value(session, inline, value, expected):
    # TODO This is not extensive list due to timeouts from wpt if there are a lot of test
    # See https://github.com/web-platform-tests/wpt/issues/32899
    session.url = inline("<input>")
    element = session.find.css("input", all=False)
    element_send_keys(session, element, value)
    assert element.property("value") == expected

@pytest.mark.parametrize("value, expected", [
    (u'\ue008'+'a', "A"),
    ("abc"+u'\ue012'+"def", "abdefc")
    ])
def test_nonprintable_normalised_key_value(session, inline, value, expected):
    # TODO This is not extensive list due to timeouts from wpt if there are a lot of test
    # See https://github.com/web-platform-tests/wpt/issues/32899
    session.url = inline("<input>")
    element = session.find.css("input", all=False)
    element_send_keys(session, element, value)
    assert element.property("value") == expected

@pytest.mark.parametrize("value", ['!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', '<', '=', '>', '?', '@', ' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ' ', '[', '\\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~'])
def test_type_printable_chars(session, inline, value):
    # TODO This is not extensive list due to timeouts from wpt if there are a lot of test
    # See https://github.com/web-platform-tests/wpt/issues/32899
    session.url = inline("<input>")
    element = session.find.css("input", all=False)
    element_send_keys(session, element, value)
    assert element.property("value") == value
