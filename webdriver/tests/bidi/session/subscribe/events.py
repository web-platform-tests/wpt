import pytest
from webdriver.error import TimeoutException

pytestmark = pytest.mark.asyncio


# The basic use case of subscribing globally for a single event
# is covered by tests for each event in the dedicated folders.


async def test_subscribe_to_module(bidi_session, subscribe_events, new_tab,
      wait_for_event, wait_for_future_safe, inline):
    # Subscribe to all browsing context events
    await subscribe_events(events=["browsingContext"])

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
    on_context_load = wait_for_event("browsingContext.load")

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )

    await wait_for_future_safe(on_context_load)

    # 2 events are expected:
    # * `browsingContext.domContentLoaded`
    # * `browsingContext.load`
    assert len(events) == 2

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
async def test_subscribe_to_known_event_or_module(subscribe_events, event):
    await subscribe_events(events=[event])


async def test_subscribe_to_events_from_multiple_modules(
      bidi_session, subscribe_events, new_tab, wait_for_event,
      wait_for_future_safe, inline
):
    await subscribe_events(events=[
        "browsingContext.historyUpdated",
        "browsingContext.load",
        "network.beforeRequestSent",
    ])

    on_context_load = wait_for_event("browsingContext.load")

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )

    await wait_for_future_safe(on_context_load)


@pytest.mark.parametrize("events", [
    pytest.param(
        ["browsingContext", "browsingContext.load"],
        id="module-then-event",
    ),
    pytest.param(
        ["browsingContext.load", "browsingContext"],
        id="event-then-module",
    ),
    pytest.param(
        ["browsingContext.load", "browsingContext.load"],
        id="repeated-event",
    ),
])
async def test_subscribe_normalizes_event_names(
      bidi_session, subscribe_events, new_tab, wait_for_bidi_events, inline,
      events
):
    target_url = inline("")
    received_events = []

    async def on_event(method, data):
        if (data["context"] == new_tab["context"] and
                data["url"] == target_url):
            received_events.append(method)

    remove_listener = bidi_session.add_event_listener(
        "browsingContext.load", on_event
    )

    await subscribe_events(events=events)
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=target_url
    )

    await wait_for_bidi_events(received_events, 1)
    with pytest.raises(TimeoutException):
        await wait_for_bidi_events(received_events, 2, timeout=0.5)

    assert received_events == ["browsingContext.load"]
    remove_listener()


async def test_subscribe_to_one_event_and_then_to_module(
      bidi_session, subscribe_events, wait_for_event, wait_for_future_safe,
      inline, new_tab
):
    # Subscribe to one event
    await subscribe_events(events=["browsingContext.domContentLoaded"])

    # Track all received browsing context events in the events array
    events = []

    async def on_event(method, data):
        events.append(method)

    remove_listener_domContentLoaded = bidi_session.add_event_listener(
        "browsingContext.domContentLoaded", on_event
    )

    on_entry_added = wait_for_event("browsingContext.domContentLoaded")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )
    await wait_for_future_safe(on_entry_added)

    assert len(events) == 1
    assert "browsingContext.domContentLoaded" in events

    # Subscribe to all browsing context events
    await subscribe_events(events=["browsingContext"])

    # Clean up the event list
    events = []

    remove_listener_load = bidi_session.add_event_listener(
        "browsingContext.load", on_event
    )

    # Wait for the last event
    on_entry_added = wait_for_event("browsingContext.load")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )
    await wait_for_future_safe(on_entry_added)

    # Make sure we didn't receive duplicates
    assert len(events) == 2

    remove_listener_domContentLoaded()
    remove_listener_load()


async def test_subscribe_to_module_and_then_to_one_event_again(
      bidi_session, subscribe_events, wait_for_event, wait_for_future_safe,
      new_tab, inline
):
    # Subscribe to all browsing context events
    await subscribe_events(events=["browsingContext"])

    # Track all received browsing context events in the events array
    events = []

    async def on_event(method, data):
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

    assert len(events) == 2

    # Subscribe to one event again
    await subscribe_events(events=["browsingContext.domContentLoaded"])

    # Clean up the event list
    events = []

    # Wait for the last event
    on_entry_added = wait_for_event("browsingContext.load")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline("")
    )
    await wait_for_future_safe(on_entry_added)

    # Make sure we didn't receive duplicates
    assert len(events) == 2

    remove_listener_domContentLoaded()
    remove_listener_load()
