import pytest
import webdriver.bidi.error as error

from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio


async def test_arrow_function(bidi_session, top_context):
    result = await bidi_session.script.call_function(
        function_declaration="()=>{return 1+2;}",
        await_promise=False,
        target=ContextTarget(top_context["context"]),
    )

    assert result == {"type": "number", "value": 3}


async def test_trailing_line_comment(bidi_session, top_context):
    result = await bidi_session.script.call_function(
        function_declaration="() => 42 // trailing comment",
        await_promise=False,
        target=ContextTarget(top_context["context"]),
    )

    assert result == {"type": "number", "value": 42}


async def test_not_callable(bidi_session, top_context):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.script.call_function(
            function_declaration="42",
            await_promise=False,
            target=ContextTarget(top_context["context"]),
        )
