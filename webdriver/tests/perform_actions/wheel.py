import pytest

from webdriver.error import NoSuchWindowException

from tests.perform_actions.support.mouse import get_inview_center, get_viewport_rect
from tests.perform_actions.support.refine import filter_dict, get_events
from tests.support.asserts import assert_move_to_coordinates
from tests.support.inline import inline
from tests.support.sync import Poll


def link_doc(dest):
    content = "<a href=\"{}\" id=\"link\">destination</a>".format(dest)
    return inline(content)


def test_null_response_value(session, wheel_chain):
    value = wheel_chain.scroll().perform()
    assert value is None


def test_no_browsing_context(session, closed_window, wheel_chain):
    with pytest.raises(NoSuchWindowException):
        wheel_chain.click().perform()


def test_wheel_scroll(session, test_actions_page, wheel_chain):
    div_point = { "x": 82, "y": 187}

    wheel_chain \
        .scroll(div_point["x"], div_point["y"], 0, 10) \
        .perform()
    events = get_events(session)
    assert len(events) == 2
    event_types = [e["type"] for e in events]
    assert ["mousemove", "wheel"] == event_types
    for e in events:
        if e["type"] != "wheel":
            assert e["deltaY"] == 10
