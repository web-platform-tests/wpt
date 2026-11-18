import pytest
from webdriver.bidi.modules.script import ContextTarget, ScriptEvaluateResultException

from ... import any_dict, any_int, any_string, recursive_compare
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


@pytest.mark.parametrize("property_name", ["name", "message", "stack"])
@pytest.mark.parametrize("await_promise", [False, True])
async def test_exception_property_getter_throws(
    bidi_session, top_context, property_name, await_promise
):
    completion = "return Promise.reject(error);" if await_promise else "throw error;"
    function_declaration = f"""() => {{
        const error = {{}};
        Object.defineProperty(error, "{property_name}", {{
            get() {{ throw new Error("getter failed"); }}
        }});
        {completion}
    }}"""

    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration=function_declaration,
            await_promise=await_promise,
            target=ContextTarget(top_context["context"]),
        )

    recursive_compare(
        {
            "realm": any_string,
            "exceptionDetails": {
                "columnNumber": any_int,
                "exception": any_dict,
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
