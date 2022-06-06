import pytest

from ... import recursive_compare


@pytest.mark.asyncio
async def test_arrow_function(bidi_session, top_context):
    result = await bidi_session.script.call_function(
        function_declaration="()=>{return 1+2;}",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "type": "number",
        "value": 3}


@pytest.mark.asyncio
async def test_arguments(bidi_session, top_context):
    result = await bidi_session.script.call_function(
        function_declaration="(...args)=>{return Promise.resolve(args);}",
        target=bidi_session.script.ContextTarget(top_context["context"]),
        arguments=[{
            "type": "string",
            "value": "ARGUMENT_STRING_VALUE"
        }, {
            "type": "number",
            "value": 42}])

    recursive_compare({
        "type": "array",
        "value": [{
            "type": 'string',
            "value": 'ARGUMENT_STRING_VALUE'
        }, {
            "type": 'number',
            "value": 42}],
        "handle": "__any_value__"},
        result, ["handle"])


@pytest.mark.asyncio
async def test_this(bidi_session, top_context):
    result = await bidi_session.script.call_function(
        function_declaration="function(){return this}",
        this={
            "type": "string",
            "value": "THIS_STRING_VALUE"
        },
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "type": "string",
        "value": "THIS_STRING_VALUE"}


@pytest.mark.asyncio
async def test_not_await_promise(bidi_session, top_context):
    result = await bidi_session.script.call_function(
        function_declaration="(...args)=>{return Promise.resolve(args);}",
        arguments=[{
            "type": "string",
            "value": "ARGUMENT_STRING_VALUE"
        }, {
            "type": "number",
            "value": 42
        }],
        await_promise=False,
        target=bidi_session.script.ContextTarget(top_context["context"]))

    recursive_compare({
        "type": "promise",
        "handle": "__any_value__"},
        result, ["handle"])


@pytest.mark.asyncio
async def test_remote_value_argument(bidi_session, top_context):
    remote_value_result = await bidi_session.script.evaluate(
        expression="({SOME_PROPERTY:'SOME_VALUE'})",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    remote_value_handle = remote_value_result["handle"]

    result = await bidi_session.script.call_function(
        function_declaration="(obj)=>{return obj.SOME_PROPERTY;}",
        arguments=[{
            "handle": remote_value_handle
        }],
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "type": "string",
        "value": "SOME_VALUE"}


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
async def test_arrow_await_promise(bidi_session, top_context, await_promise):
    result = await bidi_session.script.call_function(
        function_declaration="async ()=>{return 'SOME_VALUE'}",
        await_promise=await_promise,
        target=bidi_session.script.ContextTarget(top_context["context"]))

    if await_promise:
        assert result == {
            "type": "string",
            "value": "SOME_VALUE"}
    else:
        recursive_compare({
            "type": "promise",
            "handle": "__any_value__"},
            result, ["handle"])


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
async def test_classic_await_promise(bidi_session, top_context, await_promise):
    result = await bidi_session.script.call_function(
        function_declaration="async function(){return 'SOME_VALUE'}",
        await_promise=await_promise,
        target=bidi_session.script.ContextTarget(top_context["context"]))

    if await_promise:
        assert result == {
            "type": "string",
            "value": "SOME_VALUE"}
    else:
        recursive_compare({
            "type": "promise",
            "handle": "__any_value__"},
            result, ["handle"])
