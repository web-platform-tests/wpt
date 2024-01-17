import pytest
from .. import assert_cookie_is_set, create_cookie

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "name",
    [
        "",
        "cookieName",
        "cookie@name",
        "cookie:name",
        "cookie(name)",
        "cookie[name]",
        "123cookie",
        "cookie name",
        "a_very_long_cookie_name_12345678901234567890123456789012345678901234567890123456789012345678901234567890",
        "cookie/name",
        "cookie?name",
    ])
async def test_cookie_name(bidi_session, top_context, test_page, origin, domain_value, name):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    await bidi_session.storage.set_cookie(cookie=create_cookie(domain=domain_value(), name=name))
    await assert_cookie_is_set(bidi_session, name=name, domain=domain_value(), origin=origin())
