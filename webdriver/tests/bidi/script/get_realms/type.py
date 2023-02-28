import pytest

from anys import AnyLE
from webdriver.bidi.modules.script import ContextTarget

PAGE_ABOUT_BLANK = "about:blank"


@pytest.mark.asyncio
# Should be extended when more types are supported
@pytest.mark.parametrize("type", ["window"])
async def test_type(bidi_session, top_context, type):
    result = await bidi_session.script.get_realms(type=type)

    # Evaluate to get realm id
    top_context_result = await bidi_session.script.evaluate(
        raw_result=True,
        expression="1 + 2",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )

    assert [AnyLE({
        "context": top_context["context"],
        "origin": "null",
        "realm": top_context_result["realm"],
        "type": type,
    })] == result
