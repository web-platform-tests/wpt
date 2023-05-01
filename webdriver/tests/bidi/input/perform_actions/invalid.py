import pytest

from webdriver.bidi.modules.input import Actions
from webdriver.bidi.error import (
    InvalidArgumentException,
    MoveTargetOutOfBoundsException,
    NoSuchFrameException,
)


pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", [None, True, 42, {}, []])
async def test_params_context_invalid_type(bidi_session, value):
    actions = Actions()
    actions.add_key()
    with pytest.raises(InvalidArgumentException):
        await bidi_session.input.perform_actions(actions=actions, context=value)


async def test_params_contexts_value_invalid_value(bidi_session):
    actions = Actions()
    actions.add_key()
    with pytest.raises(NoSuchFrameException):
        await bidi_session.input.perform_actions(actions=actions, context="foo")


@pytest.mark.parametrize(
    "value",
    [("fa"), ("\u0BA8\u0BBFb"), ("\u0BA8\u0BBF\u0BA8"), ("\u1100\u1161\u11A8c")],
)
async def test_params_actions_invalid_value_multiple_codepoints(
    bidi_session, top_context, setup_key_test, value
):
    actions = Actions()
    actions.add_key().key_down(value).key_up(value)
    with pytest.raises(InvalidArgumentException):
        await bidi_session.input.perform_actions(
            actions=actions, context=top_context["context"]
        )


@pytest.mark.parametrize("missing", ["x", "y"])
async def test_params_actions_missing_coordinates(bidi_session, top_context, missing):
    actions = Actions()
    pointer_input_source = actions.add_pointer().pointer_move(x=0, y=0)

    json_actions = actions.to_json()
    pointer_input_source_json = json_actions[-1]["actions"]
    del pointer_input_source_json[-1][missing]

    with pytest.raises(InvalidArgumentException):
        await bidi_session.input.perform_actions(
            actions=json_actions, context=top_context["context"]
        )


@pytest.mark.parametrize("missing", ["x", "y", "deltaX", "deltaY"])
async def test_params_actions_missing_wheel_property(
    bidi_session, top_context, missing
):
    actions = Actions()
    wheel_input_source = actions.add_wheel().scroll(x=0, y=0, delta_x=5, delta_y=10)

    json_actions = actions.to_json()
    wheel_input_actions_json = json_actions[-1]["actions"]
    del wheel_input_actions_json[-1][missing]

    with pytest.raises(InvalidArgumentException):
        await bidi_session.input.perform_actions(
            actions=json_actions, context=top_context["context"]
        )


async def test_params_actions_origin_element_outside_viewport(
    bidi_session, top_context, get_actions_origin_page, get_element
):
    url = get_actions_origin_page(
        """width: 100px; height: 50px; background: green;
           position: relative; left: -200px; top: -100px;"""
    )
    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=url,
        wait="complete",
    )

    elem = await get_element("#inner")

    actions = Actions()
    actions.add_pointer().pointer_move(x=0, y=0, origin=elem)
    with pytest.raises(MoveTargetOutOfBoundsException):
        await bidi_session.input.perform_actions(
            actions=actions, context=top_context["context"]
        )


@pytest.mark.parametrize("origin", ["viewport", "pointer"])
async def test_params_actions_origin_outside_viewport(
    bidi_session, top_context, origin
):
    actions = Actions()
    actions.add_pointer().pointer_move(x=-50, y=-50, origin=origin)
    with pytest.raises(MoveTargetOutOfBoundsException):
        await bidi_session.input.perform_actions(
            actions=actions, context=top_context["context"]
        )
