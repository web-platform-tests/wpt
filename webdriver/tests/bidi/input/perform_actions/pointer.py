import pytest

from webdriver.bidi.error import NoSuchFrameException
from webdriver.bidi.modules.input import Actions, get_element_origin

from .. import get_object_from_context
from . import record_pointer_events

pytestmark = pytest.mark.asyncio


async def test_invalid_browsing_context(bidi_session):
    actions = Actions()
    actions.add_pointer()

    with pytest.raises(NoSuchFrameException):
        await bidi_session.input.perform_actions(actions=actions, context="foo")


@pytest.mark.parametrize(
    "pointer_types, expected_ids",
    [
        (["mouse"], [0]),
        (["pen"], [2]),
        (["touch"], [2]),
        (["touch", "mouse"], [2, 0]),
        (["pen", "mouse"], [2, 0]),
        (["mouse", "mouse", "touch"], [0, 1, 2]),
        (["mouse", "touch", "mouse", "pen"], [0, 2, 1, 3]),
    ],
)
async def test_pointer_id_allocation(
    bidi_session,
    top_context,
    get_element,
    load_static_test_page,
    pointer_types,
    expected_ids,
):
    await load_static_test_page(page="test_actions_pointer.html")

    body = await get_element("body")
    target = await record_pointer_events(
        bidi_session, top_context, body, "#pointerArea"
    )

    # Use separate commands so that all input sources share the same input
    # state, but are created in the given order.
    for index, pointer_type in enumerate(pointer_types):
        actions = Actions()
        (
            actions.add_pointer(
                input_id=f"pointer-{index}", pointer_type=pointer_type
            )
            .pointer_move(x=0, y=0, origin=get_element_origin(target))
            .pointer_down(button=0)
            .pointer_up(button=0)
        )
        await bidi_session.input.perform_actions(
            actions=actions, context=top_context["context"]
        )

    events = await get_object_from_context(
        bidi_session, top_context["context"], "window.recordedEvents"
    )
    pointer_ids = [
        event["pointerId"] for event in events if event["type"] == "pointerdown"
    ]
    assert pointer_ids == expected_ids
