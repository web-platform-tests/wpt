# META: timeout=long
"""Tests for touch gestures whose resulting events aren't specified.

Which DOM events a long press, pan or pinch produces is up to the user agent,
so these tests allow each outcome a user agent might reasonably choose. They
also check that whatever events the gesture produces have been dispatched by
the end of the tick that caused them:
https://github.com/w3c/webdriver/issues/1970
"""

import pytest

from tests.support.classic.gesture import (
    load_gesture_page,
    observe,
    perform_actions,
)
from tests.support.gesture import (
    LONG_PRESS_EVENTS,
    TEXT,
    count,
    describe,
    long_press_pause,
    types,
)


LONG_PRESS_TARGETS = {
    "div": ("<div id=target></div>", set()),
    "link": (f"<a id=target href=#elsewhere>{TEXT}</a>", set()),
    "text": (f"<div id=target>{TEXT}</div>", {"selectstart"}),
    "draggable": ("<div id=target draggable=true></div>", {"dragstart"}),
}


def long_press(touch_chain, target, configuration):
    return touch_chain.pointer_move(0, 0, origin=target) \
        .pointer_down() \
        .pause(long_press_pause(configuration)) \
        .pointer_up()


@pytest.mark.parametrize("target_type", LONG_PRESS_TARGETS)
def test_long_press(
    session, inline, configuration, new_tab_classic, touch_chain, target_type
):
    body, extra_events = LONG_PRESS_TARGETS[target_type]
    target = load_gesture_page(
        session, inline, "device-width", body=body,
        extra_css="#target { display: block; }")
    long_press(touch_chain, target, configuration)

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))
    message = describe(at_return, eventually, duration)

    assert types(at_return, {"contextmenu", "pointercancel"} | extra_events), message
    assert count(eventually, "click", "target") == 0, message


def test_long_press_suppressed(session, inline, configuration, new_tab_classic, touch_chain):
    target = load_gesture_page(
        session, inline, "device-width",
        extra_css="""
            #target {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              user-select: none;
            }
            """,
        script="""
            document.getElementById("target").addEventListener(
              "contextmenu", event => event.preventDefault());
            """)
    long_press(touch_chain, target, configuration)

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))

    assert "selectstart" not in types(eventually), \
        describe(at_return, eventually, duration)


@pytest.mark.parametrize("variant", ["none", "touch-action-none"])
def test_pen_tap(session, inline, configuration, new_tab_classic, pen_chain, variant):
    target = load_gesture_page(session, inline, variant)
    pen_chain.click(element=target)

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [pen_chain.dict]))
    message = describe(at_return, eventually, duration)

    for event_type in ["pointerdown", "pointerup"]:
        events = [event for event in at_return
                  if event["type"] == event_type and event["target"] == "target"]
        assert [event["pointerType"] for event in events] == ["pen"], message
    assert types(eventually, LONG_PRESS_EVENTS) == [], message


def test_pan_cancel_dispatched_by_end_of_tick(
    session, inline, configuration, new_tab_classic, touch_chain
):
    """If a pan cancels the pointer, the pointercancel is part of the move's tick."""
    load_gesture_page(
        session, inline, "device-width", extra_css="body { height: 3000px; }")
    # Start far enough down the page that moving up stays inside the viewport.
    target2 = session.find.css("#target2", all=False)
    touch_chain.pointer_move(0, 0, origin=target2) \
        .pointer_down() \
        .pointer_move(0, -150, duration=300, origin="pointer") \
        .pointer_up()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))
    message = describe(at_return, eventually, duration)

    assert count(eventually, "click", "target2") == 0, message
    assert count(at_return, "pointercancel") == count(eventually, "pointercancel"), message


def test_pan_no_pointercancel_with_touch_action_none(
    session, inline, configuration, new_tab_classic, touch_chain
):
    """With touch-action: none the user agent has no reason to take over a pan.

    Pointer Events lets a user agent cancel a pointer for other reasons, so
    this isn't required; the required part (no panning) is tested in
    pointer_touch_gesture.py.
    """
    load_gesture_page(
        session, inline, "touch-action-none", extra_css="body { height: 3000px; }")
    target2 = session.find.css("#target2", all=False)
    touch_chain.pointer_move(0, 0, origin=target2) \
        .pointer_down() \
        .pointer_move(0, -100, duration=300, origin="pointer") \
        .pointer_up()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))

    assert "pointercancel" not in types(eventually), \
        describe(at_return, eventually, duration)


def test_pinch_no_pointercancel_with_touch_action_none(
    session, inline, configuration, new_tab_classic
):
    """See test_pan_no_pointercancel_with_touch_action_none."""
    target = load_gesture_page(session, inline, "touch-action-none")

    finger1 = session.actions.sequence("pointer", "finger1", {"pointerType": "touch"})
    finger2 = session.actions.sequence("pointer", "finger2", {"pointerType": "touch"})
    finger1.pointer_move(-50, 0, origin=target) \
        .pointer_down() \
        .pointer_move(-50, 0, duration=300, origin="pointer") \
        .pointer_up()
    finger2.pointer_move(50, 0, origin=target) \
        .pointer_down() \
        .pointer_move(50, 0, duration=300, origin="pointer") \
        .pointer_up()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [finger1.dict, finger2.dict]))

    assert "pointercancel" not in types(eventually), \
        describe(at_return, eventually, duration)


def test_pinch_does_not_click(session, inline, configuration, new_tab_classic):
    target = load_gesture_page(session, inline, "device-width")

    finger1 = session.actions.sequence("pointer", "finger1", {"pointerType": "touch"})
    finger2 = session.actions.sequence("pointer", "finger2", {"pointerType": "touch"})
    finger1.pointer_move(-50, 0, origin=target) \
        .pointer_down() \
        .pointer_move(-50, 0, duration=300, origin="pointer") \
        .pointer_up()
    finger2.pointer_move(50, 0, origin=target) \
        .pointer_down() \
        .pointer_move(50, 0, duration=300, origin="pointer") \
        .pointer_up()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [finger1.dict, finger2.dict]))

    assert count(eventually, "click") == 0, describe(at_return, eventually, duration)


def test_tap_focuses_input(session, inline, configuration, new_tab_classic, touch_chain):
    load_gesture_page(
        session, inline, "device-width",
        body="<div id=target></div><input id=input>",
        extra_css="#input { width: 300px; height: 60px; }")
    input_el = session.find.css("#input", all=False)
    touch_chain.click(element=input_el)

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))

    assert session.execute_script("return document.activeElement") == input_el, \
        describe(at_return, eventually, duration)


def test_pull_down_at_top_does_not_reload(
    session, inline, configuration, new_tab_classic, touch_chain
):
    """overscroll-behavior: none prevents pull to refresh."""
    target = load_gesture_page(
        session, inline, "device-width",
        extra_css=":root { overscroll-behavior: none; } body { height: 3000px; }")
    session.execute_script("window.marker = true;")
    touch_chain.pointer_move(0, 0, origin=target) \
        .pointer_down() \
        .pointer_move(0, 200, duration=300, origin="pointer") \
        .pointer_up()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))

    assert session.execute_script("return window.marker") is True, \
        describe(at_return, eventually, duration)
