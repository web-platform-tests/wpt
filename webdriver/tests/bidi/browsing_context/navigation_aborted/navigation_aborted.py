import asyncio
import pytest
from tests.support.sync import AsyncPoll

from webdriver.error import TimeoutException

from .. import assert_navigation_info


pytestmark = pytest.mark.asyncio

NAVIGATION_ABORTED_EVENT = "browsingContext.navigationAborted"
NAVIGATION_STARTED_EVENT = "browsingContext.navigationStarted"
USER_PROMPT_OPENED_EVENT = "browsingContext.userPromptOpened"


async def test_unsubscribe(bidi_session, inline, new_tab):
    await bidi_session.session.subscribe(events=[NAVIGATION_ABORTED_EVENT])
    await bidi_session.session.unsubscribe(events=[NAVIGATION_ABORTED_EVENT])

    # Track all received browsingContext.navigationFailed events in the events array.
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(NAVIGATION_ABORTED_EVENT, on_event)

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


async def test_with_new_navigation(
    bidi_session,
    subscribe_events,
    inline,
    url,
    new_tab,
    wait_for_event,
    wait_for_future_safe,
):
    slow_page_url = url(
        "/webdriver/tests/bidi/browsing_context/support/empty.html?pipe=trickle(d10)"
    )
    await subscribe_events(events=[NAVIGATION_ABORTED_EVENT])

    result = await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=slow_page_url, wait="none"
    )
    on_navigation_failed = wait_for_event(NAVIGATION_ABORTED_EVENT)
    second_url = inline("<div>foo</div>")

    # Trigger the second navigation which should fail the first one.
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=second_url, wait="none"
    )

    event = await wait_for_future_safe(on_navigation_failed)

    # Make sure that the first navigation failed.
    assert_navigation_info(
        event,
        {
            "context": new_tab["context"],
            "navigation": result["navigation"],
            "url": slow_page_url,
        },
    )


async def test_with_new_navigation_inside_page(
    bidi_session,
    subscribe_events,
    inline,
    new_tab,
    wait_for_event,
    wait_for_future_safe,
):
    second_url = inline("<div>foo</div>")
    slow_page_url = inline(
        f"""
<!DOCTYPE html>
<html>
    <body>
        <img src="/webdriver/tests/bidi/browsing_context/support/empty.svg?pipe=trickle(d10)" />
        <script>
            location.href = "{second_url}"
        </script>
        <img src="/webdriver/tests/bidi/browsing_context/support/empty.svg?pipe=trickle(d10)" />
    </body>
</html>
"""
    )
    await subscribe_events(events=[NAVIGATION_ABORTED_EVENT])
    on_navigation_failed = wait_for_event(NAVIGATION_ABORTED_EVENT)

    result = await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=slow_page_url, wait="none"
    )

    event = await wait_for_future_safe(on_navigation_failed)

    # Make sure that the first navigation failed.
    assert_navigation_info(
        event,
        {
            "context": new_tab["context"],
            "navigation": result["navigation"],
            "url": slow_page_url,
        },
    )
