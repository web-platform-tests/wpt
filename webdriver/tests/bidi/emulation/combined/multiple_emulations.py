import pytest

pytestmark = pytest.mark.asyncio


async def test_locale_and_timezone_for_user_context(
    bidi_session,
    create_user_context,
    new_tab,
    some_locale,
    assert_locale_against_default,
    assert_locale_against_value,
    get_current_timezone,
    default_timezone,
    some_timezone,
):
    user_context = await create_user_context()

    await assert_locale_against_default(new_tab)
    assert await get_current_timezone(new_tab) == default_timezone

    # Set locale override.
    await bidi_session.emulation.set_locale_override(
        user_contexts=[user_context], locale=some_locale
    )

    # Set timezone override.
    await bidi_session.emulation.set_timezone_override(
        user_contexts=[user_context], timezone=some_timezone
    )

    # Create a new context in the user context.
    context_in_user_context = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )

    # Assert the locale and timezone is emulated in a new browsing context of the user context.
    await assert_locale_against_value(some_locale, context_in_user_context)
    assert await get_current_timezone(context_in_user_context) == some_timezone


async def test_locale_and_media_features_for_user_context(
    bidi_session,
    create_user_context,
    new_tab,
    some_locale,
    assert_locale_against_default,
    assert_locale_against_value,
):
    user_context = await create_user_context()

    await assert_locale_against_default(new_tab)

    # Set locale override.
    await bidi_session.emulation.set_locale_override(
        user_contexts=[user_context], locale=some_locale
    )

    # Set media features override.
    await bidi_session.emulation.set_media_features_override(
        user_contexts=[user_context],
        features={"prefers-color-scheme": "dark"},
    )

    # Create a new context in the user context.
    context_in_user_context = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )

    # Assert the locale and media features are emulated in a new browsing context of the user context.
    await assert_locale_against_value(some_locale, context_in_user_context)
    result = await bidi_session.script.evaluate(
        expression="window.matchMedia('(prefers-color-scheme: dark)').matches",
        target=ContextTarget(context_in_user_context["context"]),
        await_promise=False,
    )
    assert result["value"] is True
