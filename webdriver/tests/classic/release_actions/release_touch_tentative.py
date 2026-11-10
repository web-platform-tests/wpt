"""Tests that Release Actions has released a held touch when it returns.

Release Actions as specified waits for an action queue token, then calls
"dispatch actions", which waits for a second token, so it deadlocks as written.
WebDriver BiDi's input.releaseActions instead dispatches the undo actions
without any wait for the event loop.
"""

from tests.support.classic.gesture import (
    bounded_command,
    get_events,
    load_gesture_page,
    observe,
    perform_actions,
    touch_events_supported,
)
from tests.support.gesture import count, describe


def test_release_held_touch_dispatches_pointerup_before_return(
    session, inline, configuration, new_tab_classic
):
    target = load_gesture_page(session, inline, "device-width")
    touch_chain = session.actions.sequence("pointer", "touch_id", {"pointerType": "touch"})
    touch_chain.pointer_move(0, 0, origin=target).pointer_down()
    perform_actions(session, configuration, [touch_chain.dict])
    before = len(get_events(session))

    at_return, eventually, duration = observe(
        session, configuration,
        lambda: bounded_command(session, configuration, "DELETE", "actions", None))
    released = at_return[before:]
    message = describe(at_return, eventually, duration)

    assert count(released, "pointerup", "target") == 1, message
    if touch_events_supported(session):
        assert count(released, "touchend", "target") == 1, message
