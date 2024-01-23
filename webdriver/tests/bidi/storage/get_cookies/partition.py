import pytest

from webdriver.bidi.modules.storage import (
    BrowsingContextPartitionDescriptor,
    StorageKeyPartitionDescriptor,
)

from . import add_cookie, remove_cookie
from ... import recursive_compare

pytestmark = pytest.mark.asyncio


async def test_partition(
    bidi_session, top_context, new_tab, test_page, test_page_cross_origin, domain_value
):
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=test_page_cross_origin, wait="complete"
    )
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page, wait="complete"
    )

    cookie_name_1 = "foo"
    cookie_value_1 = "bar"
    await add_cookie(bidi_session, new_tab["context"], cookie_name_1, cookie_value_1)

    cookie_name_2 = "foo"
    cookie_value_2 = "bar"
    await add_cookie(
        bidi_session, top_context["context"], cookie_name_2, cookie_value_2
    )

    cookies = await bidi_session.storage.get_cookies()

    assert cookies["partitionKey"] == {}
    assert len(cookies["cookies"]) == 2
    # Provide consistent cookies order.
    (cookie_1, cookie_2) = sorted(cookies["cookies"], key=lambda c: c["domain"])
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
        cookie_2,
    )
    recursive_compare(
        {
            "domain": domain_value("alt"),
            "httpOnly": False,
            "name": cookie_name_2,
            "path": "/webdriver/tests/support",
            "sameSite": "none",
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value_2},
        },
        cookie_1,
    )

    await remove_cookie(bidi_session, new_tab["context"], cookie_name_1)
    await remove_cookie(bidi_session, top_context["context"], cookie_name_2)


async def test_partition_context(
    bidi_session,
    top_context,
    new_tab,
    test_page,
    test_page_cross_origin,
    domain_value,
    origin,
):
    protocol = "https"

    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=test_page_cross_origin, wait="complete"
    )
    source_origin_1 = origin(protocol, "alt")

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page, wait="complete"
    )
    source_origin_2 = origin(protocol)

    cookie_name = "foo"
    cookie_value = "bar"
    await add_cookie(bidi_session, new_tab["context"], cookie_name, cookie_value)

    # Check that added cookies are present on the right context
    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(new_tab["context"])
    )

    assert cookies["partitionKey"] == {"sourceOrigin": source_origin_2}
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(),
            "httpOnly": False,
            "name": cookie_name,
            "path": "/webdriver/tests/support",
            "sameSite": "none",
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value},
        },
        cookies["cookies"][0],
    )

    # Check that added cookies are present on the other context
    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(top_context["context"])
    )

    assert cookies == {
        "cookies": [],
        "partitionKey": {"sourceOrigin": source_origin_1},
    }

    await remove_cookie(bidi_session, new_tab["context"], cookie_name)


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_partition_context_iframe(
    bidi_session, new_tab, inline, domain_value, origin, domain
):
    iframe_url = inline("<div id='in-iframe'>foo</div>", domain=domain)
    page_url = inline(f"<iframe src='{iframe_url}'></iframe>")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=page_url, wait="complete"
    )

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])
    iframe_context = contexts[0]["children"][0]

    cookie_name = "foo"
    cookie_value = "bar"
    await add_cookie(bidi_session, iframe_context["context"], cookie_name, cookie_value)

    # Check that added cookies are present on the right context
    cookies = await bidi_session.storage.get_cookies(
        partition=BrowsingContextPartitionDescriptor(iframe_context["context"])
    )

    assert cookies["partitionKey"] == {
        "sourceOrigin": origin(protocol="https", domain=domain)
    }
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(domain=domain),
            "httpOnly": False,
            "name": cookie_name,
            "path": "/webdriver/tests/support",
            "sameSite": "none",
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value},
        },
        cookies["cookies"][0],
    )

    await remove_cookie(bidi_session, iframe_context["context"], cookie_name)


@pytest.mark.parametrize(
    "protocol",
    [
        "http",
        "https",
    ],
)
async def test_partition_source_origin(
    bidi_session, top_context, new_tab, inline, domain_value, origin, protocol
):
    url_1 = inline("<div>foo</div>", domain="alt", protocol=protocol)
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url_1, wait="complete"
    )
    source_origin_1 = origin(protocol, "alt")

    url_2 = inline("<div>bar</div>", protocol=protocol)
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=url_2, wait="complete"
    )
    source_origin_2 = origin(protocol)

    cookie_name = "foo"
    cookie_value = "bar"
    await add_cookie(bidi_session, new_tab["context"], cookie_name, cookie_value)

    # Check that added cookies are present on the right context
    cookies = await bidi_session.storage.get_cookies(
        partition=StorageKeyPartitionDescriptor(source_origin=url_2)
    )

    assert cookies["partitionKey"] == {"sourceOrigin": source_origin_2}
    assert len(cookies["cookies"]) == 1
    recursive_compare(
        {
            "domain": domain_value(),
            "httpOnly": False,
            "name": cookie_name,
            "path": "/webdriver/tests/support",
            "sameSite": "none",
            "secure": False,
            "size": 6,
            "value": {"type": "string", "value": cookie_value},
        },
        cookies["cookies"][0],
    )

    # Check that added cookies are not present on the other context
    cookies = await bidi_session.storage.get_cookies(
        partition=StorageKeyPartitionDescriptor(source_origin=url_1)
    )

    assert cookies == {
        "cookies": [],
        "partitionKey": {"sourceOrigin": source_origin_1},
    }

    await remove_cookie(bidi_session, new_tab["context"], cookie_name)
