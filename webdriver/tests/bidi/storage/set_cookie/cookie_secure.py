import pytest
from .. import assert_cookie_is_set, create_cookie
from webdriver.bidi.undefined import UNDEFINED

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "secure",
    [
        True,
        False,
        UNDEFINED
    ]
)
async def test_cookie_secure(bidi_session, top_context, test_page, domain_value, secure):
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    set_cookie_result = await bidi_session.storage.set_cookie(
        cookie=create_cookie(domain=domain_value(), secure=secure))

    assert set_cookie_result == {
        'partitionKey': {},
    }

    # `secure` defaults to `false`.
    expected_secure = secure if secure is not UNDEFINED else False
    await assert_cookie_is_set(bidi_session, domain=domain_value(), secure=expected_secure)
