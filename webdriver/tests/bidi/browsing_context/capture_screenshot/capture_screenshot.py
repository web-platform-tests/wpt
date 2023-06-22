import pytest

from tests.support.image import png_dimensions

from . import get_physical_viewport_dimensions
from ... import get_device_pixel_ratio


@pytest.mark.asyncio
async def test_capture(bidi_session, top_context, inline, compare_png_bidi):
    expected_size = await get_physical_viewport_dimensions(bidi_session, top_context)

    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url="about:blank", wait="complete"
    )
    reference_data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])
    assert png_dimensions(reference_data) == expected_size

    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=inline("<div>foo</div>"), wait="complete"
    )
    data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])

    comparison = await compare_png_bidi(data, reference_data)
    assert not comparison.equal()

    # Take a second screenshot that should be identical to validate that
    # we don't just always return false here
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=inline("<div>foo</div>"), wait="complete"
    )
    new_data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])

    comparison = await compare_png_bidi(new_data, data)
    assert comparison.equal()


@pytest.mark.asyncio
async def test_capture_with_viewport(bidi_session, new_tab):
    dpr = await get_device_pixel_ratio(bidi_session, new_tab)

    test_viewport = {"width": 499, "height": 599}
    await bidi_session.browsing_context.set_viewport(
        context=new_tab["context"],
        viewport=test_viewport)

    expected_size = {
        "width": test_viewport["width"] * dpr,
        "height": test_viewport["height"] * dpr
    }

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url="about:blank", wait="complete"
    )

    result = await bidi_session.browsing_context.capture_screenshot(
        context=new_tab["context"])
    assert png_dimensions(result) == (expected_size["width"], expected_size["height"])
