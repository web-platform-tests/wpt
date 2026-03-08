import pytest
from .. import assert_cookie_is_set, create_cookie
from webdriver.bidi.modules.network import NetworkBase64Value, NetworkStringValue

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "str_value",
    [
        "simple_value",
        "special_symbols =!@#$%^&*()_+-{}[]|\\:\"'<>,.?/`~"
    ])
async def test_cookie_value_string(bidi_session, set_cookie, test_page, domain_value, str_value):
    value = NetworkStringValue(str_value)

    await set_cookie(cookie=create_cookie(domain=domain_value(), value=value))
    await assert_cookie_is_set(bidi_session, value=value, domain=domain_value())


@pytest.mark.parametrize(
    "base64_value",
    [
        "Zm9v",
        "aGVsbG8gd29ybGQ=",
    ])
async def test_cookie_value_base64(bidi_session, set_cookie, test_page, domain_value, base64_value):
    value = NetworkBase64Value(base64_value)

    await set_cookie(cookie=create_cookie(domain=domain_value(), value=value))
    await assert_cookie_is_set(bidi_session, value=value, domain=domain_value())
