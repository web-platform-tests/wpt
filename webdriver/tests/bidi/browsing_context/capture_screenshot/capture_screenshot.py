import pytest

from tests.support.image import png_dimensions
from tests.support.screenshot import (DEFAULT_CONTENT,
                                      REFERENCE_CONTENT,
                                      REFERENCE_STYLE,
                                      OUTER_IFRAME_STYLE,
                                      INNER_IFRAME_STYLE)


from . import viewport_dimensions


@pytest.mark.asyncio
async def test_capture(bidi_session, top_context, inline):
    expected_size = await viewport_dimensions(bidi_session, top_context)

    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url="about:blank", wait="complete"
    )
    reference_data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])
    assert png_dimensions(reference_data) == expected_size

    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )
    data = await bidi_session.browsing_context.capture_screenshot(context=top_context["context"])
    assert png_dimensions(data) == expected_size

    assert reference_data != data
