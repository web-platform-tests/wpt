# META: timeout=long

import pytest

from . import MEDIA_FEATURE_NAMES_AND_SAMPLE_VALUES
from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "feature, value",
    [
        (feature, value)
        for feature, values, _ in MEDIA_FEATURE_NAMES_AND_SAMPLE_VALUES
        for value in values
    ],
)
async def test_media_feature_set_override_and_reset(
    bidi_session, top_context, match_media, feature, value
):
    # Set media feature override.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={feature: value},
    )

    # Assert media feature is overridden.
    assert await match_media(top_context, f"({feature}: {value})") is True

    # Reset media feature override.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )


async def test_media_features_multiple(bidi_session, top_context, match_media):
    # Set multiple media features override.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={
            "prefers-color-scheme": "dark",
            "hover": "hover",
            "forced-colors": "none",
        },
    )

    assert await match_media(top_context, "(prefers-color-scheme: dark)") is True
    assert await match_media(top_context, "(hover: hover)") is True
    assert await match_media(top_context, "(forced-colors: none)") is True

    # Reset media features override.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )


async def test_media_features_partial_override_and_reset_single_feature(
    bidi_session,
    top_context,
    match_media,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
):
    # Set multiple media features override.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={
            "prefers-color-scheme": some_prefers_color_scheme,
            "hover": "hover",
        },
    )

    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {some_prefers_color_scheme})"
        )
        is True
    )
    assert await match_media(top_context, "(hover: hover)") is True

    # Override with hover set to None (cleared).
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={
            "hover": None,
        },
    )

    # Hover is now cleared. prefers-color-scheme was not in the new map, so it is also unset.
    assert (
        await match_media(
            top_context, f"(prefers-color-scheme: {default_prefers_color_scheme})"
        )
        is True
    )

    # Reset all overrides.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )


async def test_media_features_empty_dict(bidi_session, top_context):
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={},
    )


async def test_media_features_css_computed_style(
    bidi_session, top_context, inline, default_prefers_color_scheme
):
    test_page = inline("""
        <style>
            #target {
                color: rgb(0, 0, 255);
            }
            @media (prefers-color-scheme: dark) {
                #target {
                    color: rgb(255, 0, 0);
                }
            }
            @media (prefers-color-scheme: light) {
                #target {
                    color: rgb(0, 255, 0);
                }
            }
        </style>
        <div id="target">Test</div>
    """)

    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=test_page, wait="complete"
    )

    # Check default styling.
    expected_default_color = (
        "rgb(255, 0, 0)" if default_prefers_color_scheme == "dark" else "rgb(0, 255, 0)"
    )
    result = await bidi_session.script.evaluate(
        expression="window.getComputedStyle(document.getElementById('target')).color",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )
    assert result["value"] == expected_default_color

    # Override to dark.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={"prefers-color-scheme": "dark"},
    )
    result = await bidi_session.script.evaluate(
        expression="window.getComputedStyle(document.getElementById('target')).color",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )
    assert result["value"] == "rgb(255, 0, 0)"

    # Override to light.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features={"prefers-color-scheme": "light"},
    )
    result = await bidi_session.script.evaluate(
        expression="window.getComputedStyle(document.getElementById('target')).color",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )
    assert result["value"] == "rgb(0, 255, 0)"

    # Reset override.
    await bidi_session.emulation.set_media_features_override(
        contexts=[top_context["context"]],
        features=None,
    )
    result = await bidi_session.script.evaluate(
        expression="window.getComputedStyle(document.getElementById('target')).color",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )
    assert result["value"] == expected_default_color


async def test_media_features_change_event(
    bidi_session,
    new_tab,
    default_prefers_color_scheme,
    some_prefers_color_scheme,
    subscribe_events,
    add_preload_script,
    wait_for_event,
    wait_for_future_safe,
    inline,
):
    await subscribe_events(["script.message"])
    await add_preload_script(
        function_declaration="""(channel) => {
            const mql = window.matchMedia("(prefers-color-scheme: dark)");
            mql.addEventListener(
                "change",
                (e) => channel(e.matches)
            );
        }""",
        arguments=[{"type": "channel", "value": {"channel": "change_event"}}],
    )

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("<div>test</div>"), wait="complete"
    )

    on_script_message = wait_for_event("script.message")

    # Set override to a different value than default.
    await bidi_session.emulation.set_media_features_override(
        contexts=[new_tab["context"]],
        features={"prefers-color-scheme": some_prefers_color_scheme},
    )

    event_data = await wait_for_future_safe(on_script_message)
    expected_matches = some_prefers_color_scheme == "dark"
    assert event_data["data"]["value"] == expected_matches

    on_script_message = wait_for_event("script.message")

    # Reset override.
    await bidi_session.emulation.set_media_features_override(
        contexts=[new_tab["context"]],
        features=None,
    )

    event_data = await wait_for_future_safe(on_script_message)
    expected_default_matches = default_prefers_color_scheme == "dark"
    assert event_data["data"]["value"] == expected_default_matches
