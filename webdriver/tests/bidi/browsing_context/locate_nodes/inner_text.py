import pytest

from webdriver.bidi.modules.script import ContextTarget

@pytest.mark.asyncio
async def test_find_by_inner_text(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "innerText", "value": "foobarBARbaz" }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 1
    node_result = result["nodes"][0]
    assert node_result["type"] == "node"
    assert node_result["sharedId"] is not None
    assert node_result["value"] is not None
    assert node_result["value"]["nodeType"] == 1
    assert node_result["value"]["localName"] == "div"

@pytest.mark.asyncio
async def test_find_by_inner_text_case_insensitive(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "innerText", "value": "bar", "ignoreCase": True }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 2
    first_node_result = result["nodes"][0]
    assert first_node_result["type"] == "node"
    assert first_node_result["sharedId"] is not None
    assert first_node_result["value"] is not None
    assert first_node_result["value"]["nodeType"] == 1
    assert first_node_result["value"]["localName"] == "strong"
    second_node_result = result["nodes"][1]
    assert second_node_result["type"] == "node"
    assert second_node_result["sharedId"] is not None
    assert second_node_result["value"] is not None
    assert second_node_result["value"]["nodeType"] == 1
    assert second_node_result["value"]["localName"] == "span"

@pytest.mark.asyncio
async def test_find_by_inner_text_case_sensitive(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "innerText", "value": "BAR", "ignoreCase": False }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 1
    first_node_result = result["nodes"][0]
    assert first_node_result["type"] == "node"
    assert first_node_result["sharedId"] is not None
    assert first_node_result["value"] is not None
    assert first_node_result["value"]["nodeType"] == 1
    assert first_node_result["value"]["localName"] == "span"

@pytest.mark.asyncio
async def test_find_by_inner_text_partial_match_case_insensitive(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "innerText", "value": "ar", "ignoreCase": True, "matchType": "partial" }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 2
    first_node_result = result["nodes"][0]
    assert first_node_result["type"] == "node"
    assert first_node_result["sharedId"] is not None
    assert first_node_result["value"] is not None
    assert first_node_result["value"]["nodeType"] == 1
    assert first_node_result["value"]["localName"] == "strong"
    second_node_result = result["nodes"][1]
    assert second_node_result["type"] == "node"
    assert second_node_result["sharedId"] is not None
    assert second_node_result["value"] is not None
    assert second_node_result["value"]["nodeType"] == 1
    assert second_node_result["value"]["localName"] == "span"

@pytest.mark.asyncio
async def test_find_by_inner_text_partial_match_case_sensitive(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "innerText", "value": "AR", "ignoreCase": False, "matchType": "partial" }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 1
    first_node_result = result["nodes"][0]
    assert first_node_result["type"] == "node"
    assert first_node_result["sharedId"] is not None
    assert first_node_result["value"] is not None
    assert first_node_result["value"]["nodeType"] == 1
    assert first_node_result["value"]["localName"] == "span"

@pytest.mark.asyncio
async def test_find_by_inner_text_max_depth(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "innerText", "value": "bar", "matchType": "partial", "maxDepth": 0 }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 1
    node_result = result["nodes"][0]
    assert node_result["type"] == "node"
    assert node_result["sharedId"] is not None
    assert node_result["value"] is not None
    assert node_result["value"]["nodeType"] == 1
    assert node_result["value"]["localName"] == "div"

@pytest.mark.asyncio
async def test_find_by_inner_text_limit_return_count(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "css", "value": "bar", "ignoreCase": True },
        max_node_count = 1
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 1
    node_result = result["nodes"][0]
    assert node_result["type"] == "node"
    assert node_result["sharedId"] is not None
    assert node_result["value"] is not None
    assert node_result["value"]["nodeType"] == 1
    assert node_result["value"]["localName"] == "strong"


@pytest.mark.asyncio
async def test_find_by_inner_text_with_context_nodes(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    script_result = await bidi_session.script.evaluate(
        expression="""document.querySelectorAll("span")""",
        target=ContextTarget(top_context["context"]),
        await_promise=True,
    )

    parent_nodes = [
        { "sharedId": script_result["result"][0]["sharedId"] },
        { "sharedId": script_result["result"][1]["sharedId"] },
    ]

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "innerText", "value": "bar", "ignoreCase": True },
        start_nodes=[parent_nodes]
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 2
    first_node_result = result["nodes"][0]
    assert first_node_result["type"] == "node"
    assert first_node_result["sharedId"] is not None
    assert first_node_result["value"] is not None
    assert first_node_result["value"]["nodeType"] == 1
    assert first_node_result["value"]["localName"] == "strong"
    second_node_result = result["nodes"][1]
    assert second_node_result["type"] == "node"
    assert second_node_result["sharedId"] is not None
    assert second_node_result["value"] is not None
    assert second_node_result["value"]["nodeType"] == 1
    assert second_node_result["value"]["localName"] == "span"
