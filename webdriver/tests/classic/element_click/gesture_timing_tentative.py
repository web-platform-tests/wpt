# META: timeout=long
"""Tests for Element Click and gesture recognisers whose behaviour is unclear.

See https://github.com/w3c/webdriver/issues/1970 and
https://github.com/w3c/webdriver/issues/1772.
"""

import pytest

from tests.support.classic.gesture import (
    element_click,
    load_gesture_page,
    observe,
    visual_scale,
)
from tests.support.gesture import (
    VIEWPORT_VARIANTS,
    count,
    describe,
    find_index,
    types,
)


@pytest.mark.parametrize("variant", VIEWPORT_VARIANTS)
def test_click_without_cancel_or_contextmenu(
    session, inline, configuration, new_tab_classic, variant
):
    """Element Click doesn't have its pointer taken over or open a context menu.

    Pointer Events allows a user agent to cancel a pointer for further reasons
    and to apply its own heuristics, so this isn't required; if the pointer
    were cancelled, test_click_dispatched_before_return would fail first.
    """
    target = load_gesture_page(session, inline, variant)

    at_return, eventually, duration = observe(
        session, configuration, lambda: element_click(session, configuration, target))

    assert types(eventually, {"pointercancel", "contextmenu"}) == [], \
        describe(at_return, eventually, duration)


def test_click_focuses_input(session, inline, configuration, new_tab_classic):
    """Element Click on an input has focused it when it returns.

    Whether a click focuses an element is up to the user agent ("click
    focusable"), and Element Click only runs the focusing steps itself for an
    option element.
    """
    load_gesture_page(
        session, inline, "device-width",
        body="<div id=target></div><input id=input>",
        extra_css="#input { width: 300px; height: 60px; }")
    input_el = session.find.css("#input", all=False)

    at_return, eventually, duration = observe(
        session, configuration, lambda: element_click(session, configuration, input_el))

    assert count(at_return, "focus", "input") == 1, \
        describe(at_return, eventually, duration)
    assert session.execute_script("return document.activeElement") == input_el


def test_consecutive_clicks_do_not_zoom(session, inline, configuration, new_tab_classic):
    """Two clicks can't form a double tap when the first waits for its click.

    A click delayed by a double-tap window is only dispatched once that window
    has expired, so the second click starts a new tap. Nothing in the
    specification resets gesture state between commands:
    https://github.com/w3c/webdriver/issues/1772
    """
    target = load_gesture_page(session, inline, "none")
    scale = visual_scale(session)

    def perform():
        element_click(session, configuration, target)
        element_click(session, configuration, target)

    at_return, eventually, duration = observe(session, configuration, perform)
    scale_after = visual_scale(session)
    message = describe(at_return, eventually, duration,
                       scale_before=scale, scale_after=scale_after)

    assert count(at_return, "click", "target") == 2, message
    assert scale_after == scale, message


@pytest.mark.parametrize("variant", ["device-width", "touch-action-manipulation"])
def test_consecutive_clicks_not_dblclick(
    session, inline, configuration, new_tab_classic, variant
):
    """Two Element Click commands are two single clicks, not a double click.

    How click counts are tracked across commands is unspecified:
    https://github.com/w3c/webdriver/issues/1772
    """
    target = load_gesture_page(session, inline, variant)
    scale = visual_scale(session)

    def perform():
        element_click(session, configuration, target)
        element_click(session, configuration, target)

    at_return, eventually, duration = observe(session, configuration, perform)
    scale_after = visual_scale(session)
    message = describe(at_return, eventually, duration,
                       scale_before=scale, scale_after=scale_after)

    assert count(eventually, "click", "target") == 2, message
    assert count(eventually, "dblclick") == 0, message
    second_click = eventually[find_index(eventually, "click", "target", nth=1)]
    assert second_click["detail"] == 1, message
    assert scale_after == scale, message


def test_hover_content_change(session, inline, configuration, new_tab_classic):
    """Element Click returns even if the user agent decides not to click.

    Some user agents don't dispatch the click of a tap if the mouseover it
    produces visibly changes the page, as the tap is then treated as a hover.
    Pointer Events allows a user agent not to fire a click for a tap that isn't
    "clean", so waiting for the click must also end if there won't be one.
    Whether Element Click should then return an error is an open question:
    https://github.com/w3c/webdriver/issues/1970
    """
    target = load_gesture_page(session, inline, "device-width", script="""
        const target = document.getElementById("target");
        target.addEventListener("mouseover", () => {
          if (!document.getElementById("revealed")) {
            const revealed = document.createElement("div");
            revealed.id = "revealed";
            revealed.textContent = "Revealed on hover";
            target.after(revealed);
          }
        }, {once: true});
        """)

    at_return, eventually, duration = observe(
        session, configuration, lambda: element_click(session, configuration, target))

    assert count(at_return, "click", "target") == 1 or \
        count(at_return, "mouseover", "target") == 1, \
        describe(at_return, eventually, duration)
