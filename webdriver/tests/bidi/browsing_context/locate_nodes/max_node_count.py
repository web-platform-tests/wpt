
import pytest


@pytest.mark.parametrize("type,value", [
    ("css", "div"),
    ("xpath", "//div"),
    ("innerText", "foo")
])
@pytest.mark.asyncio
async def test_find_by_css_limit_return_count(bidi_session, inline, top_context, type, value):
    url = inline("""<div data-class="one">foo</div><div data-class="two">foo</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": type, "value": value },
        max_node_count = 1
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 1
    node_result = result["nodes"][0]
    assert node_result["type"] == "node"
    assert node_result["sharedId"] is not None
    assert node_result["value"] is not None
    assert node_result["value"]["nodeType"] == 1
    assert node_result["value"]["localName"] == "div"
    assert "data-class" in node_result["value"]["attributes"]
    assert node_result["value"]["attributes"]["data-class"] == "one"
