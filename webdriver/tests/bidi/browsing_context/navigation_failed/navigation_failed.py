import pytest
from tests.support.sync import AsyncPoll

from webdriver.error import TimeoutException

from .. import assert_navigation_info


pytestmark = pytest.mark.asyncio

NAVIGATION_FAILED_EVENT = "browsingContext.navigationFailed"
NAVIGATION_STARTED_EVENT = "browsingContext.navigationStarted"


async def test_unsubscribe(bidi_session, inline, new_tab):
    await bidi_session.session.subscribe(events=[NAVIGATION_FAILED_EVENT])
    await bidi_session.session.unsubscribe(events=[NAVIGATION_FAILED_EVENT])

    # Track all received browsingContext.navigationFailed events in the events array.
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(NAVIGATION_FAILED_EVENT, on_event)

    iframe_url = inline("<div>foo</div>", domain="alt")
    page_url = inline(
        f"""<iframe src={iframe_url}></iframe>""",
        parameters={"pipe": "header(Content-Security-Policy, default-src 'self')"},
    )

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=page_url, wait="none"
    )

    wait = AsyncPoll(bidi_session, timeout=0.5)
    with pytest.raises(TimeoutException):
        await wait.until(lambda _: len(events) > 0)

    remove_listener()


async def test_with_csp_meta_tag(
    bidi_session,
    subscribe_events,
    inline,
    new_tab,
    wait_for_event,
    wait_for_future_safe,
):
    iframe_url = inline("<div>foo</div>", domain="alt")
    page_url = inline(
        f"""
<!DOCTYPE html>
<html>
    <head>
        <meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'" />
    </head>
    <body><iframe src="{iframe_url}"></iframe></body>
</html>
"""
    )
    await subscribe_events(events=[NAVIGATION_FAILED_EVENT, NAVIGATION_STARTED_EVENT])

    # Track all received browsingContext.navigationStarted events in the events array.
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(
        NAVIGATION_STARTED_EVENT, on_event
    )

    on_navigation_failed = wait_for_event(NAVIGATION_FAILED_EVENT)
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=page_url, wait="complete"
    )
    event = await wait_for_future_safe(on_navigation_failed)

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])
    iframe_context = contexts[0]["children"][0]["context"]

    started_event_for_iframe = next(
        event for event in events if event["context"] == iframe_context
    )

    # Make sure that the iframe navigation was blocked.
    assert_navigation_info(
        event,
        {
            "context": iframe_context,
            "navigation": started_event_for_iframe["navigation"],
            "url": iframe_url,
        },
    )

    remove_listener()


@pytest.mark.parametrize(
    "header",
    [
        "Content-Security-Policy, default-src 'self'",
        "Cross-Origin-Embedder-Policy, require-corp",
    ],
)
async def test_with_content_blocking_header_in_top_context(
    bidi_session,
    subscribe_events,
    inline,
    new_tab,
    wait_for_event,
    wait_for_future_safe,
    header,
):
    iframe_url = inline("<div>foo</div>", domain="alt")
    page_url = inline(
        f"""<iframe src={iframe_url}></iframe>""",
        parameters={"pipe": f"header({header})"},
    )
    await subscribe_events(events=[NAVIGATION_FAILED_EVENT, NAVIGATION_STARTED_EVENT])

    # Track all received browsingContext.navigationStarted events in the events array.
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(
        NAVIGATION_STARTED_EVENT, on_event
    )

    on_navigation_failed = wait_for_event(NAVIGATION_FAILED_EVENT)
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=page_url, wait="none"
    )
    event = await wait_for_future_safe(on_navigation_failed)

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])
    iframe_context = contexts[0]["children"][0]["context"]

    started_event_for_iframe = next(
        event for event in events if event["context"] == iframe_context
    )

    # Make sure that the iframe navigation was blocked.
    assert_navigation_info(
        event,
        {
            "context": iframe_context,
            "navigation": started_event_for_iframe["navigation"],
            "url": iframe_url,
        },
    )

    remove_listener()


@pytest.mark.parametrize(
    "header_value",
    [
        "SAMEORIGIN",
        "DENY",
    ],
)
async def test_with_x_frame_options_header(
    bidi_session,
    subscribe_events,
    inline,
    new_tab,
    wait_for_event,
    wait_for_future_safe,
    header_value
):
    iframe_url = inline(
        "<div>foo</div>",
        parameters={"pipe": f"header(X-Frame-Options, {header_value})"},
    )
    page_url = inline(f"""<iframe src={iframe_url}></iframe>""", domain="alt")
    await subscribe_events(events=[NAVIGATION_FAILED_EVENT, NAVIGATION_STARTED_EVENT])

    # Track all received browsingContext.navigationStarted events in the events array.
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(
        NAVIGATION_STARTED_EVENT, on_event
    )

    on_navigation_failed = wait_for_event(NAVIGATION_FAILED_EVENT)
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=page_url, wait="none"
    )
    event = await wait_for_future_safe(on_navigation_failed)

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])
    iframe_context = contexts[0]["children"][0]["context"]

    started_event_for_iframe = next(
        event for event in events if event["context"] == iframe_context
    )

    # Make sure that the iframe navigation was blocked.
    assert_navigation_info(
        event,
        {
            "context": iframe_context,
            "navigation": started_event_for_iframe["navigation"],
            "url": iframe_url,
        },
    )

    remove_listener()
