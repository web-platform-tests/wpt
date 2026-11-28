import asyncio

import pytest
from webdriver.bidi.modules.input import Actions, get_element_origin
from webdriver.bidi.modules.script import ContextTarget
from webdriver.error import TimeoutException

pytestmark = pytest.mark.asyncio

USER_PROMPT_CLOSED_EVENT = "browsingContext.userPromptClosed"
USER_PROMPT_OPENED_EVENT = "browsingContext.userPromptOpened"


@pytest.mark.capabilities({"unhandledPromptBehavior": {"default": "ignore"}})
async def test_prompt_opened_between_actions_is_not_closed(
    bidi_session,
    inline,
    new_tab,
    subscribe_events,
    wait_for_event,
    wait_for_bidi_events,
    wait_for_future_safe,
):
    await subscribe_events([USER_PROMPT_OPENED_EVENT, USER_PROMPT_CLOSED_EVENT])
    on_prompt_opened = wait_for_event(USER_PROMPT_OPENED_EVENT)

    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(
        USER_PROMPT_CLOSED_EVENT, on_event
    )

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=inline("""<script>
            window.addEventListener(
                "mousemove", () => setTimeout(() => window.confirm("test"), 100), {once: true}
            );
        </script>"""),
        wait="complete",
    )

    actions = Actions()
    (
        actions.add_pointer()
        .pointer_move(x=10, y=10)
        .pause(duration=500)
        .pointer_move(x=20, y=20)
    )

    task = asyncio.create_task(
        bidi_session.input.perform_actions(
            actions=actions, context=new_tab["context"]
        )
    )

    await wait_for_future_safe(on_prompt_opened)

    with pytest.raises(TimeoutException):
        await wait_for_bidi_events(events, 1, timeout=1)

    await bidi_session.browsing_context.handle_user_prompt(
        context=new_tab["context"], accept=False
    )

    await wait_for_bidi_events(events, 1)
    assert events[0]["accepted"] is False

    assert await wait_for_future_safe(task) == {}

    remove_listener()


@pytest.mark.capabilities({"unhandledPromptBehavior": {"default": "ignore"}})
async def test_prompt_opened_by_action(
    bidi_session,
    get_element,
    inline,
    new_tab,
    subscribe_events,
    wait_for_event,
    wait_for_future_safe,
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=inline("<button onclick='window.result = window.confirm(\"test\")'>x</button>"),
        wait="complete",
    )

    await subscribe_events([USER_PROMPT_OPENED_EVENT])
    on_prompt_opened = wait_for_event(USER_PROMPT_OPENED_EVENT)

    button = await get_element("button", context=new_tab)

    actions = Actions()
    (
        actions.add_pointer()
        .pointer_move(x=0, y=0, origin=get_element_origin(button))
        .pointer_down(button=0)
        .pointer_up(button=0)
    )

    task = asyncio.create_task(
        bidi_session.input.perform_actions(
            actions=actions, context=new_tab["context"]
        )
    )

    await wait_for_future_safe(on_prompt_opened)
    assert not task.done()

    await bidi_session.browsing_context.handle_user_prompt(
        context=new_tab["context"], accept=True
    )

    assert await wait_for_future_safe(task) == {}

    result = await bidi_session.script.evaluate(
        expression="window.result",
        target=ContextTarget(new_tab["context"]),
        await_promise=False,
    )
    assert result == {"type": "boolean", "value": True}
