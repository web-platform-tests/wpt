import pytest

from ... import recursive_compare


@pytest.mark.asyncio
async def test_eval(bidi_session, top_context):
    result = await bidi_session.script.evaluate(
        expression="1 + 2",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "result": {
            "type": "number",
            "value": 3}}


@pytest.mark.asyncio
async def test_exception(bidi_session, top_context):
    result = await bidi_session.script.evaluate(
        expression="throw Error('SOME_ERROR_MESSAGE')",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    recursive_compare({
        "exceptionDetails": {
            'columnNumber': 0,
            'exception': {
                'handle': '__any_value__',
                'type': 'error'},
            'lineNumber': 0,
            'stackTrace': {
                'callFrames': [{
                    'columnNumber': 6,
                    'functionName': '',
                    'lineNumber': 0,
                    'url': ''}]},
            'text': '__any_value__'}},
        result, ["handle", "text"])


@pytest.mark.asyncio
async def test_interact_with_dom(bidi_session, top_context):
    result = await bidi_session.script.evaluate(
        expression="'window.location.href: ' + window.location.href",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "result": {
            "type": "string",
            "value": "window.location.href: about:blank"}}


@pytest.mark.asyncio
async def test_resolved_promise_with_wait_promise_false(bidi_session,
                                                        top_context):
    result = await bidi_session.script.evaluate(
        expression="Promise.resolve('SOME_RESOLVED_RESULT')",
        target=bidi_session.script.ContextTarget(top_context["context"]),
        await_promise=False)

    recursive_compare({
        "result": {
            "type": "promise",
            "handle": "__any_value__"
        }}, result, ["handle"])


@pytest.mark.asyncio
async def test_resolved_promise_with_wait_promise_true(bidi_session,
                                                       top_context):
    result = await bidi_session.script.evaluate(
        expression="Promise.resolve('SOME_RESOLVED_RESULT')",
        target=bidi_session.script.ContextTarget(top_context["context"]),
        await_promise=True)

    assert result == {
        "result": {
            "type": "string",
            "value": "SOME_RESOLVED_RESULT"
        }}


@pytest.mark.asyncio
async def test_resolved_promise_with_wait_promise_omitted(bidi_session,
                                                          top_context):
    result = await bidi_session.script.evaluate(
        expression="Promise.resolve('SOME_RESOLVED_RESULT')",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    assert result == {
        "result": {
            "type": "string",
            "value": "SOME_RESOLVED_RESULT"
        }}


@pytest.mark.asyncio
async def test_rejected_promise_with_wait_promise_false(bidi_session,
                                                        top_context):
    result = await bidi_session.script.evaluate(
        expression="Promise.reject('SOME_REJECTED_RESULT')",
        target=bidi_session.script.ContextTarget(top_context["context"]),
        await_promise=False)

    recursive_compare({
        "result": {
            "type": "promise",
            "handle": "__any_value__"
        }}, result, ["handle"])


@pytest.mark.asyncio
async def test_rejected_promise_with_wait_promise_true(bidi_session,
                                                       top_context):
    result = await bidi_session.script.evaluate(
        expression="Promise.reject('SOME_REJECTED_RESULT')",
        target=bidi_session.script.ContextTarget(top_context["context"]),
        await_promise=True)

    recursive_compare({
        'exceptionDetails': {
            'columnNumber': 0,
            'exception': {'type': 'string',
                          'value': 'SOME_REJECTED_RESULT'},
            'lineNumber': 0,
            'stackTrace': {'callFrames': []},
            'text': '__any_value__'}},
        result, ["handle", "text"])


@pytest.mark.asyncio
async def test_rejected_promise_with_wait_promise_omitted(bidi_session,
                                                          top_context):
    result = await bidi_session.script.evaluate(
        expression="Promise.reject('SOME_REJECTED_RESULT')",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    recursive_compare({
        'exceptionDetails': {
            'columnNumber': 0,
            'exception': {'type': 'string',
                          'value': 'SOME_REJECTED_RESULT'},
            'lineNumber': 0,
            'stackTrace': {'callFrames': []},
            'text': '__any_value__'}},
        result, ["handle", "text"])
