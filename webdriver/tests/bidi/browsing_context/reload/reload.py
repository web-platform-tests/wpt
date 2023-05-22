import pytest

pytestmark = pytest.mark.asyncio


async def test_payload(bidi_session, inline, new_tab):
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url)

    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"])
    assert result == {}


async def test_relative_url(bidi_session, new_tab, url):
    url = url(
        "/webdriver/tests/bidi/browsing_context/navigate/support/empty.html")
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url)

    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"])
    assert result == {}
