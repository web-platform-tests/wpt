import asyncio

import pytest

import webdriver.bidi.error as error
from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio

USER_PROMPT_CLOSED_EVENT = "browsingContext.userPromptClosed"


@pytest.mark.capabilities({"unhandledPromptBehavior": {"default": "ignore"}})
@pytest.mark.parametrize("prompt_type", ["alert", "confirm", "prompt"])
async def test_refused_while_prompt_open(
    bidi_session,
    new_tab,
    subscribe_events,
    open_user_prompt,
    wait_for_future_safe,
    prompt_type,
):
    await subscribe_events(events=[USER_PROMPT_CLOSED_EVENT])
    closed = []

    async def on_event(method, data):
        closed.append(data)

    remove_listener = bidi_session.add_event_listener(
        USER_PROMPT_CLOSED_EVENT, on_event
    )

    await open_user_prompt(new_tab, prompt_type)

    with pytest.raises(error.UnexpectedAlertOpenException):
        await wait_for_future_safe(
            asyncio.ensure_future(
                bidi_session.script.call_function(
                    function_declaration="() => { window.ran = true }",
                    target=ContextTarget(new_tab["context"]),
                    await_promise=False,
                )
            )
        )
    assert closed == []

    await bidi_session.browsing_context.handle_user_prompt(context=new_tab["context"])

    result = await bidi_session.script.evaluate(
        expression="window.ran",
        target=ContextTarget(new_tab["context"]),
        await_promise=False,
    )
    assert result == {"type": "undefined"}

    remove_listener()
