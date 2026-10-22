import asyncio

import pytest

import webdriver.bidi.error as error
from webdriver.bidi.modules.input import Actions
from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio

USER_PROMPT_CLOSED_EVENT = "browsingContext.userPromptClosed"


async def get_keyup_count(bidi_session, context):
    return await bidi_session.script.evaluate(
        expression="window.keyups",
        target=ContextTarget(context["context"]),
        await_promise=False,
    )


@pytest.mark.capabilities({"unhandledPromptBehavior": {"default": "ignore"}})
@pytest.mark.parametrize("prompt_type", ["alert", "confirm", "prompt"])
async def test_refused_while_prompt_open(
    bidi_session,
    new_tab,
    inline,
    subscribe_events,
    open_user_prompt,
    wait_for_future_safe,
    prompt_type,
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=inline("""
            <input id='i'>
            <script>
              window.keyups = 0;
              window.addEventListener('keyup', () => window.keyups++);
              document.getElementById('i').focus();
            </script>
        """),
        wait="complete",
    )

    actions = Actions()
    actions.add_key().key_down("a")
    await bidi_session.input.perform_actions(
        actions=actions, context=new_tab["context"]
    )

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
                bidi_session.input.release_actions(context=new_tab["context"])
            )
        )
    assert closed == []

    await bidi_session.browsing_context.handle_user_prompt(context=new_tab["context"])

    assert await get_keyup_count(bidi_session, new_tab) == {"type": "number", "value": 0}

    await bidi_session.input.release_actions(context=new_tab["context"])

    assert await get_keyup_count(bidi_session, new_tab) == {"type": "number", "value": 1}

    remove_listener()
