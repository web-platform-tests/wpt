import pytest
import webdriver.bidi.error as error

from webdriver.bidi.modules.script import ScriptResultException
from ... import recursive_compare

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("target", [None, False, 42, {}, []])
async def test_params_target_invalid_type(bidi_session, target):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            target=target)


@pytest.mark.parametrize("context", [None, False, 42, {}, []])
async def test_params_context_invalid_type(bidi_session, context):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            target=bidi_session.script.ContextTarget(context))


@pytest.mark.parametrize("sandbox", [False, 42, {}, []])
async def test_params_sandbox_invalid_type(bidi_session, top_context, sandbox):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            target=bidi_session.script.ContextTarget(top_context["context"],
                                                     sandbox))


async def test_params_context_unknown(bidi_session):
    with pytest.raises(error.NoSuchFrameException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            target=bidi_session.script.ContextTarget("_UNKNOWN_"))


@pytest.mark.parametrize("realm", [None, False, 42, {}, []])
async def test_params_realm_invalid_type(bidi_session, realm):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            target=bidi_session.script.RealmTarget(realm))


async def test_params_realm_unknown(bidi_session):
    with pytest.raises(error.NoSuchFrameException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            target=bidi_session.script.RealmTarget("_UNKNOWN_"))


@pytest.mark.parametrize("function_declaration", [None, False, 42, {}, []])
async def test_params_function_declaration_invalid_type(bidi_session, top_context,
                                                        function_declaration):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration=function_declaration,
            target=bidi_session.script.ContextTarget(top_context["context"]))


async def test_params_function_declaration_invalid_script(bidi_session, top_context):
    with pytest.raises(ScriptResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration='))) !!@@## some invalid JS script (((',
            target=bidi_session.script.ContextTarget(top_context["context"]))
    recursive_compare({
        'realm': '__any_value__',
        'exceptionDetails': {
            'columnNumber': 0,
            'exception': {
                'handle': '__any_value__',
                'type': 'error'},
            'lineNumber': 0,
            'stackTrace': {
                'callFrames': []},
            'text': "__any_value__"}},
        exception.value.result, ["handle", "text", "realm"])


@pytest.mark.parametrize("this", [False, "SOME_STRING", 42, {}, []])
async def test_params_this_invalid_type(bidi_session, top_context,
                                        this):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            this=this,
            target=bidi_session.script.ContextTarget(top_context["context"]))


@pytest.mark.parametrize("arguments", [False, "SOME_STRING", 42, {}])
async def test_params_arguments_invalid_type(bidi_session, top_context,
                                             arguments):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            arguments=arguments,
            target=bidi_session.script.ContextTarget(top_context["context"]))


@pytest.mark.parametrize("argument", [False, "SOME_STRING", 42, {}, []])
async def test_params_single_argument_invalid_type(bidi_session, top_context,
                                                   argument):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            arguments=[argument],
            target=bidi_session.script.ContextTarget(top_context["context"]))


@pytest.mark.parametrize("await_promise", ["False", 0, 42, {}, []])
async def test_params_await_promise_invalid_type(bidi_session, top_context,
                                                 await_promise):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            await_promise=await_promise,
            target=bidi_session.script.ContextTarget(top_context["context"]))


@pytest.mark.parametrize("result_ownership", [False, "_UNKNOWN_", 42, {}, []])
async def test_params_result_ownership_invalid_value(bidi_session, top_context,
                                                     result_ownership):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="1 + 2",
            result_ownership=result_ownership,
            target=bidi_session.script.ContextTarget(top_context["context"]))
