import asyncio

import pytest
from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio

USER_PROMPT_CLOSED_EVENT = "browsingContext.userPromptClosed"
USER_PROMPT_OPENED_EVENT = "browsingContext.userPromptOpened"


@pytest.mark.capabilities({"unhandledPromptBehavior": "ignore"})
async def test_classic_accept_alert_while_bidi_command_is_pending(
    bidi_session,
    current_session,
    new_tab,
    execute_as_async,
    subscribe_events,
    wait_for_event,
    wait_for_future_safe,
):
    current_session.window_handle = new_tab["context"]

    await subscribe_events([USER_PROMPT_OPENED_EVENT, USER_PROMPT_CLOSED_EVENT])
    on_prompt_opened = wait_for_event(USER_PROMPT_OPENED_EVENT)
    on_prompt_closed = wait_for_event(USER_PROMPT_CLOSED_EVENT)

    task = asyncio.create_task(
        bidi_session.script.evaluate(
            expression="window.alert('test'); 42",
            target=ContextTarget(new_tab["context"]),
            await_promise=False,
        )
    )

    await wait_for_future_safe(on_prompt_opened)

    assert await execute_as_async(lambda: current_session.alert.text) == "test"

    await execute_as_async(current_session.alert.accept)

    event = await wait_for_future_safe(on_prompt_closed)
    assert event["accepted"] is True

    result = await wait_for_future_safe(task)
    assert result == {"type": "number", "value": 42}
