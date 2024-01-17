import pytest
from .. import create_cookie
from webdriver.bidi.modules.network import NetworkStringValue
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "str_value",
    [
        "value\twith\ttab",
        "value\nwith\nnewline",
        "value;with;semicolon",
    ])
async def test_cookie_value_string_invalid_value(bidi_session, top_context, test_page, domain_value, str_value):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    value = NetworkStringValue(str_value)

    with pytest.raises(error.UnableToSetCookieException):
        await bidi_session.storage.set_cookie(cookie=create_cookie(domain=domain_value(), value=value))
