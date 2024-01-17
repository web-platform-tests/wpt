import pytest
from .. import assert_cookie_is_set, create_cookie
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "name",
    [
        " cookieName",
        "cookie=name",
        "cookie\tname",
        "cookie\nname",
        "cookie\x01name",
        "cookie\x0Fname",
        "cookie;name",
    ])
async def test_cookie_name_invalid_value(bidi_session, top_context, test_page, origin, domain_value, name):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    with pytest.raises(error.UnableToSetCookieException):
        await bidi_session.storage.set_cookie(cookie=create_cookie(domain=domain_value(), name=name))
