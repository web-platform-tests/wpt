import pytest

from . import (SOME_BIDI_SCREEN_ORIENTATION, SOME_WEB_SCREEN_ORIENTATION,
               ANOTHER_BIDI_SCREEN_ORIENTATION, ANOTHER_WEB_SCREEN_ORIENTATION)

pytestmark = pytest.mark.asyncio


async def test_user_contexts(
        bidi_session,
        create_user_context,
        new_tab,
        get_screen_orientation,
):
    user_context = await create_user_context()
    context_in_user_context_1 = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )
    default_screen_orientation = await get_screen_orientation(
        context_in_user_context_1)

    assert await get_screen_orientation(new_tab) == default_screen_orientation

    # Set screen orientation override.
    await bidi_session.emulation.set_screen_orientation_override(
        user_contexts=[user_context],
        screen_orientation=SOME_BIDI_SCREEN_ORIENTATION
    )

    assert await get_screen_orientation(
        context_in_user_context_1) == SOME_WEB_SCREEN_ORIENTATION
    assert await get_screen_orientation(new_tab) == default_screen_orientation

    # Create a new context in the user context.
    context_in_user_context_2 = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )

    assert await get_screen_orientation(
        context_in_user_context_2) == SOME_WEB_SCREEN_ORIENTATION


async def test_set_to_default_user_context(
        bidi_session,
        new_tab,
        create_user_context,
        get_screen_orientation,
):
    user_context = await create_user_context()
    context_in_user_context_1 = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )
    default_screen_orientation = await get_screen_orientation(new_tab)

    await bidi_session.emulation.set_screen_orientation_override(
        user_contexts=["default"],
        screen_orientation=SOME_BIDI_SCREEN_ORIENTATION
    )

    # Make sure that the screen orientation changes are only applied to the
    # context associated with default user context.
    assert await get_screen_orientation(
        context_in_user_context_1) == default_screen_orientation
    assert await get_screen_orientation(new_tab) == SOME_WEB_SCREEN_ORIENTATION

    # Create a new context in the default context.
    context_in_default_context_2 = await bidi_session.browsing_context.create(
        type_hint="tab"
    )

    assert await get_screen_orientation(
        context_in_default_context_2) == SOME_WEB_SCREEN_ORIENTATION

    # Reset screen orientation override.
    await bidi_session.emulation.set_screen_orientation_override(
        user_contexts=["default"], screen_orientation=None
    )


async def test_set_to_multiple_user_contexts(
        bidi_session,
        create_user_context,
        get_screen_orientation,
):
    user_context_1 = await create_user_context()
    context_in_user_context_1 = await bidi_session.browsing_context.create(
        user_context=user_context_1, type_hint="tab"
    )
    user_context_2 = await create_user_context()
    context_in_user_context_2 = await bidi_session.browsing_context.create(
        user_context=user_context_2, type_hint="tab"
    )

    await bidi_session.emulation.set_screen_orientation_override(
        user_contexts=[user_context_1, user_context_2],
        screen_orientation=SOME_BIDI_SCREEN_ORIENTATION)

    assert await get_screen_orientation(
        context_in_user_context_1) == SOME_WEB_SCREEN_ORIENTATION
    assert await get_screen_orientation(
        context_in_user_context_2) == SOME_WEB_SCREEN_ORIENTATION


async def test_set_to_user_context_and_then_to_context(
        bidi_session,
        create_user_context,
        new_tab,
        get_screen_orientation,
):
    user_context = await create_user_context()
    context_in_user_context_1 = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )
    default_screen_orientation = await get_screen_orientation(
        context_in_user_context_1)

    # Apply screen orientation override to the user context.
    await bidi_session.emulation.set_screen_orientation_override(
        user_contexts=[user_context],
        screen_orientation=SOME_BIDI_SCREEN_ORIENTATION)

    # Apply screen orientation override now only to the context.
    await bidi_session.emulation.set_screen_orientation_override(
        contexts=[context_in_user_context_1["context"]],
        screen_orientation=ANOTHER_BIDI_SCREEN_ORIENTATION)
    assert await get_screen_orientation(
        context_in_user_context_1) == ANOTHER_WEB_SCREEN_ORIENTATION

    await bidi_session.browsing_context.reload(
        context=context_in_user_context_1["context"], wait="complete"
    )

    # Make sure that after reload the screen orientation is still updated.
    assert await get_screen_orientation(
        context_in_user_context_1) == ANOTHER_WEB_SCREEN_ORIENTATION

    # Create a new context in the user context.
    context_in_user_context_2 = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )
    # Make sure that the screen orientation override for the user context is
    # applied.
    assert await get_screen_orientation(
        context_in_user_context_2) == SOME_WEB_SCREEN_ORIENTATION

    await bidi_session.emulation.set_screen_orientation_override(
        contexts=[context_in_user_context_1["context"]],
        screen_orientation=None,
    )

    # Make sure that the screen orientation override was reset.
    assert await get_screen_orientation(
        context_in_user_context_1) == default_screen_orientation
