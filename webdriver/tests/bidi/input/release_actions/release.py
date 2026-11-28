import pytest
from webdriver.bidi.modules.input import Actions, get_element_origin
from webdriver.bidi.modules.script import ContextTarget

from .. import get_events
from ..perform_actions import assert_pointer_events, record_pointer_events

pytestmark = pytest.mark.asyncio


async def test_release_no_actions_sends_no_events(
    bidi_session, top_context, load_static_test_page, get_focused_key_input
):
    await load_static_test_page(page="test_actions.html")
    elem = await get_focused_key_input()

    await bidi_session.input.release_actions(context=top_context["context"])

    keys = await bidi_session.script.call_function(
        function_declaration="""(elem) => {
            return elem.value;
        }""",
        arguments=[elem],
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )
    events = await get_events(bidi_session, top_context["context"])

    assert len(keys["value"]) == 0
    assert len(events) == 0


async def test_release_actions_resets_pointer_subtype(
    bidi_session, top_context, get_element, load_static_test_page
):
    await load_static_test_page(page="test_actions_pointer.html")

    body = await get_element("body")
    target = await record_pointer_events(
        bidi_session, top_context, body, "#pointerArea"
    )

    def get_actions(pointer_type):
        actions = Actions()
        (
            actions.add_pointer(input_id="foo", pointer_type=pointer_type)
            .pointer_move(x=0, y=0, origin=get_element_origin(target))
            .pointer_down(button=0)
            .pointer_up(button=0)
        )
        return actions

    await bidi_session.input.perform_actions(
        actions=get_actions("mouse"), context=top_context["context"]
    )

    await assert_pointer_events(
        bidi_session,
        top_context,
        ["pointerdown", "pointerup"],
        "pointerArea",
        "mouse",
        expected_pointer_ids=[0, 0],
    )

    await bidi_session.input.release_actions(context=top_context["context"])

    await bidi_session.script.evaluate(
        expression="window.recordedEvents = []",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )
    await bidi_session.input.perform_actions(
        actions=get_actions("touch"), context=top_context["context"]
    )

    await assert_pointer_events(
        bidi_session,
        top_context,
        ["pointerdown", "pointerup"],
        "pointerArea",
        "touch",
        expected_pointer_ids=[2, 2],
    )
