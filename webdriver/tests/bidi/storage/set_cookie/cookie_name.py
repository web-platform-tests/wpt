import pytest
from .. import assert_cookie_is_set, create_cookie

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "name",
    [
        "",
        "cookie name with special symbols !@#$%&*()_+-{}[]|\\:\"'<>,.?/`~",
        "123cookie",
    ])
async def test_cookie_name(bidi_session, top_context, test_page, domain_value, name):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    await bidi_session.storage.set_cookie(cookie=create_cookie(domain=domain_value(), name=name))
    await assert_cookie_is_set(bidi_session, name=name, domain=domain_value())
