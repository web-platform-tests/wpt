# META: timeout=long

# Each browsingContext.fragmentNavigated event carries the navigation id returned by the
# browsingContext.navigate command that started it, never the id of a neighbouring navigation.

import pytest

from webdriver.bidi.modules.script import ContextTarget
from webdriver.error import TimeoutException

pytestmark = pytest.mark.asyncio

EMPTY_PAGE = "/webdriver/tests/bidi/browsing_context/support/empty.html"
FRAGMENT_NAVIGATED_EVENT = "browsingContext.fragmentNavigated"
HISTORY_UPDATED_EVENT = "browsingContext.historyUpdated"
LOAD_EVENT = "browsingContext.load"
NAVIGATION_FAILED_EVENT = "browsingContext.navigationFailed"
NAVIGATION_STARTED_EVENT = "browsingContext.navigationStarted"
EVENTS = [
    FRAGMENT_NAVIGATED_EVENT,
    HISTORY_UPDATED_EVENT,
    LOAD_EVENT,
    NAVIGATION_FAILED_EVENT,
    NAVIGATION_STARTED_EVENT,
]
# Whether a same-document navigation emits browsingContext.navigationStarted differs between
# implementations, so exact event lists leave it out; when it is emitted, it is checked
# separately to carry the id and URL of its own navigation.
REPORT_EVENTS = [event for event in EVENTS if event != NAVIGATION_STARTED_EVENT]


def filter_events(events, context, *methods):
    return [
        data
        for method, data in events
        if data["context"] == context and (not methods or method in methods)
    ]


def started_events(events, context):
    return [
        (event["navigation"], event["url"])
        for event in filter_events(events, context, NAVIGATION_STARTED_EVENT)
    ]


async def assert_no_further_events(waiter, context):
    """Check that no further event arrives for the context, such as a duplicate report."""
    count = len(filter_events(waiter.events, context))
    with pytest.raises(TimeoutException):
        await waiter.get_events(
            lambda events: len(filter_events(events, context)) > count, timeout=0.5
        )


async def test_consecutive_commands(
    bidi_session, subscribe_events, url, top_context, wait_for_events
):
    context = top_context["context"]
    page = url(EMPTY_PAGE)
    await bidi_session.browsing_context.navigate(context=context, url=page, wait="complete")
    await subscribe_events(events=EVENTS)

    with wait_for_events(EVENTS) as waiter:
        first = await bidi_session.browsing_context.navigate(
            context=context, url=f"{page}#foo", wait="none"
        )
        second = await bidi_session.browsing_context.navigate(
            context=context, url=f"{page}#bar", wait="none"
        )
        await waiter.get_events(
            lambda events: len(filter_events(events, context, FRAGMENT_NAVIGATED_EVENT)) >= 2
        )
        await assert_no_further_events(waiter, context)
        events = waiter.events

    assert first["navigation"] != second["navigation"]
    navigations = [(first["navigation"], f"{page}#foo"), (second["navigation"], f"{page}#bar")]
    reports = filter_events(events, context, *REPORT_EVENTS)
    assert [(event["navigation"], event["url"]) for event in reports] == navigations
    assert all(started in navigations for started in started_events(events, context))


async def test_consecutive_commands_same_url(
    bidi_session, subscribe_events, url, top_context, wait_for_events
):
    context = top_context["context"]
    page = url(EMPTY_PAGE)
    target_url = f"{page}#foo"
    await bidi_session.browsing_context.navigate(context=context, url=page, wait="complete")
    await subscribe_events(events=EVENTS)

    with wait_for_events(EVENTS) as waiter:
        first = await bidi_session.browsing_context.navigate(
            context=context, url=target_url, wait="none"
        )
        second = await bidi_session.browsing_context.navigate(
            context=context, url=target_url, wait="none"
        )

        def second_navigation_finished(events):
            second_events = [
                event
                for event in filter_events(events, context, FRAGMENT_NAVIGATED_EVENT, LOAD_EVENT)
                if event["navigation"] == second["navigation"]
            ]
            return len(second_events) > 0

        await waiter.get_events(second_navigation_finished)
        await assert_no_further_events(waiter, context)
        events = waiter.events

    assert first["navigation"] != second["navigation"]

    def methods_for(navigation_id):
        return [
            method
            for method, data in events
            if data["context"] == context and data["navigation"] == navigation_id
        ]

    first_methods = methods_for(first["navigation"])
    second_methods = methods_for(second["navigation"])
    assert len(filter_events(events, context)) == len(first_methods) + len(second_methods)
    assert all(event["url"] == target_url for event in filter_events(events, context))
    assert first_methods in (
        [FRAGMENT_NAVIGATED_EVENT],
        [NAVIGATION_STARTED_EVENT, FRAGMENT_NAVIGATED_EVENT],
    )

    # Navigating to the current URL again may be a fragment navigation or a navigation that
    # reloads the document; either way all of its events carry the second id.
    assert second_methods in (
        [FRAGMENT_NAVIGATED_EVENT],
        [NAVIGATION_STARTED_EVENT, FRAGMENT_NAVIGATED_EVENT],
        [NAVIGATION_STARTED_EVENT, LOAD_EVENT],
    )


