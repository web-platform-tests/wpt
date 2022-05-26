import pytest

from ... import recursive_compare


@pytest.mark.asyncio
async def test_arrow_function(bidi_session, top_context):
    result = await bidi_session.script.call_function(
        function_declaration="()=>{return 1+2;}",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "result": {
            "type": "number",
            "value": 3}}


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
            "value": 42
        }])

    recursive_compare({
        "result": {
            "type": "array",
            "value": [{
                "type": 'string',
                "value": 'ARGUMENT_STRING_VALUE'
            }, {
                "type": 'number',
                "value": 42}],
            "objectId": "__any_value__"
        }}, result, ["objectId"])


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
        "result": {
            "type": "string",
            "value": "THIS_STRING_VALUE"}}


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
        "result": {
            "type": "promise",
            "objectId": "__any_value__"
        }}, result, ["objectId"])


@pytest.mark.asyncio
async def test_remote_value_argument(bidi_session, top_context):
    remote_value_result = await bidi_session.script.evaluate(
        expression="({SOME_PROPERTY:'SOME_VALUE'})",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    remote_value_object_id = remote_value_result["result"]["objectId"]

    result = await bidi_session.script.call_function(
        function_declaration="(obj)=>{return obj.SOME_PROPERTY;}",
        arguments=[{
            "objectId": remote_value_object_id
        }],
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "result": {
            "type": "string",
            "value": "SOME_VALUE"}}


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
async def test_arrow_await_promise(bidi_session, top_context, await_promise):
    result = await bidi_session.script.call_function(
        function_declaration="async ()=>{return 'SOME_VALUE'}",
        await_promise=await_promise,
        target=bidi_session.script.ContextTarget(top_context["context"]))

    if await_promise:
        assert result == {
            "result": {
                "type": "string",
                "value": "SOME_VALUE"}}
    else:
        recursive_compare({
            "result": {
                "type": "promise",
                "objectId": "__any_value__"
            }}, result, ["objectId"])


@pytest.mark.asyncio
@pytest.mark.parametrize("await_promise", [True, False])
async def test_classic_await_promise(bidi_session, top_context, await_promise):
    result = await bidi_session.script.call_function(
        function_declaration="async function(){return 'SOME_VALUE'}",
        await_promise=await_promise,
        target=bidi_session.script.ContextTarget(top_context["context"]))

    if await_promise:
        assert result == {
            "result": {
                "type": "string",
                "value": "SOME_VALUE"}}
    else:
        recursive_compare({
            "result": {
                "type": "promise",
                "objectId": "__any_value__"
            }}, result, ["objectId"])
