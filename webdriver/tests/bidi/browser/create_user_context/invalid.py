import pytest

import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", [False, 42, "foo", []])
async def test_proxy_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_user_context(
            proxy=value)


@pytest.mark.parametrize("value", [{}])
async def test_proxy_invalid_value(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_user_context(
            proxy=value)


@pytest.mark.parametrize("value", [False, 42, {}, []])
async def test_proxy_proxy_type_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_user_context(
            proxy={
                "proxyType": value
            })


async def test_proxy_proxy_type_manual_missing_socks_proxy(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_user_context(
            proxy={
                "proxyType": "manual",
                "socksVersion": 0
            })


async def test_proxy_proxy_type_manual_missing_socks_Version(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_user_context(
            proxy={
                "proxyType": "manual",
                "socksProxy": "127.0.0.1:1080"
            })
