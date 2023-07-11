import pytest
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_context_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.activate(
            context=value
        )


@pytest.mark.parametrize("value", ["", "somestring"])
async def test_params_context_invalid_value(bidi_session, value):
    with pytest.raises(error.NoSuchFrameException):
        await bidi_session.browsing_context.activate(
            context=value
        )
