"""Tests that a double click is dispatched before Perform Actions returns."""

from tests.support.classic.gesture import load_gesture_page, observe, perform_actions
from tests.support.gesture import count, describe


def test_dblclick_dispatched_before_return(
    session, inline, configuration, new_tab_classic, mouse_chain
):
    target = load_gesture_page(session, inline, "device-width")
    mouse_chain.click(element=target).click()

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: perform_actions(session, configuration, [mouse_chain.dict]))

    assert count(at_return, "dblclick", "target") == 1, \
        describe(at_return, eventually, duration)
