import pytest

from webdriver.bidi.modules.script import ContextTarget, ScriptEvaluateResultException
from ... import any_int, any_string, recursive_compare
from .. import any_stack_trace, any_error_response


@pytest.mark.asyncio
async def test_strict_mode(bidi_session, top_context):
    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration="()=>{'use strict';return x=1}",
            await_promise=False,
            target=ContextTarget(top_context["context"]),
        )

    recursive_compare(any_error_response({"type": "error"}), exception.value.result)

    result = await bidi_session.script.call_function(
        function_declaration="()=>{return y=1}",
        await_promise=False,
        target=ContextTarget(top_context["context"]),
    )

    assert result == {
        "type": "number",
        "value": 1}

    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.call_function(
            function_declaration="()=>{'use strict';return z=1}",
            await_promise=False,
            target=ContextTarget(top_context["context"]),
        )

    recursive_compare(any_error_response({"type": "error"}), exception.value.result)
