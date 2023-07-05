import pytest
from webdriver.bidi.modules.script import ContextTarget, SerializationOptions
from . import REMOTE_VALUES


@pytest.mark.asyncio
@REMOTE_VALUES
async def test_remote_values(bidi_session, top_context, expression, expected):
    result = await bidi_session.script.evaluate(
        expression=expression,
        target=ContextTarget(top_context["context"]),
        await_promise=False,
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    assert result == expected
