import asyncio
from typing import Any, Callable, Mapping, Optional

import pytest
import webdriver
from webdriver.bidi.modules.script import ContextTarget

CONTEXT_LOAD_EVENT = "browsingContext.load"

@pytest.fixture
async def new_tab(bidi_session, wait_for_event):
    """Open and focus a new tab to run the test in a foreground tab."""

    # Subscribe to the load event to wait for the newly created tab to be loaded.
    await bidi_session.session.subscribe(events=[CONTEXT_LOAD_EVENT])
    new_tab = await bidi_session.browsing_context.create(type_hint='tab')
    await wait_for_event(CONTEXT_LOAD_EVENT,
                         lambda data: data["context"] == new_tab["context"])
    await bidi_session.session.unsubscribe(events=[CONTEXT_LOAD_EVENT])
    yield new_tab
    # Close the tab.
    await bidi_session.browsing_context.close(context=new_tab["context"])


@pytest.fixture
def send_blocking_command(bidi_session):
    """Send a blocking command that awaits until the BiDi response has been received."""
    async def send_blocking_command(command: str, params: Mapping[str, Any]) -> Mapping[str, Any]:
        future_response = await bidi_session.send_command(command, params)
        return await future_response
    return send_blocking_command


@pytest.fixture
def wait_for_event(bidi_session, event_loop):
    """Wait until the BiDi session emits an event and resolve  the event data."""
    def wait_for_event(event_name: str, filter: Callable[[Any], bool] = lambda _: True):
        future = event_loop.create_future()

        async def on_event(method, data):
            if not filter(data):
                return
            remove_listener()
            future.set_result(data)

        remove_listener = bidi_session.add_event_listener(event_name, on_event)

        return future
    return wait_for_event

@pytest.fixture
def current_time(bidi_session, top_context):
    """Get the current time stamp in ms from the remote end.

    This is required especially when tests are run on different devices like
    for Android, where it's not guaranteed that both machines are in sync.
    """
    async def _():
        result = await bidi_session.script.evaluate(
            expression="Date.now()",
            target=ContextTarget(top_context["context"]),
            await_promise=True)
        return result["value"]

    return _
