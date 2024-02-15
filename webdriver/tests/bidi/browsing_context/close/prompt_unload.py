import pytest
import asyncio

from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio

CONTEXT_DESTROYED_EVENT = "browsingContext.contextDestroyed"
USER_PROMPT_OPENED_EVENT = "browsingContext.userPromptOpened"


@pytest.mark.parametrize("prompt_unload", [None, False])
async def test_prompt_unload_not_triggering_dialog(bidi_session, subscribe_events, top_context, prompt_unload, url):
    page_beforeunload = url(
        "/webdriver/tests/support/html/beforeunload.html")

    # Set up event listener to make sure the "beforeunload" event is not emitted
    await subscribe_events([USER_PROMPT_OPENED_EVENT])
    # Track all received browsingContext.userPromptOpened events in the events array
    events = []

    async def on_event(_, data):
        events.append(data)
    bidi_session.add_event_listener(
        USER_PROMPT_OPENED_EVENT, on_event)

    await bidi_session.browsing_context.navigate(context=top_context["context"], url=page_beforeunload, wait="complete")

    # We need to interact with the page to trigger the beforeunload event.
    # https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
    await bidi_session.script.evaluate(
        expression="document.body.click()",
        target=ContextTarget(top_context["context"]),
        await_promise=True,
        user_activation=True)

    await bidi_session.browsing_context.close(context=top_context["context"], prompt_unload=prompt_unload)

    assert events == []


@pytest.mark.parametrize("type_hint", ["window", "tab"])
async def test_prompt_unload_triggering_dialog(bidi_session, url, subscribe_events, wait_for_event, type_hint):
    page_beforeunload = url(
        "/webdriver/tests/support/html/beforeunload.html")

    new_context = await bidi_session.browsing_context.create(type_hint=type_hint)

    # Set up event listener to make sure the "beforeunload" event is not emitted
    await subscribe_events([USER_PROMPT_OPENED_EVENT, CONTEXT_DESTROYED_EVENT])
    user_prompt_opened = wait_for_event(USER_PROMPT_OPENED_EVENT)

    # Track all received browsingContext.contextDestroyed events in the events array
    events = []

    async def on_event(_, data):
        if data["type"] == CONTEXT_DESTROYED_EVENT:
            events.append(data)
    remove_listener = bidi_session.add_event_listener(
        CONTEXT_DESTROYED_EVENT, on_event)

    await bidi_session.browsing_context.navigate(context=new_context["context"], url=page_beforeunload, wait="complete")

    # We need to interact with the page to trigger the beforeunload event.
    # https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
    await bidi_session.script.evaluate(
        expression="document.body.click()",
        target=ContextTarget(new_context["context"]),
        await_promise=True,
        user_activation=True)

    close_task = asyncio.create_task(
        bidi_session.browsing_context.close(
            context=new_context["context"], prompt_unload=True)
    )

    await user_prompt_opened

    # Events that come after the handling are OK
    remove_listener()
    assert events == []

    await bidi_session.browsing_context.handle_user_prompt(
        context=new_context["context"],
    )

    await close_task

    contexts = await bidi_session.browsing_context.get_tree()
    assert len(contexts) == 1

    assert contexts[0]["context"] != new_context["context"]
