import pytest

pytestmark = pytest.mark.asyncio

from .. import get_visibility_state

@pytest.mark.parametrize("type_hint", ["tab", "window"])
async def test_background_default_false(bidi_session, type_hint):
    new_context = await bidi_session.browsing_context.create(type_hint=type_hint)

    assert await get_visibility_state(bidi_session, new_context) == "visible"

    await bidi_session.browsing_context.close(context=new_context["context"])


@pytest.mark.parametrize("type_hint", ["tab", "window"])
@pytest.mark.parametrize("background", [True, False])
async def test_background(bidi_session, type_hint, background):
    new_context = await bidi_session.browsing_context.create(type_hint=type_hint, background=background)

    assert await get_visibility_state(bidi_session, new_context) == ("hidden" if background else "visible")

    await bidi_session.browsing_context.close(context=new_context["context"])
