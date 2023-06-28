import pytest

pytestmark = pytest.mark.asyncio


async def test_return_value(bidi_session, inline, new_tab):
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url)

    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"])
    assert result == {}


@pytest.mark.parametrize(
    "url",
    ["about:blank", "https://example.com/#foo", "data:text/html,<p>foo</p>"],
    ids=[
        "about:blank",
        "hash",
        "data url",
    ],
)
async def test_reload(bidi_session, new_tab, url):
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url)
    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"])
    assert result == {}

    contexts = await bidi_session.browsing_context.get_tree(
        root=new_tab['context'])
    assert len(contexts) == 1
    assert contexts[0]["url"] == url
