import pytest

from webdriver.bidi.modules.script import ContextTarget, ScriptEvaluateResultException
from ... import any_int, any_string, recursive_compare
from .. import any_stack_trace, specific_error_response


@pytest.mark.asyncio
async def test_strict_mode(bidi_session, top_context):
    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.evaluate(
            expression="'use strict';NOT_EXISTED_VARIABLE=1",
            target=ContextTarget(top_context["context"]),
            await_promise=True)

    recursive_compare(specific_error_response({"type": "error"}), exception.value.result)

    result = await bidi_session.script.evaluate(
        expression="ANOTHER_NOT_EXISTED_VARIABLE=1",
        target=ContextTarget(top_context["context"]),
        await_promise=True)

    assert result == {
        "type": "number",
        "value": 1}

    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.evaluate(
            expression="'use strict';YET_ANOTHER_NOT_EXISTED_VARIABLE=1",
            target=ContextTarget(top_context["context"]),
            await_promise=True)

    recursive_compare(specific_error_response({"type": "error"}), exception.value.result)
