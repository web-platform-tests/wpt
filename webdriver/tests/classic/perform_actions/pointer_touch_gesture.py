# META: timeout=long
"""Tests for touch-action, which is the specified way to turn off touch gestures.

touch-action: none means a user agent "MUST NOT trigger behaviors related to
viewport panning and zooming", and touch-action: manipulation means it "MUST
NOT trigger other related behaviors that rely on multiple activations, such as
double-tap to zoom".

Whether the pointer stream is also cancelled isn't required, and is tested in
pointer_touch_gesture_tentative.py.
"""

import pytest

from tests.support.classic.gesture import (
    execute,
    load_gesture_page,
    observe,
    perform_actions,
    visual_scale,
)
from tests.support.gesture import describe, types


def scroll_position(session):
    return execute(session, "return [window.scrollX, window.scrollY];")


@pytest.mark.parametrize("variant", ["touch-action-manipulation", "touch-action-none"])
def test_double_tap_does_not_zoom(
    session, inline, configuration, new_tab_classic, touch_chain, variant
):
    target = load_gesture_page(session, inline, variant)
    scale = visual_scale(session)
    touch_chain.click(element=target).pointer_down().pointer_up()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))
    scale_after = visual_scale(session)

    assert scale_after == scale, describe(at_return, eventually, duration,
                                          scale_before=scale, scale_after=scale_after)


def test_pan_does_not_scroll(session, inline, configuration, new_tab_classic, touch_chain):
    load_gesture_page(
        session, inline, "touch-action-none", extra_css="body { height: 3000px; }")
    # Start far enough down the page that moving up stays inside the viewport.
    target2 = session.find.css("#target2", all=False)
    scroll = scroll_position(session)
    scale = visual_scale(session)
    touch_chain.pointer_move(0, 0, origin=target2) \
        .pointer_down() \
        .pointer_move(0, -100, duration=300, origin="pointer") \
        .pointer_up()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [touch_chain.dict]))
    message = describe(at_return, eventually, duration)

    assert "pointermove" in types(eventually), message
    assert scroll_position(session) == scroll, message
    assert visual_scale(session) == scale, message


def test_pinch_does_not_zoom(session, inline, configuration, new_tab_classic):
    target = load_gesture_page(session, inline, "touch-action-none")
    scale = visual_scale(session)

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
    message = describe(at_return, eventually, duration)

    moved = {event["pointerId"] for event in eventually if event["type"] == "pointermove"}
    assert len(moved) == 2, message
    assert visual_scale(session) == scale, message
