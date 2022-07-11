import pytest

from webdriver.bidi.modules.script import ContextTarget, ScriptEvaluateResultException
from ... import recursive_compare, any_string, any_int, missing
from .. import any_stack_trace


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_exception(bidi_session, top_context, result_ownership, expected_handle):
    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration='()=>{throw {a:1}}',
            await_promise=False,
            result_ownership=result_ownership,
            target=ContextTarget(top_context["context"]))

    recursive_compare({
        "realm": any_string,
        "exceptionDetails": {
            "columnNumber": any_int,
            "exception": {
                "type": "object",
                "handle": expected_handle,
                "value": [[
                    "a", {
                        "type": "number",
                        "value": 1}]]},
            "lineNumber": any_int,
            "stackTrace": any_stack_trace,
            "text": any_string}
    }, exception.value.result)


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_invalid_function(bidi_session, top_context, result_ownership, expected_handle):
    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration="))) !!@@## some invalid JS script (((",
            await_promise=False,
            result_ownership=result_ownership,
            target=ContextTarget(top_context["context"]))
    recursive_compare({
        "realm": any_string,
        "exceptionDetails": {
            "columnNumber": any_int,
            "exception": {
                "handle": expected_handle,
                "type": "error"},
            "lineNumber": any_int,
            "stackTrace": any_stack_trace,
            "text": any_string}
    }, exception.value.result)


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_arrow_function(bidi_session, top_context, result_ownership, expected_handle):
    result = await bidi_session.script.call_function(
        function_declaration="()=>{return {a:1};}",
        await_promise=False,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    recursive_compare({
        "type": "object",
        "handle": expected_handle,
        "value": [[
            "a", {
                "type": "number",
                "value": 1}]]
    }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_arguments(bidi_session, top_context, result_ownership, expected_handle):
    result = await bidi_session.script.call_function(
        function_declaration="(...args)=>{return args}",
        arguments=[{
            "type": "string",
            "value": "ARGUMENT_STRING_VALUE"
        }, {
            "type": "number",
            "value": 42}],
        await_promise=False,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    recursive_compare({
        "type": "array",
        "handle": expected_handle,
        "value": [{
            "type": "string",
            "value": "ARGUMENT_STRING_VALUE"
        }, {
            "type": "number",
            "value": 42}]
    }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_default_arguments(bidi_session, top_context, result_ownership, expected_handle):
    result = await bidi_session.script.call_function(
        function_declaration="(...args)=>{return args}",
        await_promise=False,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    recursive_compare({
        "type": "array",
        "handle": expected_handle,
        "value": []
    }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_this(bidi_session, top_context, result_ownership, expected_handle):
    result = await bidi_session.script.call_function(
        function_declaration="function(){return this}",
        this={
            "type": "object",
            "value": [[
                "some_property",
                {
                    "type": "number",
                    "value": 42
                }]]},
        await_promise=False,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    recursive_compare({
        "type": "object",
        "handle": expected_handle,
        "value": [[
            "some_property",
            {
                "type": "number",
                "value": 42}]]
    }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_default_this(bidi_session, top_context, result_ownership, expected_handle):
    result = await bidi_session.script.call_function(
        function_declaration="function(){return this}",
        await_promise=False,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    # Note: https://github.com/w3c/webdriver-bidi/issues/251
    recursive_compare({
        "type": "window",
        "handle": expected_handle,
    }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_remote_value_argument(bidi_session, top_context, result_ownership, expected_handle):
    remote_value_result = await bidi_session.script.evaluate(
        expression="({SOME_PROPERTY:'SOME_VALUE'})",
        await_promise=False,
        result_ownership="root",
        target=ContextTarget(top_context["context"]))

    remote_value_handle = remote_value_result["handle"]

    result = await bidi_session.script.call_function(
        function_declaration="(obj)=>{return obj;}",
        arguments=[{"handle": remote_value_handle}],
        await_promise=False,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    recursive_compare({
        "type": "object",
        "handle": expected_handle,
        "value": [[
            "SOME_PROPERTY",
            {
                "type": "string",
                "value": "SOME_VALUE"}]]
    }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_async_arrow_await_promise(bidi_session, top_context, await_promise, result_ownership, expected_handle):
    result = await bidi_session.script.call_function(
        function_declaration="async ()=>{return {}}",
        await_promise=await_promise,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    if await_promise:
        recursive_compare({
            "type": "object",
            "value": [],
            "handle": expected_handle
        }, result)
    else:
        recursive_compare({
            "type": "promise",
            "handle": expected_handle
        }, result)


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
@pytest.mark.parametrize("result_ownership, expected_handle", [("root", any_string), ("none", missing)])
async def test_async_classic_await_promise(bidi_session, top_context, await_promise, result_ownership, expected_handle):
    result = await bidi_session.script.call_function(
        function_declaration="async function(){return {}}",
        await_promise=await_promise,
        result_ownership=result_ownership,
        target=ContextTarget(top_context["context"]))

    if await_promise:
        recursive_compare({
            "type": "object",
            "value": [],
            "handle": expected_handle
        }, result)
    else:
        recursive_compare({
            "type": "promise",
            "handle": expected_handle,
        }, result)
