import pytest


@pytest.mark.asyncio
async def test_browsing_context_context_created_emitted(bidi_session,
      wait_for_event, recursive_compare):
    await bidi_session.session.subscribe(
        events=["browsingContext.contextCreated"])

    on_context_created_promise = wait_for_event(
        "browsingContext.contextCreated")

    create_command_promise = await bidi_session.send_command(
        "browsingContext.create", {})

    context_created_event = await on_context_created_promise

    recursive_compare({
        "context": "__any_value__",
        "children": [],
        "url": "__any_value__"},
        context_created_event, ["url", "context"])

    await create_command_promise