async def test_script_navigation_then_command(
    bidi_session, subscribe_events, url, top_context, wait_for_events
):
    context = top_context["context"]
    page = url(EMPTY_PAGE)
    script_url = f"{page}#script"
    command_url = f"{page}#command"
    await bidi_session.browsing_context.navigate(context=context, url=page, wait="complete")
    await subscribe_events(events=EVENTS)

    with wait_for_events(EVENTS) as waiter:
        await bidi_session.script.evaluate(
            expression="location.hash = 'script'",
            target=ContextTarget(context),
            await_promise=False,
        )
        result = await bidi_session.browsing_context.navigate(
            context=context, url=command_url, wait="none"
        )

        def both_reported(events):
            urls = [event["url"] for event in filter_events(events, context, *REPORT_EVENTS)]
            return script_url in urls and command_url in urls

        await waiter.get_events(both_reported)
        await assert_no_further_events(waiter, context)
        events = waiter.events

    reports = filter_events(events, context, *REPORT_EVENTS)
    assert sorted(event["url"] for event in reports) == sorted([script_url, command_url])
    assert reports == filter_events(events, context, FRAGMENT_NAVIGATED_EVENT)
    events_by_url = {event["url"]: event for event in reports}
    assert events_by_url[script_url]["navigation"] != result["navigation"]
    assert events_by_url[command_url]["navigation"] == result["navigation"]
    for navigation_id, started_url in started_events(events, context):
        assert (navigation_id == result["navigation"]) == (started_url == command_url)


@pytest.mark.parametrize("history_method", ["pushState", "replaceState"])
async def test_history_update_during_command(
    bidi_session, subscribe_events, inline, top_context, wait_for_events, history_method
):
    context = top_context["context"]
    page = inline(f"""<script>
        window.addEventListener("popstate", () => history.{history_method}(null, "", "#nested"));
    </script>""")
    command_url = f"{page}#command"
    await bidi_session.browsing_context.navigate(context=context, url=page, wait="complete")
    await subscribe_events(events=EVENTS)

    # The fragment navigation fires popstate, whose handler updates the history synchronously.
    # The history update is reported as browsingContext.historyUpdated, which has no navigation
    # id, and must not take the command's id or produce a fragmentNavigated event of its own.
    with wait_for_events(EVENTS) as waiter:
        result = await bidi_session.browsing_context.navigate(
            context=context, url=command_url, wait="none"
        )

        def both_reported(events):
            fragments = filter_events(events, context, FRAGMENT_NAVIGATED_EVENT)
            history_updates = filter_events(events, context, HISTORY_UPDATED_EVENT)
            command_reported = any(event["url"] == command_url for event in fragments)
            return command_reported and len(history_updates) > 0

        await waiter.get_events(both_reported)
        await assert_no_further_events(waiter, context)
        events = waiter.events

    fragments = filter_events(events, context, FRAGMENT_NAVIGATED_EVENT)
    assert [(event["navigation"], event["url"]) for event in fragments] == [
        (result["navigation"], command_url)
    ]
    history_updates = filter_events(events, context, HISTORY_UPDATED_EVENT)
    assert len(history_updates) == 1
    assert history_updates[0]["url"].endswith("#nested")
    assert "navigation" not in history_updates[0]
    assert len(filter_events(events, context, *REPORT_EVENTS)) == 2
    assert all(
        started == (result["navigation"], command_url)
        for started in started_events(events, context)
    )
