import pytest

pytestmark = pytest.mark.asyncio

PNG_BLACK_DOT = "/webdriver/tests/bidi/browsing_context/navigate/support/black_dot.png"


async def test_return_value(bidi_session, inline, new_tab):
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url)

    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"])
    assert result == {}


@pytest.mark.parametrize(
    "initial_url",
    [
        "about:blank",
        "https://example.com/#foo",
        "data:text/html,<p>foo</p>",
    ],
    ids=[
        "about:blank",
        "hash",
        "data url",
    ],
)
async def test_reload(bidi_session, new_tab, initial_url):
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=initial_url)
    await bidi_session.browsing_context.reload(context=new_tab["context"])

    contexts = await bidi_session.browsing_context.get_tree(
        root=new_tab['context'])
    assert len(contexts) == 1
    assert contexts[0]["url"] == initial_url


async def test_image(bidi_session, new_tab, url):
    initial_url = url(PNG_BLACK_DOT)
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=initial_url)
    await bidi_session.browsing_context.reload(context=new_tab["context"])

    contexts = await bidi_session.browsing_context.get_tree(
        root=new_tab['context'])
    assert len(contexts) == 1
    assert contexts[0]["url"] == initial_url
