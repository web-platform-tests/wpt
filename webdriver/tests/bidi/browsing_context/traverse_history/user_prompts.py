import asyncio

import pytest

import webdriver.bidi.error as error
from webdriver.error import TimeoutException

pytestmark = pytest.mark.asyncio

USER_PROMPT_CLOSED_EVENT = "browsingContext.userPromptClosed"


@pytest.mark.capabilities({"unhandledPromptBehavior": {"default": "ignore"}})
@pytest.mark.parametrize("prompt_type", ["alert", "confirm", "prompt"])
async def test_refused_while_prompt_open(
    bidi_session,
    new_tab,
    inline,
    current_url,
    wait_for_not_url,
    subscribe_events,
    open_user_prompt,
    wait_for_future_safe,
    prompt_type,
):
    pages = [
        inline("<div>page 1</div>"),
        inline("<div>page 2</div>"),
    ]
    for page in pages:
        await bidi_session.browsing_context.navigate(
            context=new_tab["context"], url=page, wait="complete"
        )
        assert await current_url(new_tab["context"]) == page

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
                bidi_session.browsing_context.traverse_history(
                    context=new_tab["context"], delta=-1
                )
            )
        )
    assert closed == []

    await bidi_session.browsing_context.handle_user_prompt(context=new_tab["context"])

    with pytest.raises(TimeoutException):
        await wait_for_not_url(new_tab["context"], pages[1])

    remove_listener()
