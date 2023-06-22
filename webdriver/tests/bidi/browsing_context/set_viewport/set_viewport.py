import pytest

from ... import get_viewport_dimensions


@pytest.mark.asyncio
async def test_set_viewport(bidi_session, new_tab):
    test_viewport = {"width": 250, "height": 300}

    await bidi_session.browsing_context.set_viewport(
        context=new_tab["context"],
        viewport=test_viewport)
    
    assert await get_viewport_dimensions(bidi_session, new_tab) == test_viewport


@pytest.mark.asyncio
async def test_set_viewport_reset(bidi_session, new_tab):
    original_viewport = await get_viewport_dimensions(bidi_session, new_tab)

    test_viewport = {"width": 666, "height": 333}
    await bidi_session.browsing_context.set_viewport(
      context=new_tab["context"],
      viewport=test_viewport)

    assert await get_viewport_dimensions(bidi_session, new_tab) == test_viewport

    await bidi_session.browsing_context.set_viewport(
      context=new_tab["context"],
      viewport=None)
    assert await get_viewport_dimensions(bidi_session, new_tab) == original_viewport


@pytest.mark.asyncio
async def test_set_viewport_affects_specific_context(bidi_session, top_context, new_tab):
    original_viewport = await get_viewport_dimensions(bidi_session, top_context)

    test_viewport = {"width": 333, "height": 333}
    await bidi_session.browsing_context.set_viewport(
      context=new_tab["context"],
      viewport=test_viewport)

    assert await get_viewport_dimensions(bidi_session, new_tab) == test_viewport
    assert await get_viewport_dimensions(bidi_session, top_context) == original_viewport


@pytest.mark.asyncio
async def test_set_viewport_persists_on_navigation(bidi_session, new_tab, inline):
    test_viewport = {"width": 499, "height": 599}

    await bidi_session.browsing_context.set_viewport(
        context=new_tab["context"],
        viewport=test_viewport)
    
    assert await get_viewport_dimensions(bidi_session, new_tab) == test_viewport

    url = inline("<div>foo</div>")
    result = await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=url, wait="complete"
    )

    assert await get_viewport_dimensions(bidi_session, new_tab) == test_viewport

@pytest.mark.asyncio
async def test_set_viewport_persists_on_reload(bidi_session, new_tab, inline):
    test_viewport = {"width": 499, "height": 599}

    await bidi_session.browsing_context.set_viewport(
        context=new_tab["context"],
        viewport=test_viewport)

    assert await get_viewport_dimensions(bidi_session, new_tab) == test_viewport

    url = inline("<div>foo</div>")
    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"], wait="complete"
    )

    assert await get_viewport_dimensions(bidi_session, new_tab) == test_viewport
