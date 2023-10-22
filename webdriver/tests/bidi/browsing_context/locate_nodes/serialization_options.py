import pytest

from webdriver.bidi.modules.script import SerializationOptions


@pytest.mark.asyncio
async def test_locate_nodes_serialization_options(bidi_session, top_context, get_test_page):
    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=get_test_page(shadow_root_mode="open"),
        wait="complete",
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "css", "value": "custom-element" },
        serialization_options=SerializationOptions(include_shadow_tree="all", max_dom_depth=1)
    )

    assert result["value"]["shadowRoot"] is not None

    shadow_root = result["value"]["shadowRoot"]
    assert shadow_root["nodeType"] == 11
    assert shadow_root["mode"] == "open"
    assert shadow_root["childNodeCount"] == 1

    shadow_child = shadow_root["children"][0]
    assert shadow_child["nodeType"] == 1
    assert shadow_child["localName"] == "div"
    assert shadow_child["childNodeCount"] == 1
    assert shadow_child["attributes"]["id"] == "in-shadow-dom"
