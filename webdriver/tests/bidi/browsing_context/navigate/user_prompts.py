import asyncio

import pytest

import webdriver.bidi.error as error
from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio

USER_PROMPT_CLOSED_EVENT = "browsingContext.userPromptClosed"
USER_PROMPT_OPENED_EVENT = "browsingContext.userPromptOpened"


async def assert_navigate_refused(bidi_session, wait_for_future_safe, context, url):
    with pytest.raises(error.UnexpectedAlertOpenException):
        await wait_for_future_safe(
            asyncio.ensure_future(
                bidi_session.browsing_context.navigate(
                    context=context["context"], url=url, wait="complete"
                )
            )
        )


@pytest.mark.capabilities({"unhandledPromptBehavior": {"default": "ignore"}})
@pytest.mark.parametrize("prompt_type", ["alert", "confirm", "prompt"])
async def test_refused_while_prompt_open(
    bidi_session,
    new_tab,
    inline,
    current_url,
    subscribe_events,
    open_user_prompt,
    wait_for_future_safe,
    prompt_type,
):
    page = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=page, wait="complete"
    )

    await subscribe_events(events=[USER_PROMPT_CLOSED_EVENT])
    closed = []

    async def on_event(method, data):
        closed.append(data)

    remove_listener = bidi_session.add_event_listener(
        USER_PROMPT_CLOSED_EVENT, on_event
    )

    await open_user_prompt(new_tab, prompt_type)

    await assert_navigate_refused(
        bidi_session, wait_for_future_safe, new_tab, inline("<div>bar</div>")
    )
    assert closed == []

    await bidi_session.browsing_context.handle_user_prompt(context=new_tab["context"])

    assert await current_url(new_tab["context"]) == page

    remove_listener()


@pytest.mark.capabilities({"unhandledPromptBehavior": {"beforeUnload": "ignore"}})
async def test_refused_while_beforeunload_prompt_open(
    bidi_session,
    new_tab,
    inline,
    setup_beforeunload_page,
    subscribe_events,
    wait_for_event,
    wait_for_future_safe,
):
    await setup_beforeunload_page(new_tab)

    await subscribe_events(events=[USER_PROMPT_CLOSED_EVENT, USER_PROMPT_OPENED_EVENT])
    on_prompt_opened = wait_for_event(USER_PROMPT_OPENED_EVENT)
    closed = []

    async def on_event(method, data):
        closed.append(data)

    remove_listener = bidi_session.add_event_listener(
        USER_PROMPT_CLOSED_EVENT, on_event
    )

    first_url = inline("<div>first</div>")
    navigated_future = asyncio.create_task(
        bidi_session.browsing_context.navigate(
            context=new_tab["context"], url=first_url, wait="complete"
        )
    )

    await wait_for_future_safe(on_prompt_opened)

    with pytest.raises(error.UnexpectedAlertOpenException):
        await wait_for_future_safe(
            asyncio.ensure_future(
                bidi_session.script.evaluate(
                    expression="window.ran = true",
                    target=ContextTarget(new_tab["context"]),
                    await_promise=False,
                )
            )
        )

    await assert_navigate_refused(
        bidi_session, wait_for_future_safe, new_tab, inline("<div>second</div>")
    )

    assert closed == []
    assert not navigated_future.done()

    await bidi_session.browsing_context.handle_user_prompt(
        context=new_tab["context"], accept=True
    )

    navigated = await wait_for_future_safe(navigated_future)
    assert navigated["url"] == first_url

    remove_listener()
