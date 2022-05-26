import pytest
import asyncio

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", ["none", "interactive", "complete"])
async def test_expected_url(bidi_session, inline, value):
    new_tab = await bidi_session.browsing_context.create(type_hint='tab')

    url = inline("<div>foo</div>")
    result = await bidi_session.browsing_context.navigate(
        context=new_tab, url=url, wait=value
    )
    assert result["url"] == url
    if value != "none":
        contexts = await bidi_session.browsing_context.get_tree(
            root=new_tab, max_depth=0
        )
        assert contexts[0]["url"] == url


@pytest.mark.parametrize(
    "wait, expect_timeout",
    [
        ("none", False),
        ("interactive", False),
        ("complete", True),
    ],
)
async def test_slow_image(bidi_session, inline, wait, expect_timeout):
    new_tab = await bidi_session.browsing_context.create(type_hint='tab')

    script_url = "/webdriver/tests/bidi/browsing_context/navigate/support/empty.svg"
    url = inline(f"<img src='{script_url}?pipe=trickle(d10)'>")

    # Ultimately, "interactive" and "complete" should support a timeout argument.
    # See https://github.com/w3c/webdriver-bidi/issues/188.
    wait_for_navigation = asyncio.wait_for(
        bidi_session.browsing_context.navigate(
            context=new_tab, url=url, wait=wait
        ),
        timeout=1,
    )

    if expect_timeout:
        with pytest.raises(asyncio.TimeoutError):
            await wait_for_navigation
    else:
        await wait_for_navigation

    if wait != "none":
        contexts = await bidi_session.browsing_context.get_tree(
            root=new_tab, max_depth=0
        )
        assert contexts[0]["url"] == url


@pytest.mark.parametrize(
    "wait, expect_timeout",
    [
        ("none", False),
        ("interactive", True),
        ("complete", True),
    ],
)
async def test_slow_page(bidi_session, url, wait, expect_timeout):
    new_tab = await bidi_session.browsing_context.create(type_hint='tab')

    page_url = url(
        "/webdriver/tests/bidi/browsing_context/navigate/support/empty.html?pipe=trickle(d10)"
    )

    wait_for_navigation = asyncio.wait_for(
        bidi_session.browsing_context.navigate(
            context=new_tab, url=page_url, wait=wait
        ),
        timeout=1,
    )

    if expect_timeout:
        with pytest.raises(asyncio.TimeoutError):
            await wait_for_navigation
    else:
        await wait_for_navigation

    # Note that we cannot assert the top context url here, because the navigation
    # is blocked on the initial url for this test case.


@pytest.mark.parametrize(
    "wait, expect_timeout",
    [
        ("none", False),
        ("interactive", True),
        ("complete", True),
    ],
)
async def test_slow_script(bidi_session, inline, wait, expect_timeout):
    new_tab = await bidi_session.browsing_context.create(type_hint='tab')

    script_url = "/webdriver/tests/bidi/browsing_context/navigate/support/empty.js"
    url = inline(f"<script src='{script_url}?pipe=trickle(d10)'></script>")

    wait_for_navigation = asyncio.wait_for(
        bidi_session.browsing_context.navigate(
            context=new_tab, url=url, wait=wait
        ),
        timeout=1,
    )

    if expect_timeout:
        with pytest.raises(asyncio.TimeoutError):
            await wait_for_navigation
    else:
        await wait_for_navigation

    if wait != "none":
        contexts = await bidi_session.browsing_context.get_tree(
            root=new_tab, max_depth=0
        )
        assert contexts[0]["url"] == url
