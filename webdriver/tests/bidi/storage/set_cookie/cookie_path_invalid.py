import pytest
from .. import create_cookie
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "path",
    [
        ""
        "no_leading_forward_slash"
    ]
)
async def test_path_invalid_values(bidi_session, top_context, test_page,  domain_value, path):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    with pytest.raises(error.UnableToSetCookieException):
        await bidi_session.storage.set_cookie(
            cookie=create_cookie(domain=domain_value(), path=path))
