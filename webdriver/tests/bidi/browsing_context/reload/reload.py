import pytest

pytestmark = pytest.mark.asyncio


async def test_payload(bidi_session, inline, new_tab):
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url)

    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"])
    assert result == {}


async def test_hash_is_preserved(bidi_session, new_tab):
    initial_url = "https://example.com/#foo"
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=initial_url)
    await bidi_session.browsing_context.reload(context=new_tab["context"])

    contexts = await bidi_session.browsing_context.get_tree(
        root=new_tab['context'])
    assert len(contexts) == 1
    assert contexts[0]["url"] == initial_url
