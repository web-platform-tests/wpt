import asyncio
import pytest

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("wait", ["none", "interactive", "complete"])
async def test_expected_url(bidi_session, inline, new_tab, wait):
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url,
                                                 wait=wait)
    result = await bidi_session.browsing_context.reload(
        context=new_tab["context"], wait=wait)
    assert result == {}
    if wait != "none":
        contexts = await bidi_session.browsing_context.get_tree(
            root=new_tab["context"], max_depth=0)
        assert contexts[0]["url"] == url


@pytest.mark.parametrize(
    "wait, expect_timeout",
    [
        ("none", False),
        ("interactive", False),
        ("complete", True),
    ],
)
async def test_slow_image_blocks_load(bidi_session, inline, new_tab, wait,
                                      expect_timeout):
    script_url = "/webdriver/tests/bidi/browsing_context/navigate/support/empty.svg"
    url = inline(f"<img src='{script_url}?pipe=trickle(d10)'>")

    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url,
                                                 wait=wait)

    # Ultimately, "interactive" and "complete" should support a timeout argument.
    # See https://github.com/w3c/webdriver-bidi/issues/188.
    if expect_timeout:
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(
                asyncio.shield(
                    bidi_session.browsing_context.reload(
                        context=new_tab["context"], wait=wait)),
                timeout=1,
            )
    else:
        await bidi_session.browsing_context.reload(context=new_tab["context"],
                                                   wait=wait)

    # We cannot assert the URL for "none" by definition, and for "complete", since
    # we expect a timeout. For the timeout case, the wait_for_navigation helper will
    # resume after 1 second, there is no guarantee that the URL has been updated.
    if wait == "interactive":
        contexts = await bidi_session.browsing_context.get_tree(
            root=new_tab["context"], max_depth=0)
        assert contexts[0]["url"] == url


@pytest.mark.parametrize(
    "wait, expect_timeout",
    [
        ("none", False),
        ("interactive", True),
        ("complete", True),
    ],
)
async def test_slow_page(bidi_session, new_tab, url, wait, expect_timeout):
    url = url(
        "/webdriver/tests/bidi/browsing_context/navigate/support/empty.html?pipe=trickle(d10)"
    )

    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url,
                                                 wait=wait)

    # Ultimately, "interactive" and "complete" should support a timeout argument.
    # See https://github.com/w3c/webdriver-bidi/issues/188.
    if expect_timeout:
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(
                asyncio.shield(
                    bidi_session.browsing_context.reload(
                        context=new_tab["context"], wait=wait)),
                timeout=1,
            )
    else:
        await bidi_session.browsing_context.reload(context=new_tab["context"],
                                                   wait=wait)

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
async def test_slow_script_blocks_domContentLoaded(bidi_session, inline,
                                                   new_tab, wait,
                                                   expect_timeout):
    script_url = "/webdriver/tests/bidi/browsing_context/navigate/support/empty.js"
    url = inline(f"<script src='{script_url}?pipe=trickle(d10)'></script>")

    await bidi_session.browsing_context.navigate(context=new_tab["context"],
                                                 url=url,
                                                 wait=wait)

    # Ultimately, "interactive" and "complete" should support a timeout argument.
    # See https://github.com/w3c/webdriver-bidi/issues/188.
    if expect_timeout:
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(
                asyncio.shield(
                    bidi_session.browsing_context.reload(
                        context=new_tab["context"], wait=wait)),
                timeout=1,
            )
    else:
        await bidi_session.browsing_context.reload(context=new_tab["context"],
                                                   wait=wait)

    # In theory we could also assert the top context URL has been updated here,
    # but since we expect both "interactive" and "complete" to timeout the
    # wait_for_navigation helper will resume arbitrarily after 1 second, and
    # there is no guarantee that the URL has been updated.
