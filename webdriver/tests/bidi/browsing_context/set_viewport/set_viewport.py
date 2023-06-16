import pytest

from . import layout_viewport_dimensions

@pytest.mark.asyncio
async def test_set_viewport(bidi_session, top_context, inline):
    original_viewport = await layout_viewport_dimensions(bidi_session, top_context)

    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url="about:blank", wait="complete"
    )

    await bidi_session.browsing_context.set_viewport(
        context=top_context["context"],
        viewport={
          "width": 250,
          "height": 300,
      })
    assert await layout_viewport_dimensions(bidi_session, top_context) == (250, 300)

    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=inline("<div>foo</div>"), wait="complete"
    )
    assert await layout_viewport_dimensions(bidi_session, top_context) == (250, 300)

    await bidi_session.browsing_context.set_viewport(
      context=top_context["context"],
      viewport=None)
    assert await layout_viewport_dimensions(bidi_session, top_context) == original_viewport
