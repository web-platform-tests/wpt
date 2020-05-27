import pytest
from six import text_type

from webdriver.error import NoSuchAlertException

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline


def get_computed_label(session, element):
    return session.transport.send(
        "GET", "session/{session_id}/element/{element_id}/computedlabel".format(
            session_id=session.session_id,
            element_id=element))


def test_no_browsing_context(session, closed_window):
    response = get_computed_label(session)
    assert_error(response, "no such window")


def test_no_user_prompt(session):
    response = get_computed_label(session)
    assert_error(response, "no such alert")


@pytest.mark.parametrize("tag,label", [
    ("<button>ok</button>", "ok"),
    ("<button aria-labelledby='one two'></button><div id='one'>ok</div><div id='two'>go</div>", "ok go"),
    ("<button aria-label='foo'>bar</button>", "foo")]
def test_get_computed_label(session, tag, label):
    session.url=inline("{0}".format(tag))
    element=session.find.css(tag, all=False)
    result=get_computed_label(session, element.id)
    assert_success(result, label)
