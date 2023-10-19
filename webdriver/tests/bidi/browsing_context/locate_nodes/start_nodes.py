import pytest

from webdriver.bidi.modules.script import ContextTarget


@pytest.mark.parametrize("type,value", [
    ("css", "div"),
    ("xpath", "//div"),
    ("innerText", "foo")
])
@pytest.mark.asyncio
async def test_locate_with_context_nodes(bidi_session, inline, top_context, type, value):
    url = inline("""<p id="parent"><div data-class="one">foo</div><div data-class="two">foo</div></p>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    script_result = await bidi_session.script.evaluate(
        expression="""document.querySelector("p")""",
        target=ContextTarget(top_context["context"]),
        await_promise=True,
    )

    parent_node_reference = { "sharedId": script_result["result"]["sharedId"] }

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": type, "value": value },
        start_nodes=[parent_node_reference]
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

