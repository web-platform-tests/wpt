import pytest

pytestmark = pytest.mark.asyncio

TEST_PAIRS = [
    ({
         "natural": "landscape",
         "type": "portrait-secondary"
     }, {"angle": 270, "type": "portrait-secondary"}),
    ({
         "natural": "portrait",
         "type": "landscape-primary"
     }, {"angle": 90, "type": "landscape-primary"})]


@pytest.mark.parametrize("bidi_value,expected_web_value", TEST_PAIRS)
async def test_contexts(
        bidi_session, new_tab, top_context, url, get_screen_orientation,
        bidi_value, expected_web_value):
    # Assert the default screen orientation is the same in both contexts.
    default_screen_orientation = await get_screen_orientation(new_tab)
    assert await get_screen_orientation(
        top_context) == default_screen_orientation

    # Set screen orientation override.
    await bidi_session.emulation.set_screen_orientation_override(
        contexts=[new_tab["context"]],
        screen_orientation=bidi_value,
    )

    # Assert screen orientation in the new context is updated.
    assert await get_screen_orientation(new_tab) == expected_web_value
    # Assert screen orientation in the initial context is unchanged.
    assert await get_screen_orientation(
        top_context) == default_screen_orientation

    # Reset screen orientation override.
    await bidi_session.emulation.set_screen_orientation_override(
        contexts=[new_tab["context"]], screen_orientation=None
    )

    # Assert screen orientations are the default.
    assert await get_screen_orientation(new_tab) == default_screen_orientation
    assert await get_screen_orientation(
        top_context) == default_screen_orientation


@pytest.mark.parametrize("bidi_value,expected_web_value", TEST_PAIRS)
async def test_multiple_contexts(
        bidi_session, new_tab, top_context, url, get_screen_orientation,
        bidi_value, expected_web_value):
    # Assert the default screen orientation is the same in both contexts.
    default_screen_orientation = await get_screen_orientation(new_tab)
    assert await get_screen_orientation(
        top_context) == default_screen_orientation

    # Set screen orientation override.
    await bidi_session.emulation.set_screen_orientation_override(
        contexts=[top_context["context"], new_tab["context"]],
        screen_orientation=bidi_value,
    )

    # Assert screen orientations in both contexts are updated.
    assert await get_screen_orientation(new_tab) == expected_web_value
    assert await get_screen_orientation(
        top_context) == expected_web_value

    # Reset screen orientation override o the new tab.
    await bidi_session.emulation.set_screen_orientation_override(
        contexts=[new_tab["context"]],
        screen_orientation=None
    )

    # Assert screen orientation on the new tab is the default.
    assert await get_screen_orientation(new_tab) == default_screen_orientation
    assert await get_screen_orientation(
        top_context) == expected_web_value

    # Reset screen orientation override o the new tab.
    await bidi_session.emulation.set_screen_orientation_override(
        contexts=[top_context["context"], new_tab["context"]],
        screen_orientation=None
    )

    # Assert screen orientation on the new tab is the default.
    assert await get_screen_orientation(new_tab) == default_screen_orientation
    assert await get_screen_orientation(
        top_context) == default_screen_orientation
