import pytest

@pytest.mark.parametrize("type,value", [
    ("css", "div"),
    ("xpath", "//div"),
    ("innerText", "foobarBARbaz")
])
@pytest.mark.asyncio
async def test_find_by_locator(bidi_session, inline, top_context, type, value):
    url = inline("""<div data-class="one">foobarBARbaz</div><div data-class="two">foobarBARbaz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": type, "value": value }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 2
    result_nodes = result["nodes"]
    for node_result in result_nodes:
        assert node_result["type"] == "node"
        assert node_result["sharedId"] is not None
        assert node_result["value"] is not None
        assert node_result["value"]["nodeType"] == 1
        assert node_result["value"]["localName"] == "div"


@pytest.mark.parametrize("ignore_case,match_type,max_depth,value,expected", [
    (True, "full", None, "bar", ["strong", "span"]),
    (False, "full", None, "BAR", ["span"]),
    (True, "partial", None, "ba", ["strong", "span"]),
    (False, "partial", None, "ba", ["span"]),
    (True, "full", 0, "foobarbarbaz", ["div"]),
    (False, "full", 0, "foobarBARbaz", ["div"]),
    (True, "partial", 0, "bar", ["div"]),
    (False, "partial", 0, "BAR", ["div"])
])
@pytest.mark.asyncio
async def test_find_by_inner_text(bidi_session, inline, top_context, ignore_case, match_type, max_depth, value, expected):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={
            "type": "innerText",
            "value": value,
            "ignoreCase": ignore_case,
            "matchType": match_type,
            "maxDepth": max_depth
        }
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == expected.length
    for index in range(0, result.length):
        node_result = result["nodes"][index]
        assert node_result["type"] == "node"
        assert node_result["sharedId"] is not None
        assert node_result["value"] is not None
        assert node_result["value"]["nodeType"] == 1
        assert node_result["value"]["localName"] == expected[index]
