import pytest

from webdriver.bidi.modules.script import ContextTarget, SerializationOptions
from ... import recursive_compare
from .. import REMOTE_VALUES

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("await_promise", [True, False])
@pytest.mark.parametrize("expression, expected", [
    remote_value
    for remote_value in REMOTE_VALUES if remote_value[1]["type"] != "promise"
])
async def test_remote_values(bidi_session, top_context, await_promise,
                             expression, expected):
    function_declaration = f"()=>{expression}"
    if await_promise:
        function_declaration = "async" + function_declaration

    result = await bidi_session.script.call_function(
        function_declaration=function_declaration,
        await_promise=await_promise,
        target=ContextTarget(top_context["context"]),
        serialization_options=SerializationOptions(max_object_depth=1),
    )
    recursive_compare(expected, result)


@pytest.mark.parametrize("await_promise", [True, False])
async def test_remote_value_promise(bidi_session, top_context, await_promise):
    result = await bidi_session.script.call_function(
        function_declaration="()=>Promise.resolve(42)",
        await_promise=await_promise,
        target=ContextTarget(top_context["context"]),
    )

    if await_promise:
        assert result == {"type": "number", "value": 42}
    else:
        assert result == {"type": "promise"}


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
async def test_window_top_level_browsing_context(bidi_session, top_context,
                                                 await_promise):
    function_declaration = f"()=>window"
    if await_promise:
        function_declaration = "async" + function_declaration

    result = await bidi_session.script.call_function(
        function_declaration=function_declaration,
        await_promise=await_promise,
        target=ContextTarget(top_context["context"]),
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    recursive_compare(
        {
            "type": "window",
            "value": {
                "context": top_context["context"]
            }
        }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
async def test_window_iframe_window(bidi_session, top_context,
                                    test_page_same_origin_frame,
                                    await_promise):

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=test_page_same_origin_frame,
        wait="complete",
    )

    all_contexts = await bidi_session.browsing_context.get_tree()
    iframe_context = all_contexts[0]["children"][0]

    function_declaration = f"()=>window"
    if await_promise:
        function_declaration = "async" + function_declaration

    result = await bidi_session.script.call_function(
        function_declaration=function_declaration,
        await_promise=await_promise,
        target=ContextTarget(iframe_context["context"]),
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    recursive_compare(
        {
            "type": "window",
            "value": {
                "context": iframe_context["context"]
            }
        }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
async def test_window_remove_value_iframe_content_window(
        bidi_session, top_context, test_page_same_origin_frame, await_promise):

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=test_page_same_origin_frame,
        wait="complete",
    )

    all_contexts = await bidi_session.browsing_context.get_tree()
    iframe_context = all_contexts[0]["children"][0]

    function_declaration = f"()=>document.querySelector('iframe')?.contentWindow"
    if await_promise:
        function_declaration = "async" + function_declaration

    result = await bidi_session.script.call_function(
        function_declaration=function_declaration,
        await_promise=await_promise,
        target=ContextTarget(top_context["context"]),
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    recursive_compare(
        {
            "type": "window",
            "value": {
                "context": iframe_context["context"]
            }
        }, result)
