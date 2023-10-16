import pytest

from webdriver.bidi.modules.script import ContextTarget

@pytest.mark.asyncio
async def test_find_by_xpath(bidi_session, inline, top_context):
    url = inline("""<div data-class="one">One</div><div data-class="two">Two</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "xpath", "value": "//div" }
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

@pytest.mark.asyncio
async def test_find_by_xpath_limit_return_count(bidi_session, inline, top_context):
    url = inline("""<div data-class="one">One</div><div data-class="two">Two</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "xpath", "value": "//div" },
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


@pytest.mark.asyncio
async def test_find_by_xpath_with_context_nodes(bidi_session, inline, top_context):
    url = inline("""<p id="parent"><div data-class="one">One</div><div data-class="two">Two</div></p>""")
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
        locator={ "type": "xpath", "value": ".//div" },
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

