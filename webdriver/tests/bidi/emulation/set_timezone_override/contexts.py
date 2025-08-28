import pytest

pytestmark = pytest.mark.asyncio


async def test_contexts(bidi_session, new_tab, top_context,
        get_current_timezone,
        default_timezone, some_timezone):
    # Set timezone override.
    await bidi_session.emulation.set_timezone_override(
        contexts=[new_tab["context"]],
        timezone=some_timezone
    )

    # Assert timezone emulated only in the required context.
    assert await get_current_timezone(new_tab) == some_timezone
    assert await get_current_timezone(top_context) == default_timezone

    # Reset timezone override.
    await bidi_session.emulation.set_timezone_override(
        contexts=[new_tab["context"]],
        timezone=None)

    # Assert the timezone is restored to the initial one.
    assert await get_current_timezone(new_tab) == default_timezone
    assert await get_current_timezone(top_context) == default_timezone


async def test_multiple_contexts(bidi_session, new_tab, get_current_timezone,
        default_timezone, some_timezone):
    new_context = await bidi_session.browsing_context.create(type_hint="tab")

    # Set timezone override.
    await bidi_session.emulation.set_timezone_override(
        contexts=[new_tab["context"], new_context["context"]],
        timezone=some_timezone
    )

    # Assert timezone emulated in all the required contexts.
    assert await get_current_timezone(new_tab) == some_timezone
    assert await get_current_timezone(new_context) == some_timezone

    # Reset timezone override.
    await bidi_session.emulation.set_timezone_override(
        contexts=[new_tab["context"], new_context["context"]],
        timezone=None)

    # Assert the timezone is restored to the initial one.
    assert await get_current_timezone(new_tab) == default_timezone
    assert await get_current_timezone(new_context) == default_timezone


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_iframe(
    bidi_session,
    new_tab,
    domain,
    inline,
    get_current_timezone,
    some_timezone,
    another_timezone
):
    # Set timezone override.
    await bidi_session.emulation.set_timezone_override(
        contexts=[new_tab["context"]],
        timezone=some_timezone
    )

    # Assert timezone emulated in the required context.
    assert await get_current_timezone(new_tab) == some_timezone

    iframe_url = inline("<div id='in-iframe'>foo</div>", domain=domain)
    page_url = inline(f"<iframe src='{iframe_url}'></iframe>")

    # Load the page with iframes.
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=page_url,
        wait="complete",
    )

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])
    iframe = contexts[0]["children"][0]

    # Assert timezone is emulated in the iframe context.
    assert await get_current_timezone(iframe) == some_timezone

    # Set another timezone override.
    await bidi_session.emulation.set_timezone_override(
        contexts=[new_tab["context"]], timezone=another_timezone
    )

    # Assert timezone is emulated in the iframe context.
    assert await get_current_timezone(iframe) == another_timezone
