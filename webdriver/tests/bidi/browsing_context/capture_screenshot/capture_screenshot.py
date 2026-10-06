# META: timeout=long

import pytest

from math import ceil, floor
from tests.support.image import png_dimensions
from webdriver.bidi.modules.script import ContextTarget

from ... import (get_device_pixel_ratio, get_viewport_dimensions,
                 remote_mapping_to_dict)

pytestmark = pytest.mark.asyncio


async def get_visual_viewport_metrics(bidi_session, context):
    result = await bidi_session.script.call_function(
        function_declaration="""() => {
            return {
                devicePixelRatio: window.devicePixelRatio,
                height: window.visualViewport.height,
                width: window.visualViewport.width,
            };
        }""",
        target=ContextTarget(context["context"]),
        await_promise=False,
    )
    return remote_mapping_to_dict(result["value"])


@pytest.mark.parametrize("activate", [True, False],
                         ids=["with activate", "without activate"])
async def test_capture(bidi_session, top_context, inline, compare_png_bidi,
                       activate):
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url="about:blank", wait="complete")
    if activate:
        await bidi_session.browsing_context.activate(
            context=top_context["context"])

    # The empty document has no scrollable overflow, so this test does not
    # define whether viewport screenshots include scrollbar dimensions.
    viewport = await get_visual_viewport_metrics(bidi_session, top_context)
    reference_data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])
    actual_width, actual_height = png_dimensions(reference_data)
    expected_width = viewport["width"] * viewport["devicePixelRatio"]
    expected_height = viewport["height"] * viewport["devicePixelRatio"]

    # Bitmap dimensions are integral, but visual viewport dimensions can be
    # fractional. Use the existing WPT floor-to-ceil tolerance for converting
    # CSS dimensions to physical pixels.
    assert floor(expected_width) <= actual_width <= ceil(expected_width), (
        f"Expected screenshot width between {floor(expected_width)} and "
        f"{ceil(expected_width)} for visual viewport {viewport}, got "
        f"{actual_width}")
    assert floor(expected_height) <= actual_height <= ceil(expected_height), (
        f"Expected screenshot height between {floor(expected_height)} and "
        f"{ceil(expected_height)} for visual viewport {viewport}, got "
        f"{actual_height}")

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=inline("<div>foo</div>"),
        wait="complete")
    if activate:
        await bidi_session.browsing_context.activate(
            context=top_context["context"])
    data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])

    comparison = await compare_png_bidi(data, reference_data)
    assert not comparison.equal()

    # Take a second screenshot that should be identical to validate that
    # we don't just always return false here
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=inline("<div>foo</div>"), wait="complete"
    )
    if activate:
        await bidi_session.browsing_context.activate(
            context=top_context["context"])
    new_data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])

    comparison = await compare_png_bidi(new_data, data)
    assert comparison.equal()


@pytest.mark.parametrize("delta_width", [-10, +20], ids=["width smaller", "width larger"])
@pytest.mark.parametrize("delta_height", [-30, +40], ids=["height smaller", "height larger"])
async def test_capture_with_viewport(bidi_session, new_tab, delta_width, delta_height):
    original_viewport = await get_viewport_dimensions(bidi_session, new_tab)

    dpr = await get_device_pixel_ratio(bidi_session, new_tab)

    test_viewport = {
        "width": original_viewport["width"] + delta_width,
        "height": original_viewport["height"] + delta_height
    }
    await bidi_session.browsing_context.set_viewport(
        context=new_tab["context"],
        viewport=test_viewport)

    expected_size = {
        "width": floor(test_viewport["width"] * dpr),
        "height": floor(test_viewport["height"] * dpr)
    }

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url="about:blank", wait="complete"
    )

    result = await bidi_session.browsing_context.capture_screenshot(
        context=new_tab["context"])
    assert png_dimensions(result) == (expected_size["width"], expected_size["height"])


@pytest.mark.parametrize("dpr", [0.5, 2])
async def test_capture_with_different_dpr(bidi_session, new_tab, inline, dpr):
    page = inline("<div style='background-color: black; width: 100px; height: 100px;'></div>")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=page, wait="complete"
    )

    original_viewport = await get_viewport_dimensions(bidi_session, new_tab)

    await bidi_session.browsing_context.set_viewport(
        context=new_tab["context"],
        device_pixel_ratio=dpr)

    expected_width = original_viewport["width"] * dpr
    expected_height = original_viewport["height"] * dpr

    data = await bidi_session.browsing_context.capture_screenshot(context=new_tab["context"])
    (actual_width, actual_height) = png_dimensions(data)
    # The rounding is implementation-specific and can be either floor, ceil or round depending on the browser
    # implementation. Tolerate any value between floor and ceil.
    assert floor(expected_width) <= actual_width <= ceil(expected_width)
    assert floor(expected_height) <= actual_height <= ceil(expected_height)


async def test_clip_huge_element_to_viewport(bidi_session, top_context, inline):
    width = "32768px"
    height = "32768px"

    url = inline(f"<div style='width: {width}; height: {height}; background-color: black;'></div>")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"]
    )

    viewport = await get_viewport_dimensions(bidi_session, top_context)
    (actual_width, actual_height) = png_dimensions(data)

    assert actual_width == viewport["width"]
    assert actual_height == viewport["height"]
