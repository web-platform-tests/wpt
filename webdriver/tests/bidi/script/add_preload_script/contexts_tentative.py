import pytest

from webdriver.bidi.modules.script import ContextTarget


@pytest.mark.asyncio
async def test_add_preload_script_specify_context_multiple_times(
        bidi_session, add_preload_script, new_tab,
        test_page_same_origin_frame):

    await add_preload_script(
        function_declaration=
        "() => { window.foo = window.foo ? window.foo + 1 : 1; }",
        contexts=[new_tab["context"], new_tab["context"]])

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_page_same_origin_frame,
        wait="complete",
    )

    # Check that preload script applied the changes to the window
    result = await bidi_session.script.evaluate(
        expression="window.foo",
        target=ContextTarget(new_tab["context"]),
        await_promise=True,
    )
    assert result == {"type": "number", "value": "1"}
