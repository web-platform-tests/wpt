import pytest
from .. import assert_cookie_is_set, create_cookie
from webdriver.bidi.undefined import UNDEFINED

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "http_only",
    [
        True,
        False,
        UNDEFINED
    ])
async def test_cookie_http_only(bidi_session, top_context, test_page, origin, domain_value, http_only):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    set_cookie_result = await bidi_session.storage.set_cookie(
        cookie=create_cookie(domain=domain_value(), http_only=http_only))

    assert set_cookie_result == {
        'partitionKey': {},
    }

    # `httpOnly` defaults to `false`.
    expected_http_only = http_only if http_only is not UNDEFINED else False

    await assert_cookie_is_set(
        bidi_session,
        domain=domain_value(),
        origin=origin(),
        http_only=expected_http_only,
    )
