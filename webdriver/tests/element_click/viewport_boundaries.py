import pytest

from webdriver.transport import Response
from tests.support.asserts import assert_error, assert_success
from tests.support.helpers import (element_position, get_element_property,
    scroll_to, viewport_size)

def element_click(session, element):
    return session.transport.send(
        "POST", "session/{session_id}/element/{element_id}/click".format(
            session_id=session.session_id,
            element_id=element.id))

@pytest.mark.parametrize("boundary", range(-4, 4))
def test_element_at_bottom_edge_of_viewport(session, inline, boundary):
    session.url = inline("""
        <style>
        body {
          padding: 0.25px;
        }

        body > div {
          height: 1000px;
        }
        </style>

        <div></div>
        <label for="checkmeout">Check me out</label>
        <input type="checkbox" id="checkmeout">
        """)
    element = session.find.css("input", all=False)
    position = element_position(session, element)
    clientHeight = viewport_size(session)[1]
    elementBottom = position['y'] - clientHeight

    targetScroll = elementBottom - (boundary * 0.25)
    scroll_to(session, 0, targetScroll)

    assert_success(element_click(session, element))
    assert get_element_property(session, element, 'checked') is True

@pytest.mark.parametrize("boundary", range(-4, 4))
def test_element_at_top_edge_of_viewport(session, inline, boundary):
    session.url = inline("""
        <style>
        body {
          padding: 0.25px;
        }

        body > div {
          height: 1000px;
        }
        </style>

        <label for="checkmeout">Check me out</label>
        <input type="checkbox" id="checkmeout">
        <div></div>
        """)
    element = session.find.css("input", all=False)
    position = element_position(session, element)
    elementTop = position['y'] + position['height'];

    targetScroll = elementTop - (boundary * 0.25)
    scroll_to(session, 0, targetScroll)

    assert_success(element_click(session, element))
    assert get_element_property(session, element, 'checked') is True

@pytest.mark.parametrize("boundary", range(-4, 4))
def test_element_at_left_edge_of_viewport(session, inline, boundary):
    session.url = inline("""
        <style>
        body {
          padding: 0.25px;
        }

        body > div {
          padding-right: 1000px;
        }
        </style>

        <div>
            <label for="checkmeout">Check me out</label>
            <input type="checkbox" id="checkmeout">
        <div>
        """)
    element = session.find.css("input", all=False)
    position = element_position(session, element)
    elementLeft = position['x'] + position['width'];

    targetScroll = elementLeft - (boundary * 0.25)
    scroll_to(session, targetScroll, 0)

    assert_success(element_click(session, element))
    assert get_element_property(session, element, 'checked') is True

@pytest.mark.parametrize("boundary", range(-4, 4))
def test_element_at_right_edge_of_viewport(session, inline, boundary):
    session.url = inline("""
        <style>
        body {
          padding: 0.25px;
        }

        body > div {
          padding-left: 1000px;
        }
        </style>

        <div>
            <label for="checkmeout">Check me out</label>
            <input type="checkbox" id="checkmeout">
        <div>
        """)
    element = session.find.css("input", all=False)
    position = element_position(session, element)
    clientWidth = viewport_size(session)[0]
    elementRight = position['x'] - clientWidth

    targetScroll = elementRight - (boundary * 0.25)
    scroll_to(session, targetScroll, 0)

    assert_success(element_click(session, element))
    assert get_element_property(session, element, 'checked') is True
