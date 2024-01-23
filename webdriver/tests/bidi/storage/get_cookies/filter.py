import pytest

from datetime import datetime, timedelta, timezone

from webdriver.bidi.modules.network import NetworkBase64Value, NetworkStringValue
from webdriver.bidi.modules.storage import BrowsingContextPartitionDescriptor, Filter

from . import add_cookie, remove_cookie
from ... import recursive_compare

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "filter",
    [
        {"name": "foo"},
        {"size": 6},
        {"value": NetworkStringValue("bar")},
        {"value": NetworkBase64Value("YmFy")},
    ],
)
async def test_filter(bidi_session, new_tab, test_page, origin, domain_value, filter):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page, wait="complete"
    )
    source_origin = origin("https")

    cookie_name_1 = "foo"
    cookie_value_1 = "bar"
    await add_cookie(bidi_session, new_tab["context"], cookie_name_1, cookie_value_1)

    cookie_name_2 = "foo_2"
    await add_cookie(bidi_session, new_tab["context"], cookie_name_2, "bar_2")

    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(new_tab["context"]),
        filter=filter,
    )

    assert cookies["partitionKey"] == {"sourceOrigin": source_origin}
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(),
            "httpOnly": False,
            "name": cookie_name_1,
            "path": "/webdriver/tests/support",
            "sameSite": "none",
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value_1},
        },
        cookies["cookies"][0],
    )

    await remove_cookie(bidi_session, new_tab["context"], cookie_name_1)
    await remove_cookie(bidi_session, new_tab["context"], cookie_name_2)


async def test_filter_expiry(bidi_session, new_tab, test_page, domain_value, origin):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page, wait="complete"
    )
    source_origin = origin("https")

    cookie_name_1 = "foo"
    cookie_value_1 = "bar"
    # same formatting as Date.toUTCString() in javascript
    utc_string_format = "%a, %d %b %Y %H:%M:%S GMT"
    date_now_plus_one_day = (
        (datetime.utcnow() + timedelta(days=1))
        .replace(microsecond=0)
        .replace(tzinfo=timezone.utc)
    )
    cookie_expiry = int(date_now_plus_one_day.timestamp())
    date_string = date_now_plus_one_day.strftime(utc_string_format)
    await add_cookie(
        bidi_session=bidi_session,
        context=new_tab["context"],
        name=cookie_name_1,
        value=cookie_value_1,
        expiry=date_string,
    )

    cookie_name_2 = "foo_2"
    await add_cookie(bidi_session, new_tab["context"], cookie_name_2, "bar_2")

    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(new_tab["context"]),
        filter=Filter(expiry=cookie_expiry),
    )

    assert cookies["partitionKey"] == {"sourceOrigin": source_origin}
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(),
            "expiry": cookie_expiry,
            "httpOnly": False,
            "name": cookie_name_1,
            "path": "/webdriver/tests/support",
            "sameSite": "none",
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value_1},
        },
        cookies["cookies"][0],
    )

    await remove_cookie(bidi_session, new_tab["context"], cookie_name_1)
    await remove_cookie(bidi_session, new_tab["context"], cookie_name_2)


@pytest.mark.parametrize(
    "same_site_1, same_site_2",
    [("none", "strict"), ("lax", "none"), ("strict", "none")],
)
async def test_filter_same_site(
    bidi_session, new_tab, test_page, origin, domain_value, same_site_1, same_site_2
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page, wait="complete"
    )
    source_origin = origin("https")

    cookie_name_1 = "foo"
    cookie_value_1 = "bar"
    await add_cookie(
        bidi_session,
        new_tab["context"],
        cookie_name_1,
        cookie_value_1,
        same_site=same_site_1,
    )

    cookie_name_2 = "foo_2"
    await add_cookie(
        bidi_session, new_tab["context"], cookie_name_2, "bar_2", same_site=same_site_2
    )

    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(new_tab["context"]),
        filter=Filter(same_site=same_site_1),
    )

    assert cookies["partitionKey"] == {"sourceOrigin": source_origin}
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(),
            "httpOnly": False,
            "name": cookie_name_1,
            "path": "/webdriver/tests/support",
            "sameSite": same_site_1,
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value_1},
        },
        cookies["cookies"][0],
    )

    await remove_cookie(bidi_session, new_tab["context"], cookie_name_1)
    await remove_cookie(bidi_session, new_tab["context"], cookie_name_2)


@pytest.mark.parametrize(
    "secure_1, secure_2",
    [(True, False), (False, True)],
)
async def test_filter_secure(
    bidi_session, new_tab, test_page, origin, domain_value, secure_1, secure_2
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page, wait="complete"
    )
    source_origin = origin("https")

    cookie_name_1 = "foo"
    cookie_value_1 = "bar"
    await add_cookie(
        bidi_session,
        new_tab["context"],
        cookie_name_1,
        cookie_value_1,
        secure=secure_1,
    )

    cookie_name_2 = "foo_2"
    await add_cookie(
        bidi_session, new_tab["context"], cookie_name_2, "bar_2", secure=secure_2
    )

    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(new_tab["context"]),
        filter=Filter(secure=secure_1),
    )

    assert cookies["partitionKey"] == {"sourceOrigin": source_origin}
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(),
            "httpOnly": False,
            "name": cookie_name_1,
            "path": "/webdriver/tests/support",
            "sameSite": "none",
            "secure": secure_1,
            "size": 6,
            "value": {"type": "string", "value": cookie_value_1},
        },
        cookies["cookies"][0],
    )

    await remove_cookie(bidi_session, new_tab["context"], cookie_name_1)
    await remove_cookie(bidi_session, new_tab["context"], cookie_name_2)


async def test_filter_path(bidi_session, new_tab, test_page, origin, domain_value):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page, wait="complete"
    )
    source_origin = origin("https")

    cookie_name_1 = "foo"
    cookie_value_1 = "bar"
    cookie_path_1 = "/"
    await add_cookie(
        bidi_session,
        new_tab["context"],
        cookie_name_1,
        cookie_value_1,
        path=cookie_path_1,
    )

    cookie_name_2 = "foo_2"
    await add_cookie(bidi_session, new_tab["context"], cookie_name_2, "bar_2")

    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(new_tab["context"]),
        filter=Filter(path=cookie_path_1),
    )

    assert cookies["partitionKey"] == {"sourceOrigin": source_origin}
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(),
            "httpOnly": False,
            "name": cookie_name_1,
            "path": cookie_path_1,
            "sameSite": "none",
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value_1},
        },
        cookies["cookies"][0],
    )

    await remove_cookie(bidi_session, new_tab["context"], cookie_name_1)
    await remove_cookie(bidi_session, new_tab["context"], cookie_name_2)
