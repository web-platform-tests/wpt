import asyncio
import pytest

from webdriver.bidi.modules.script import ContextTarget
from ... import recursive_compare

pytestmark = pytest.mark.asyncio

USER_PROMPT_OPENED_EVENT = "browsingContext.userPromptOpened"


@pytest.mark.parametrize("handler", ["accept", "dismiss", "ignore"])
async def test_beforeunload(bidi_session, subscribe_events, wait_for_event,
        wait_for_future_safe, create_user_context, handler,
        setup_beforeunload_page, inline):
    user_context = await create_user_context(
        unhandled_prompt_behavior={"beforeUnload": handler})
    new_tab = await bidi_session.browsing_context.create(
        type_hint="tab",
        user_context=user_context
    )

    await setup_beforeunload_page(new_tab)

    await subscribe_events(events=[USER_PROMPT_OPENED_EVENT])
    on_entry = wait_for_event(USER_PROMPT_OPENED_EVENT)

    url_after = inline("<div>foo</div>")

    asyncio.create_task(
        bidi_session.browsing_context.navigate(context=new_tab["context"],
                                               url=url_after, wait="none"))

    # Wait for prompt to appear.
    resp = await wait_for_future_safe(on_entry)
    recursive_compare({
        'context': new_tab["context"],
        'handler': handler,
        'type': "beforeunload",
    }, resp)


@pytest.mark.parametrize("handler", ["accept", "dismiss", "ignore"])
@pytest.mark.parametrize("prompt", ["alert", "confirm", "prompt", "default"])
async def test_js_handle(bidi_session, subscribe_events, wait_for_event,
        wait_for_future_safe, create_user_context, prompt, handler):
    script = prompt if (prompt is not None and prompt != 'default') else 'alert'
    user_context = await create_user_context(
        unhandled_prompt_behavior={prompt: handler})
    new_tab = await bidi_session.browsing_context.create(
        type_hint="tab",
        user_context=user_context
    )

    await subscribe_events([USER_PROMPT_OPENED_EVENT],
                           contexts=[new_tab["context"]])
    on_entry = wait_for_event(USER_PROMPT_OPENED_EVENT)

    # Schedule script opening prompt but don't wait for the result.
    asyncio.create_task(
        bidi_session.script.evaluate(
            expression=f"window.{script}('some message')",
            target=ContextTarget(new_tab["context"]),
            await_promise=False,
        )
    )

    # Default behavior for js prompts is `dismiss`.
    expected_handler = handler if handler is not None \
        else 'dismiss'

    # Wait for prompt to appear.
    resp = await wait_for_future_safe(on_entry)
    recursive_compare({
        'context': new_tab["context"],
        'handler': expected_handler,
        'type': script,
    }, resp)


@pytest.mark.parametrize("handler", ["accept", "dismiss", "ignore"])
async def test_file(bidi_session, create_user_context, handler,
        assert_file_dialog_not_canceled, assert_file_dialog_canceled):
    user_context = await create_user_context(
        unhandled_prompt_behavior={"file": handler})

    new_tab = await bidi_session.browsing_context.create(
        type_hint="tab",
        user_context=user_context
    )

    # Unless explicitly set to `ignore`, the file behavior is `dismiss`.
    if handler == 'ignore':
        assert_file_dialog_not_canceled(new_tab)
    else:
        assert_file_dialog_canceled(new_tab)
