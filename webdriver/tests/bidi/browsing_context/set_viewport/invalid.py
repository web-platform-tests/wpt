import pytest

import webdriver.bidi.error as error


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
@pytest.mark.asyncio
async def test_params_context_invalid_context(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.set_viewport(context=value, viewport={
            "width": 100,
            "height": 200,
        })


@pytest.mark.parametrize("viewport", [{"width": -1, "height": -1}, {"width": None, "height": 300}, {"width": 1200, "height": "String"}])
@pytest.mark.asyncio
async def test_params_context_invalid_viewport(bidi_session, new_tab, viewport):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.set_viewport(context=new_tab["context"], viewport=viewport)


@pytest.mark.asyncio
async def test_invalid_frame(bidi_session):
    with pytest.raises(error.NoSuchFrameException):
        await bidi_session.browsing_context.set_viewport(context="_invalid_")


@pytest.mark.asyncio
async def test_closed_frame(bidi_session, top_context, inline, add_and_remove_iframe):
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )
    frame_id = await add_and_remove_iframe(top_context)
    with pytest.raises(error.NoSuchFrameException):
        await bidi_session.browsing_context.set_viewport(context=frame_id)
