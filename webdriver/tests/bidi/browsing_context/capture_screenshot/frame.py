import pytest

from tests.support.image import png_dimensions
from tests.support.screenshot import (DEFAULT_CONTENT,
                                      REFERENCE_CONTENT,
                                      REFERENCE_STYLE,
                                      OUTER_IFRAME_STYLE,
                                      INNER_IFRAME_STYLE)

from . import viewport_dimensions


@pytest.mark.asyncio
async def test_iframe(bidi_session, top_context, inline, iframe):
    viewport_size = await viewport_dimensions(bidi_session, top_context)

    iframe_content = f"{INNER_IFRAME_STYLE}{DEFAULT_CONTENT}"
    url = inline(f"{OUTER_IFRAME_STYLE}{iframe(iframe_content)}")
    await bidi_session.browsing_context.navigate(context=top_context["context"],
                                                 url=url,
                                                 wait="complete")
    reference_data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])
    assert png_dimensions(reference_data) == viewport_size

    all_contexts = await bidi_session.browsing_context.get_tree(root=top_context["context"])
    frame_context = all_contexts[0]["children"][0]

    data = await bidi_session.browsing_context.capture_screenshot(context=frame_context["context"])

    assert png_dimensions(data) < png_dimensions(reference_data)
    assert data != reference_data


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
@pytest.mark.asyncio
async def test_context_origin(bidi_session, top_context, inline, iframe, domain):
    expected_size = await viewport_dimensions(bidi_session, top_context)

    url = inline(f"{REFERENCE_STYLE}{REFERENCE_CONTENT}")
    await bidi_session.browsing_context.navigate(context=top_context["context"],
                                                 url=url,
                                                 wait="complete")

    reference_data = await bidi_session.browsing_context.capture_screenshot(
        context=top_context["context"])
    assert png_dimensions(reference_data) == expected_size

    iframe_content = f"{INNER_IFRAME_STYLE}{DEFAULT_CONTENT}"
    inline(f"{OUTER_IFRAME_STYLE}{iframe(iframe_content, domain=domain)}")

    data = await bidi_session.browsing_context.capture_screenshot(context=top_context["context"])
    assert png_dimensions(data) == expected_size

    assert data == reference_data
