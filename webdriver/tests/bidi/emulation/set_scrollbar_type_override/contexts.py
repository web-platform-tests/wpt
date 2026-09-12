import pytest

pytestmark = pytest.mark.asyncio


async def test_contexts(
    bidi_session, top_context, get_scrollbar_width, default_scrollbar_width
):
    new_context = await bidi_session.browsing_context.create(type_hint="tab")

    # Verify baseline state.
    assert await get_scrollbar_width(top_context) == default_scrollbar_width
    assert await get_scrollbar_width(new_context) == default_scrollbar_width

    # Apply override only to new_context.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context["context"]],
        scrollbar_type="overlay",
    )
    assert await get_scrollbar_width(new_context) == 0
    assert await get_scrollbar_width(top_context) == default_scrollbar_width

    # Create another context and verify isolation.
    another_context = await bidi_session.browsing_context.create(type_hint="tab")
    assert await get_scrollbar_width(another_context) == default_scrollbar_width

    # Clear context-level override.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context["context"]],
        scrollbar_type=None,
    )
    assert await get_scrollbar_width(new_context) == default_scrollbar_width
    assert await get_scrollbar_width(top_context) == default_scrollbar_width
    assert await get_scrollbar_width(another_context) == default_scrollbar_width


async def test_multiple_contexts(
    bidi_session, top_context, get_scrollbar_width, default_scrollbar_width
):
    new_context_1 = await bidi_session.browsing_context.create(type_hint="tab")
    new_context_2 = await bidi_session.browsing_context.create(type_hint="tab")

    # Apply override to multiple contexts simultaneously.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context_1["context"], new_context_2["context"]],
        scrollbar_type="overlay",
    )
    assert await get_scrollbar_width(new_context_1) == 0
    assert await get_scrollbar_width(new_context_2) == 0
    assert await get_scrollbar_width(top_context) == default_scrollbar_width

    # Clear override on both contexts.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context_1["context"], new_context_2["context"]],
        scrollbar_type=None,
    )
    assert await get_scrollbar_width(new_context_1) == default_scrollbar_width
    assert await get_scrollbar_width(new_context_2) == default_scrollbar_width


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_nested_contexts(
    bidi_session,
    url,
    create_iframe,
    domain,
    get_scrollbar_width,
    default_scrollbar_width,
):
    new_context = await bidi_session.browsing_context.create(type_hint="tab")

    # Apply override to new_context.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context["context"]],
        scrollbar_type="overlay",
    )
    assert await get_scrollbar_width(new_context) == 0

    # Verify inheritance in child iframe.
    iframe_id = await create_iframe(new_context, url("/", domain=domain))
    assert await get_scrollbar_width(iframe_id) == 0

    # Clear override on new_context and verify iframe falls back.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context["context"]],
        scrollbar_type=None,
    )
    assert await get_scrollbar_width(new_context) == default_scrollbar_width
    assert await get_scrollbar_width(iframe_id) == default_scrollbar_width


async def test_overrides_user_contexts(
    bidi_session, affected_user_context, get_scrollbar_width, default_scrollbar_width
):
    context_in_user_context = await bidi_session.browsing_context.create(
        type_hint="tab", user_context=affected_user_context
    )

    # Set context-level and user-context-level overrides.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[context_in_user_context["context"]],
        scrollbar_type="classic",
    )
    await bidi_session.emulation.set_scrollbar_type_override(
        user_contexts=[affected_user_context],
        scrollbar_type="overlay",
    )

    # Context-level override takes precedence.
    assert await get_scrollbar_width(context_in_user_context) > 0

    # Clearing context-level setting falls back to user-context setting.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[context_in_user_context["context"]],
        scrollbar_type=None,
    )
    assert await get_scrollbar_width(context_in_user_context) == 0

    # Clearing user-context setting reverts to default.
    await bidi_session.emulation.set_scrollbar_type_override(
        user_contexts=[affected_user_context],
        scrollbar_type=None,
    )
    assert (
        await get_scrollbar_width(context_in_user_context)
        == default_scrollbar_width
    )


async def test_overrides_global(
    bidi_session, get_scrollbar_width, default_scrollbar_width
):
    new_context = await bidi_session.browsing_context.create(type_hint="tab")

    # Set context-level and global-level overrides.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context["context"]],
        scrollbar_type="classic",
    )
    await bidi_session.emulation.set_scrollbar_type_override(
        scrollbar_type="overlay",
    )

    # Context-level override takes precedence over global.
    assert await get_scrollbar_width(new_context) > 0

    # Clearing context-level setting falls back to global setting.
    await bidi_session.emulation.set_scrollbar_type_override(
        contexts=[new_context["context"]],
        scrollbar_type=None,
    )
    assert await get_scrollbar_width(new_context) == 0

    # Clearing global setting reverts to default.
    await bidi_session.emulation.set_scrollbar_type_override(
        scrollbar_type=None,
    )
    assert await get_scrollbar_width(new_context) == default_scrollbar_width
