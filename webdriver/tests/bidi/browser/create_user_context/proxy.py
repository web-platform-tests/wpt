import pytest

from .. import get_user_context_ids

pytestmark = pytest.mark.asyncio


@pytest.fixture
def create_user_context_with_proxy_and_assert_it_is_created(bidi_session,
        create_user_context):
    async def create_user_context_with_proxy_and_assert_it_is_created(proxy):
        user_context = await create_user_context(proxy=proxy)

        # TODO: check the parameter is respected.

        assert user_context in await get_user_context_ids(bidi_session)

    return create_user_context_with_proxy_and_assert_it_is_created


async def test_system(create_user_context_with_proxy_and_assert_it_is_created):
    await create_user_context_with_proxy_and_assert_it_is_created({
        "proxyType": "system"
    })


async def test_autodetect(
        create_user_context_with_proxy_and_assert_it_is_created):
    await create_user_context_with_proxy_and_assert_it_is_created({
        "proxyType": "autodetect"
    })


async def test_direct(create_user_context_with_proxy_and_assert_it_is_created):
    await create_user_context_with_proxy_and_assert_it_is_created({
        "proxyType": "direct"
    })


@pytest.mark.parametrize("ftpProxy", [None, "127.0.0.1:21"])
@pytest.mark.parametrize("httpProxy", [None, "127.0.0.1:80"])
@pytest.mark.parametrize("sslProxy", [None, "127.0.0.1:443"])
@pytest.mark.parametrize("noProxy", [None, ["127.0.0.1"]])
@pytest.mark.parametrize("socks", [None, {
    "socksProxy": "127.0.0.1:1080",
    "socksVersion": 5}])
async def test_manual(create_user_context_with_proxy_and_assert_it_is_created,
        ftpProxy, httpProxy, sslProxy,
        noProxy, socks):
    proxy = {
        "proxyType": "manual"
    }

    if ftpProxy is not None:
        proxy["ftpProxy"] = ftpProxy

    if httpProxy is not None:
        proxy["httpProxy"] = httpProxy

    if sslProxy is not None:
        proxy["sslProxy"] = sslProxy

    if noProxy is not None:
        proxy["noProxy"] = noProxy

    if socks is not None:
        proxy.update(socks)

    await create_user_context_with_proxy_and_assert_it_is_created(proxy)

# TODO: test "proxyType": "pac"
