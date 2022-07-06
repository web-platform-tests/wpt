import pytest

from webdriver.bidi.modules.script import ContextTarget


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "argument",
    [
        ({"type": "undefined"}),
        ({"type": "null"}),
        ({"type": "string", "value": "foobar"}),
        ({"type": "string", "value": "2"}),
        ({"type": "number", "value": "NaN"}),
        ({"type": "number", "value": "-0"}),
        ({"type": "number", "value": "+Infinity"}),
        ({"type": "number", "value": "-Infinity"}),
        ({"type": "number", "value": 3}),
        ({"type": "number", "value": 1.4}),
        ({"type": "boolean", "value": True}),
        ({"type": "boolean", "value": False}),
        ({"type": "bigint", "value": "42"}),
    ],
)
async def test_primitive_values(bidi_session, top_context, argument):
    result = await bidi_session.script.call_function(
        function_declaration="(argument) => argument",
        arguments=[argument],
        await_promise=False,
        target=ContextTarget(top_context["context"]),
    )

    assert result == argument
