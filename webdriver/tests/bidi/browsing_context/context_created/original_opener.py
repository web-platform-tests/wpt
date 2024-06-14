import pytest
from webdriver.bidi.modules.script import ContextTarget

from .. import assert_browsing_context

pytestmark = pytest.mark.asyncio

CONTEXT_CREATED_EVENT = "browsingContext.contextCreated"


@pytest.mark.parametrize("type_hint", ["tab", "window"])
async def test_original_opener_null(bidi_session, wait_for_event, wait_for_future_safe, subscribe_events, type_hint):

    await subscribe_events([CONTEXT_CREATED_EVENT])
    on_entry = wait_for_event(CONTEXT_CREATED_EVENT)

    top_level_context = await bidi_session.browsing_context.create(type_hint=type_hint)

    context_info = await wait_for_future_safe(on_entry)

    assert_browsing_context(
        context_info,
        # We use None here as evaluate no always returns value
        context=top_level_context["context"],
        children=None,
        url="about:blank",
        parent=None,
        user_context="default",
        originalOpener=None
    )


@pytest.mark.parametrize("type_hint", ["tab", "window"])
@pytest.mark.parametrize("window_features", ["", "popup", "noopener", "noreferrer"])
async def test_original_opener_present(bidi_session, wait_for_event, wait_for_future_safe, subscribe_events, type_hint, window_features):

    top_level_context = await bidi_session.browsing_context.create(type_hint=type_hint)

    await subscribe_events([CONTEXT_CREATED_EVENT])
    on_entry = wait_for_event(CONTEXT_CREATED_EVENT)

    await bidi_session.script.evaluate(
        expression=f"""window.open("", undefined, "{window_features}");""",
        target=ContextTarget(top_level_context["context"]),
        await_promise=False)

    context_info = await wait_for_future_safe(on_entry)

    assert_browsing_context(
        context_info,
        # We use None here as evaluate no always returns value
        context=None,
        children=None,
        url="about:blank",
        parent=None,
        user_context="default",
        originalOpener=top_level_context["context"]
    )
