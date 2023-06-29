import pytest

pytestmark = pytest.mark.asyncio

PAGE_CONTENT = "<div>foo</div>"


async def navigate_and_assert(bidi_session, context, url):
    result = await bidi_session.browsing_context.navigate(
        context=context['context'], url=url, wait="complete")
    assert result["url"] == url

    contexts = await bidi_session.browsing_context.get_tree(
        root=context['context'])
    assert len(contexts) == 1
    assert contexts[0]["url"] == url

    return contexts


async def reload_and_assert(bidi_session, context):
    result = await bidi_session.browsing_context.reload(
        context=context['context'])
    assert result == {}

    contexts = await bidi_session.browsing_context.get_tree(
        root=context['context'])
    assert len(contexts) == 1

    return contexts


@pytest.mark.parametrize("domain", ["", "alt"],
                         ids=["same_origin", "cross_origin"])
async def test_origin(bidi_session, new_tab, inline, domain):
    frame_start_url = inline("frame")
    url_before = inline(f"<iframe src='{frame_start_url}'></iframe>",
                        domain=domain)
    contexts = await navigate_and_assert(bidi_session, new_tab, url_before)

    assert len(contexts[0]["children"]) == 1
    frame = contexts[0]["children"][0]
    assert frame["url"] == frame_start_url

    await reload_and_assert(bidi_session, frame)
