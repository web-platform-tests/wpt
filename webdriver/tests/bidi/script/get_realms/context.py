import pytest

from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio


async def create_context_with_frame(bidi_session, url):
    new_context = await bidi_session.browsing_context.create(type_hint="tab")
    await bidi_session.browsing_context.navigate(
        context=new_context["context"],
        url=url,
        wait="complete",
    )

    contexts = await bidi_session.browsing_context.get_tree(
        root=new_context["context"]
    )
    assert len(contexts) == 1
    frames = contexts[0]["children"]
    assert len(frames) == 1

    return new_context["context"], frames[0]["context"]


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_top_level_context(
    bidi_session,
    domain,
    iframe,
    inline,
    test_origin,
):
    page_with_frame = inline(iframe("<div>foo</div>", domain=domain))
    top_context, frame_context = await create_context_with_frame(
        bidi_session, page_with_frame
    )

    top_context_result = await bidi_session.script.evaluate(
        raw_result=True,
        expression="1 + 2",
        target=ContextTarget(top_context),
        await_promise=False,
    )
    frame_context_result = await bidi_session.script.evaluate(
        raw_result=True,
        expression="1 + 2",
        target=ContextTarget(frame_context),
        await_promise=False,
    )
    assert top_context_result["realm"] != frame_context_result["realm"]

    result = await bidi_session.script.get_realms(context=top_context)

    assert len(result) == 1
    assert result[0]["context"] == top_context
    assert result[0]["origin"] == test_origin
    assert result[0]["realm"] == top_context_result["realm"]
    assert result[0]["type"] == "window"


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_iframe_context(
    bidi_session,
    domain,
    iframe,
    inline,
    test_alt_origin,
    test_origin,
):
    page_with_frame = inline(iframe("<div>foo</div>", domain=domain))
    top_context, frame_context = await create_context_with_frame(
        bidi_session, page_with_frame
    )

    top_context_result = await bidi_session.script.evaluate(
        raw_result=True,
        expression="1 + 2",
        target=ContextTarget(top_context),
        await_promise=False,
    )
    frame_context_result = await bidi_session.script.evaluate(
        raw_result=True,
        expression="1 + 2",
        target=ContextTarget(frame_context),
        await_promise=False,
    )
    assert top_context_result["realm"] != frame_context_result["realm"]

    result = await bidi_session.script.get_realms(context=frame_context)

    assert len(result) == 1
    assert result[0]["context"] == frame_context
    assert result[0]["origin"] == (
        test_origin if domain == "" else test_alt_origin
    )
    assert result[0]["realm"] == frame_context_result["realm"]
    assert result[0]["type"] == "window"


async def test_iframe_context_realm_from_call_function(
    bidi_session,
    test_page_same_origin_frame,
):
    top_context, frame_context = await create_context_with_frame(
        bidi_session, test_page_same_origin_frame
    )

    top_context_result = await bidi_session.script.evaluate(
        raw_result=True,
        expression="1 + 2",
        target=ContextTarget(top_context),
        await_promise=False,
    )
    call_function_result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => window.top !== window",
        target=ContextTarget(frame_context),
        await_promise=False,
    )
    assert call_function_result["result"]["value"] is True
    assert call_function_result["realm"] != top_context_result["realm"]

    result = await bidi_session.script.get_realms(context=frame_context)

    assert len(result) == 1
    assert result[0]["context"] == frame_context
    assert result[0]["realm"] == call_function_result["realm"]
    assert result[0]["type"] == "window"
