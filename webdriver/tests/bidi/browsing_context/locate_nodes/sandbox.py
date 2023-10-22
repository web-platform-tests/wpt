
import pytest

from webdriver.bidi.modules.script import ContextTarget


@pytest.mark.asyncio
async def test_locate_nodes_in_sandbox(bidi_session, inline, top_context):
    url = inline("""<div data-class="one">foobarBARbaz</div><div data-class="two">foobarBARbaz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    result = await bidi_session.browsing_context.locate_nodes(
        context=top_context["context"],
        locator={ "type": "css", "value": "div[data-class='one']" },
        sandbox="sandbox"
    )

    assert result["context"] == top_context["context"]
    assert result["nodes"].length == 1
    node_id = result["nodes"][0]["sharedId"]

    # Check that changes are not present in sandbox
    result_in_sandbox = await bidi_session.script.call_function(
        function_declaration="() => arguments[0]",
        target=ContextTarget(top_context["context"], "sandbox"),
        await_promise=True,
        arguments=[
            {
                "sharedId": node_id
            }
        ]
    )
    assert result_in_sandbox["type"] == "node"
    assert result_in_sandbox["sharedId"] == node_id
