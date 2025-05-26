import pytest

pytestmark = pytest.mark.asyncio


async def test_contexts(bidi_session, top_context, get_current_locale,
        initial_locale, some_locale, another_locale):
    assert await get_current_locale(top_context) == initial_locale

    # Set locale override.
    await bidi_session.emulation.set_locale_override(
        contexts=[top_context["context"]],
        locale=some_locale
    )

    assert await get_current_locale(top_context) == some_locale

    # Set locale override.
    await bidi_session.emulation.set_locale_override(
        contexts=[top_context["context"]],
        locale=another_locale
    )

    assert await get_current_locale(top_context) == another_locale

    # Set locale override.
    await bidi_session.emulation.set_locale_override(
        contexts=[top_context["context"]],
        locale=None
    )

    assert await get_current_locale(top_context) == initial_locale
