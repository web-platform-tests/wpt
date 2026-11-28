import pytest

from webdriver.bidi.modules.script import (
    ContextTarget,
)

from ... import recursive_compare

pytestmark = pytest.mark.asyncio


async def test_target_context_and_realm(bidi_session, top_context, new_tab):
    result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => { window.foo = 3; }",
        target=ContextTarget(top_context["context"]),
        await_promise=True,
    )
    realm = result["realm"]

    # Make sure that realm argument is ignored and
    # script is executed in the right context.
    result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => window.foo",
        target={"context": new_tab["context"], "realm": realm},
        await_promise=True,
    )

    assert realm != result["realm"]
    recursive_compare(
        {"realm": result["realm"], "result": {"type": "undefined"}}, result
    )


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_target_child_frame_context(
    bidi_session, top_context, inline, iframe, domain
):
    frame = iframe("<div>foo</div>", domain=domain)
    page_url = inline(frame)
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=page_url, wait="complete"
    )
    contexts = await bidi_session.browsing_context.get_tree(
        root=top_context["context"]
    )
    frame_context = contexts[0]["children"][0]["context"]

    await bidi_session.script.call_function(
        function_declaration="() => { window.foo = 3; }",
        target=ContextTarget(frame_context),
        await_promise=False,
    )

    result = await bidi_session.script.evaluate(
        expression="window.foo",
        target=ContextTarget(frame_context),
        await_promise=False,
    )
    assert result == {"type": "number", "value": 3}

    result = await bidi_session.script.evaluate(
        expression="window.foo",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )
    assert result == {"type": "undefined"}
