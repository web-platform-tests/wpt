import pytest
from six import text_type

from webdriver.error import NoSuchAlertException

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline


def get_computed_role(session, element):
    return session.transport.send(
        "GET", "session/{session_id}/element/{element_id}/computedrole".format(
            session_id=session.session_id,
            element_id=element))


def test_no_browsing_context(session, closed_window):
    response = get_computed_role(session, "id")
    assert_error(response, "no such window")


def test_no_user_prompt(session):
    response = get_computed_role(session, "id")
    assert_error(response, "no such alert")


@pytest.mark.parametrize("tag,role", [
    ("li", "menuitem"),
    ("input", "searchbox"),
    ("img", "presentation")])
def test_computed_roles(session, tag, role):
    session.url = inline("<{0} role={1}>".format(tag, role))
    element = session.find.css(tag, all=False)
    result = get_computed_role(session, element.id)
    assert_success(result, role)
