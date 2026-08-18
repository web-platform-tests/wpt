import pytest

pytestmark = pytest.mark.asyncio


async def test_contexts_isolation(
    bidi_session,
    top_context,
    match_media,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    another_context = await bidi_session.browsing_context.create(type_hint="tab")

    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )

    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )
    assert (
        await match_media(
            another_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )

    yet_another_context = await bidi_session.browsing_context.create(type_hint="tab")
    assert (
        await match_media(
            yet_another_context,
            f"(prefers-color-scheme: {default_prefers_color_scheme})",
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )

    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )
    assert (
        await match_media(
            another_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )
    assert (
        await match_media(
            yet_another_context,
            f"(prefers-color-scheme: {default_prefers_color_scheme})",
        )
        is True
    )


async def test_multiple_contexts(
    bidi_session,
    top_context,
    new_tab,
    match_media,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"], new_tab["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )

    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )
    assert (
        await match_media(
            new_tab, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    # Reset override on new_tab.
    await bidi_session.emulation.set_media_features_override(
        contexts=[new_tab["context"]],
        features=None,
    )

    assert (
        await match_media(
            new_tab, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )
    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    # Reset override on top_context.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )

    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_frame(
    bidi_session,
    url,
    match_media,
    top_context,
    create_iframe,
    domain,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    iframe_id = await create_iframe(top_context, url("/", domain=domain))

    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )

    assert (
        await match_media(
            iframe_id, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )

    assert (
        await match_media(
            iframe_id, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )


async def test_navigation(
    bidi_session,
    new_tab,
    url,
    match_media,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    await bidi_session.emulation.set_media_features_override(
        contexts=[new_tab["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )

    assert (
        await match_media(
            new_tab, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=url("/webdriver/tests/bidi/browsing_context/support/empty.html"),
        wait="complete",
    )

    assert (
        await match_media(
            new_tab, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(
        contexts=[new_tab["context"]],
        features=None,
    )

    assert (
        await match_media(
            new_tab, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )


async def test_sandboxes(
    bidi_session,
    top_context,
    match_media,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )

    assert (
        await match_media(
            top_context,
            f"(prefers-color-scheme: {some_prefers_color_scheme})",
            sandbox="some_sandbox",
        )
        is True
    )
    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )

    assert (
        await match_media(
            top_context,
            f"(prefers-color-scheme: {default_prefers_color_scheme})",
            sandbox="some_sandbox",
        )
        is True
    )
    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )


async def test_overrides_user_contexts(
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
        contexts=[affected_context["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(
        user_contexts=[affected_user_context],
        features={"prefers-color-scheme": default_prefers_color_scheme},
    )
    # Context override takes precedence over user context override.
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    # Reset context override -> user context override takes effect.
    await bidi_session.emulation.set_media_features_override(
        contexts=[affected_context["context"]],
        features=None,
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )

    # Reset user context override -> default takes effect.
    await bidi_session.emulation.set_media_features_override(
        user_contexts=[affected_user_context],
        features=None,
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )


async def test_overrides_global(
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
        contexts=[affected_context["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    await bidi_session.emulation.set_media_features_override(
        features={"prefers-color-scheme": default_prefers_color_scheme}
    )
    # Context override takes precedence over global override.
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )

    # Reset context override -> global override takes effect.
    await bidi_session.emulation.set_media_features_override(
        contexts=[affected_context["context"]],
        features=None,
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )

    # Reset global override -> default takes effect.
    await bidi_session.emulation.set_media_features_override(
        features=None
    )
    assert (
        await match_media(
            affected_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )
