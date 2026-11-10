"""Diagnostic tests for what a tick waits for when touch input starts gestures.

These are the WebDriver BiDi counterparts of
webdriver/tests/classic/perform_actions/support/tick_wait.py, whose docstring
describes the readings of https://github.com/w3c/webdriver/issues/1970 that the
tests distinguish, and how to interpret their results. The per-variant test
files define the ``variant`` fixture and import the tests from here.

input.performActions uses the same "dispatch actions" algorithm as Perform
Actions. Here, whether an event had been dispatched when the command finished
is decided by whether its log.entryAdded event was received before the
command's response, rather than by reading the page afterwards; see
tests.support.bidi.gesture.observe.
"""

import pytest
import pytest_asyncio

from webdriver.bidi.modules.input import Actions, get_element_origin

from tests.support.bidi.gesture import (
    get_element,
    load_gesture_page,
    observe,
    touch_events_supported,
    visual_scale,
)
from tests.support.gesture import (
    LONG_PRESS_EVENTS,
    click_delay,
    count,
    describe,
    dispatched_before,
    long_press_pause,
    slow_handler_script,
    types,
)

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture(autouse=True)
async def subscribe_to_log(subscribe_events):
    await subscribe_events(events=["log.entryAdded"])


@pytest_asyncio.fixture
async def load_page(bidi_session, new_tab, inline, configuration, variant):
    """Return a function loading the page for the variant.

    The function returns (#target, observe function) and takes the keyword
    arguments of ``load_gesture_page``.
    """
    async def load_page(**kwargs):
        target = await load_gesture_page(bidi_session, new_tab, inline, variant, **kwargs)

        async def observe_actions(actions):
            """Observe performing actions, or awaiting a callable."""
            if callable(actions):
                perform = actions
            else:
                def perform():
                    return bidi_session.input.perform_actions(
                        actions=actions, context=new_tab["context"])
            return await observe(bidi_session, new_tab, configuration, perform)

        return target, observe_actions

    return load_page


@pytest_asyncio.fixture
async def setup(load_page):
    """Load the page for the variant and return (#target, observe function)."""
    return await load_page()


def tap(source, element, duration=None):
    return source.pointer_move(0, 0, duration=duration, origin=get_element_origin(element)) \
        .pointer_down(button=0) \
        .pointer_up(button=0)


def touch_actions():
    actions = Actions()
    return actions, actions.add_pointer(pointer_type="touch")


def key_marker(actions, ticks):
    """Press a key in the tick after the first ``ticks`` ticks."""
    key = actions.add_key()
    for _ in range(ticks):
        key.pause()
    key.key_down("a").key_up("a")


async def test_control_tap_eventually_clicks(setup, configuration):
    """Control: an injected tap is recognised as a tap at all."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    tap(touch, target).pause(long_press_pause(configuration))

    at_response, _, eventually, duration = await observe_actions(actions)

    assert count(at_response, "click", "target") == 1, \
        describe(at_response, eventually, duration)


async def test_control_tap_delay_present(setup, configuration):
    """Control: the click of a tap is delayed by a double-tap window."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    tap(touch, target).pause(long_press_pause(configuration))

    at_response, _, eventually, duration = await observe_actions(actions)

    delay = click_delay(eventually)
    assert delay is not None, describe(at_response, eventually, duration)
    if delay < 150:
        pytest.skip(f"no tap delay in this variant ({delay:.0f}ms)")


async def test_pointer_events_processed_at_return(bidi_session, new_tab, setup):
    """P1: the events a tap produces directly have been dispatched at return."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    tap(touch, target)

    at_response, _, eventually, duration = await observe_actions(actions)

    expected = ["pointerdown", "pointerup"]
    if await touch_events_supported(bidi_session, new_tab):
        expected += ["touchstart", "touchend"]
    for event_type in expected:
        assert count(at_response, event_type, "target") == 1, \
            describe(at_response, eventually, duration, missing=event_type)


async def test_tick_order_preserved_across_sources(setup):
    """P2: the pointerup of a tap is dispatched before input of a later tick."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    tap(touch, target)
    key_marker(actions, 3)

    at_response, _, eventually, duration = await observe_actions(actions)
    message = describe(at_response, eventually, duration)

    assert dispatched_before(eventually, ("pointerup", "target", 0), ("keydown", None, 0)), \
        message
    assert count(eventually, "keydown") == 1, message


async def test_down_tick_does_not_wait_for_long_press(setup):
    """P3: the pointerDown tick doesn't wait for the long press recogniser."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    tap(touch, target)

    at_response, _, eventually, duration = await observe_actions(actions)

    assert types(eventually, LONG_PRESS_EVENTS) == [], \
        describe(at_response, eventually, duration)


async def test_held_pointer_long_press_not_awaited(bidi_session, new_tab, setup):
    """P4: a command ending with a touch held doesn't wait for a long press.

    This checks the events read after the response, as those include
    everything dispatched before it.
    """
    target, observe_actions = setup
    actions, touch = touch_actions()
    touch.pointer_move(0, 0, origin=get_element_origin(target)).pointer_down(button=0)

    _, read_after_response, eventually, duration = \
        await observe_actions(actions)
    await bidi_session.input.release_actions(context=new_tab["context"])

    assert types(read_after_response, LONG_PRESS_EVENTS) == [], \
        describe(read_after_response, eventually, duration)


async def test_tap_click_at_return(setup):
    """P5: the click of a tap has been dispatched when the command returns."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    tap(touch, target)

    at_response, read_after_response, eventually, duration = \
        await observe_actions(actions)

    assert count(at_response, "click", "target") == 1, \
        describe(at_response, eventually, duration,
                 clicks_read_after_response=count(read_after_response, "click", "target"))


