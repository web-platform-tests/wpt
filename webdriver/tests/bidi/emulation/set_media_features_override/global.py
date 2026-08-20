import pytest

pytestmark = pytest.mark.asyncio


async def test_top_level(
    bidi_session,
    match_media,
    affected_user_context,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    affected_context = await bidi_session.browsing_context.create(
        type_hint="tab", user_context=affected_user_context
    )

    await bidi_session.emulation.set_media_features_override(
        features={"prefers-color-scheme": some_prefers_color_scheme}
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    another_affected_context = await bidi_session.browsing_context.create(
        type_hint="tab", user_context=affected_user_context
    )
    assert (
        await match_media(
            another_affected_context,
            f"(prefers-color-scheme: {some_prefers_color_scheme})",
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(features=None)
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )
    assert (
        await match_media(
            another_affected_context,
            f"(prefers-color-scheme: {default_prefers_color_scheme})",
        )
        is True
    )


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_frame(
    bidi_session,
    url,
    match_media,
    create_iframe,
    domain,
    affected_user_context,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    affected_context = await bidi_session.browsing_context.create(
        type_hint="tab", user_context=affected_user_context
    )
    iframe_id = await create_iframe(affected_context, url("/", domain=domain))

    await bidi_session.emulation.set_media_features_override(
        features={"prefers-color-scheme": some_prefers_color_scheme}
    )
    assert (
        await match_media(
            iframe_id, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(features=None)
    assert (
        await match_media(
            iframe_id, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )


async def test_navigation(
    bidi_session,
    url,
    match_media,
    affected_user_context,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    affected_context = await bidi_session.browsing_context.create(
        type_hint="tab", user_context=affected_user_context
    )

    await bidi_session.emulation.set_media_features_override(
        features={"prefers-color-scheme": some_prefers_color_scheme}
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.browsing_context.navigate(
        context=affected_context["context"],
        url=url("/webdriver/tests/bidi/browsing_context/support/empty.html"),
        wait="complete",
    )

    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(features=None)
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )
