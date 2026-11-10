import pytest
from webdriver.error import TimeoutException

pytestmark = pytest.mark.asyncio


# The basic use case of unsubscribing globally from a single event
# is covered by tests for each event in the dedicated folders.


async def test_unsubscribe_from_module(bidi_session, new_tab, wait_for_bidi_events, inline):
    await bidi_session.session.subscribe(events=["browsingContext"])
    await bidi_session.session.unsubscribe(events=["browsingContext"])

    # Track all received browsing context events in the events array
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener_domContentLoaded = bidi_session.add_event_listener(
        "browsingContext.domContentLoaded", on_event
    )
    remove_listener_load = bidi_session.add_event_listener(
        "browsingContext.load", on_event
    )

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )

    with pytest.raises(TimeoutException):
        await wait_for_bidi_events(events, 1, timeout=0.5)

    remove_listener_domContentLoaded()
    remove_listener_load()


@pytest.mark.parametrize("event", [
    "browsingContext.historyUpdated",
    "browsingContext",
    "input",
    "log",
    "network",
    "script",
])
async def test_unsubscribe_from_known_event_or_module(
      bidi_session, subscribe_events, event
):
    await subscribe_events(events=[event])
    await bidi_session.session.unsubscribe(events=[event])


@pytest.mark.parametrize("subscription_events, events", [
    pytest.param(
        ["browsingContext"],
        ["browsingContext", "browsingContext.load"],
        id="module-then-event",
    ),
    pytest.param(
        ["browsingContext"],
        ["browsingContext.load", "browsingContext"],
        id="event-then-module",
    ),
    pytest.param(
        ["browsingContext.load"],
        ["browsingContext.load", "browsingContext.load"],
        id="repeated-event",
    ),
])
async def test_unsubscribe_normalizes_event_names(
      bidi_session, subscribe_events, new_tab, wait_for_bidi_events, inline,
      subscription_events, events
):
    await subscribe_events(events=subscription_events)
    await bidi_session.session.unsubscribe(events=events)

    received_events = []

    async def on_event(method, _):
        received_events.append(method)

    remove_listener = bidi_session.add_event_listener(
        "browsingContext.load", on_event
    )

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )

    with pytest.raises(TimeoutException):
        await wait_for_bidi_events(received_events, 1, timeout=0.5)

    assert received_events == []
    remove_listener()


async def test_subscribe_to_module_unsubscribe_from_one_event(
      bidi_session, wait_for_event, wait_for_future_safe, new_tab, inline
):
    await bidi_session.session.subscribe(events=["browsingContext"])

    # Unsubscribe from one event
    await bidi_session.session.unsubscribe(
        events=["browsingContext.domContentLoaded"])

    # Track all received browsing context events in the events array
    events = []

    async def on_event(method, _):
        events.append(method)

    remove_listener_domContentLoaded = bidi_session.add_event_listener(
        "browsingContext.domContentLoaded", on_event
    )
    remove_listener_load = bidi_session.add_event_listener(
        "browsingContext.load", on_event
    )

    # Wait for the last event
    on_entry_added = wait_for_event("browsingContext.load")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )
    await wait_for_future_safe(on_entry_added)

    # Make sure we didn't receive browsingContext.domContentLoaded event
    assert len(events) == 1
    assert "browsingContext.domContentLoaded" not in events

    remove_listener_domContentLoaded()
    remove_listener_load()

    # Unsubscribe from the rest of the events
    await bidi_session.session.unsubscribe(events=["browsingContext.load"])