async def test_up_tick_waits_for_click_before_other_source(setup):
    """P6: the click of a tap is dispatched before input of a later tick."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    tap(touch, target)
    key_marker(actions, 3)

    at_response, _, eventually, duration = await observe_actions(actions)

    assert dispatched_before(eventually, ("click", "target", 0), ("keydown", None, 0)), \
        describe(at_response, eventually, duration)


async def test_up_tick_waits_for_click_before_same_source_far_tap(
    bidi_session, new_tab, setup
):
    """P7: the click of a tap is dispatched before a later tap elsewhere.

    The moves have an explicit duration of 0, so the time between the taps
    isn't what decides the result; see the Classic version.
    """
    target, observe_actions = setup
    target2 = await get_element(bidi_session, new_tab, "#target2")
    actions, touch = touch_actions()
    tap(tap(touch, target, duration=0), target2, duration=0)

    at_response, _, eventually, duration = await observe_actions(actions)

    assert dispatched_before(
        eventually, ("click", "target", 0), ("pointerdown", "target2", 0)), \
        describe(at_response, eventually, duration)


async def test_up_tick_waits_for_click_before_same_source_double_tap(
    bidi_session, new_tab, setup
):
    """P8: the click of a tap is dispatched before a second tap at the same point."""
    target, observe_actions = setup
    scale = await visual_scale(bidi_session, new_tab)
    actions, touch = touch_actions()
    tap(touch, target).pointer_down(button=0).pointer_up(button=0)

    at_response, _, eventually, duration = await observe_actions(actions)

    assert dispatched_before(
        eventually, ("click", "target", 0), ("pointerdown", "target", 1)), \
        describe(at_response, eventually, duration, scale_before=scale,
                 scale_after=await visual_scale(bidi_session, new_tab))


async def test_separate_commands_tap_not_combined(bidi_session, new_tab, setup):
    """P9: taps in two consecutive commands aren't recognised as a double tap.

    Also related to https://github.com/w3c/webdriver/issues/1772.
    """
    target, observe_actions = setup
    scale = await visual_scale(bidi_session, new_tab)
    actions, touch = touch_actions()
    tap(touch, target)

    async def perform():
        await bidi_session.input.perform_actions(actions=actions, context=new_tab["context"])
        await bidi_session.input.perform_actions(actions=actions, context=new_tab["context"])

    at_response, _, eventually, duration = await observe_actions(perform)
    scale_after = await visual_scale(bidi_session, new_tab)
    message = describe(at_response, eventually, duration,
                       scale_before=scale, scale_after=scale_after)

    assert count(eventually, "click", "target") == 2, message
    assert count(eventually, "dblclick") == 0, message
    assert scale_after == scale, message


async def test_zero_pause_adds_no_wait(setup):
    """P10: a zero duration pause between pointerDown and pointerUp is a tap."""
    target, observe_actions = setup
    actions, touch = touch_actions()
    touch.pointer_move(0, 0, origin=get_element_origin(target)) \
        .pointer_down(button=0) \
        .pause(0) \
        .pointer_up(button=0)

    at_response, _, eventually, duration = await observe_actions(actions)
    message = describe(at_response, eventually, duration)

    assert types(eventually, LONG_PRESS_EVENTS) == [], message
    assert count(eventually, "click", "target") == 1, message


async def test_click_before_return_with_slow_pointerup_handler(load_page):
    """P11: the click is dispatched before return even if pointerup is slow.

    See the Classic version. Here the click is judged on the log events
    received before the response, which is a lower bound.
    """
    target, observe_actions = await load_page(
        script=slow_handler_script(["pointerup", "touchend"]))
    actions, touch = touch_actions()
    tap(touch, target)

    at_response, _, eventually, duration = await observe_actions(actions)

    assert count(at_response, "click", "target") == 1, \
        describe(at_response, eventually, duration)


async def test_pan_cancel_before_return_with_slow_pointermove_handler(
    bidi_session, new_tab, load_page, variant
):
    """P12: a pointercancel from a pan is dispatched before return even if pointermove is slow.

    See the Classic version.
    """
    if variant == "touch-action-none":
        pytest.skip("touch-action: none stops the user agent taking over a pan")

    _, observe_actions = await load_page(
        extra_css="body { height: 3000px; }",
        script=slow_handler_script(["pointermove"], once=True))
    # Start far enough down the page that moving up stays inside the viewport.
    target2 = await get_element(bidi_session, new_tab, "#target2")
    actions, touch = touch_actions()
    touch.pointer_move(0, 0, origin=get_element_origin(target2)) \
        .pointer_down(button=0) \
        .pointer_move(0, -150, duration=300, origin="pointer") \
        .pointer_up(button=0)

    at_response, _, eventually, duration = await observe_actions(actions)

    assert count(at_response, "pointercancel") == count(eventually, "pointercancel"), \
        describe(at_response, eventually, duration)
