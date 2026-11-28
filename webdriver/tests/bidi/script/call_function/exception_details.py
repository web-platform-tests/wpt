import pytest
from webdriver.bidi.modules.script import ContextTarget, ScriptEvaluateResultException

from ... import any_int, any_string, recursive_compare
from .. import any_stack_trace, PRIMITIVE_VALUES, REMOTE_VALUES

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("expression, expected", PRIMITIVE_VALUES + REMOTE_VALUES)
async def test_exception_details(bidi_session, top_context, expression, expected):
    function_declaration = f"()=>{{ throw {expression} }}"

    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration=function_declaration,
            await_promise=False,
            target=ContextTarget(top_context["context"]),
        )

    recursive_compare(
        {
            "realm": any_string,
            "exceptionDetails": {
                "columnNumber": any_int,
                "exception": expected,
                "lineNumber": any_int,
                "stackTrace": any_stack_trace,
                "text": any_string,
            },
        },
        exception.value.result,
    )


async def test_invalid_function(bidi_session, top_context):
    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration="))) !!@@## some invalid JS script (((",
            await_promise=False,
            target=ContextTarget(top_context["context"]),
        )
    recursive_compare(
        {
            "realm": any_string,
            "exceptionDetails": {
                "columnNumber": any_int,
                "exception": {"type": "error"},
                "lineNumber": any_int,
                "stackTrace": any_stack_trace,
                "text": any_string,
            },
        },
        exception.value.result,
    )


@pytest.mark.parametrize("chained", [True, False])
async def test_rejected_promise(bidi_session, top_context, chained):
    if chained:
        function_declaration = "() => Promise.reject('error').then(() => { })"
    else:
        function_declaration = "() => Promise.reject('error')"

    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration=function_declaration,
            await_promise=True,
            target=ContextTarget(top_context["context"]),
        )

    recursive_compare(
        {
            "realm": any_string,
            "exceptionDetails": {
                "columnNumber": any_int,
                "exception": {"type": "string", "value": "error"},
                "lineNumber": any_int,
                "stackTrace": any_stack_trace,
                "text": any_string,
            },
        },
        exception.value.result,
    )


async def test_stack_coordinates(bidi_session, top_context, inline):
    page_url = inline(
        "<script>\n"
        "function foo() { missingIdentifier; }\n"
        "function bar() { foo(); }\n"
        "</script>",
        doctype="html_quirks",
    )
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=page_url, wait="complete"
    )

    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration="() => bar()",
            target=ContextTarget(top_context["context"]),
            await_promise=False,
        )

    exception_details = exception.value.result["exceptionDetails"]
    call_frames = exception_details["stackTrace"]["callFrames"]

    assert len(call_frames) >= 2
    assert call_frames[0]["functionName"] == "foo"
    assert call_frames[0]["url"] == page_url
    assert call_frames[0]["lineNumber"] == 1
    assert call_frames[0]["columnNumber"] == 17
    assert call_frames[1]["functionName"] == "bar"
    assert call_frames[1]["url"] == page_url
    assert call_frames[1]["lineNumber"] == 2
    assert call_frames[1]["columnNumber"] == 17
    assert exception_details["lineNumber"] == call_frames[0]["lineNumber"]
    assert exception_details["columnNumber"] == call_frames[0]["columnNumber"]
