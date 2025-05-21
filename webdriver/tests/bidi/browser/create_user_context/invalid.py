import pytest
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", ["foo", 42, {}, []])
async def test_params_accept_insecure_certs_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_user_context(accept_insecure_certs=value)
