import pytest
import asyncio

from webdriver.bidi.modules.input import Actions

pytestmark = pytest.mark.asyncio

USER_PROMPT_OPENED_EVENT = "browsingContext.userPromptOpened"


@pytest.mark.parametrize("prompt_unload", [None, False])
async def test_prompt_unload_not_triggering_dialog(bidi_session, inline, subscribe_events, top_context, prompt_unload):
    url = inline(
        "<script>window.addEventListener('beforeunload', event => {event.preventDefault();});</script>")

    # Set up event listener to make sure the event is not automatically handle
    await subscribe_events([USER_PROMPT_OPENED_EVENT])

    await bidi_session.browsing_context.navigate(context=top_context["context"], url=url, wait="complete")

    # We need to interact with the page to trigger the beforeunload event.
    # https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
    actions = Actions()
    (
        actions.add_pointer()
        .pointer_move(x=0, y=0, duration=500)
        .pointer_down(button=0)
        .pointer_up(button=0)
    )
    await bidi_session.input.perform_actions(
        actions=actions, context=top_context["context"]
    )

    await bidi_session.browsing_context.close(context=top_context["context"], prompt_unload=prompt_unload)


async def test_prompt_unload_triggering_dialog(bidi_session, inline, subscribe_events, wait_for_event):
    url = inline(
        "<div>beforeunload</div><script>window.addEventListener('beforeunload', event => {event.preventDefault();});</script>")

    new_context = await bidi_session.browsing_context.create(type_hint="tab")

    # Set up event listener to make sure the event is not automatically handle
    await subscribe_events([USER_PROMPT_OPENED_EVENT])

    await bidi_session.browsing_context.navigate(context=new_context["context"], url=url, wait="complete")

    # We need to interact with the page to trigger the beforeunload event.
    # https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
    actions = Actions()
    (
        actions.add_pointer()
        .pointer_move(x=0, y=0, duration=500)
        .pointer_down(button=0)
        .pointer_up(button=0)
    )
    await bidi_session.input.perform_actions(
        actions=actions, context=new_context["context"]
    )

    user_prompt_opened = wait_for_event(USER_PROMPT_OPENED_EVENT)
    close_task = asyncio.create_task(
        bidi_session.browsing_context.close(
            context=new_context["context"], prompt_unload=True)
    )

    await user_prompt_opened

    all_contexts = await bidi_session.browsing_context.get_tree()
    assert len(all_contexts) == 2

    await bidi_session.browsing_context.handle_user_prompt(
        context=new_context["context"],
    )

    await close_task

    all_contexts = await bidi_session.browsing_context.get_tree()

    assert len(all_contexts) == 1
