import asyncio
from typing import Any, Mapping

import pytest
import webdriver


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
    def wait_for_event(event_name: str):
        future = event_loop.create_future()

        async def on_event(method, data):
            remove_listener()
            future.set_result(data)

        remove_listener = bidi_session.add_event_listener(event_name, on_event)

        return future
    return wait_for_event


@pytest.fixture
async def context_id(send_blocking_command):
    """Returns an `id` of an open context."""
    response = await send_blocking_command("browsingContext.getTree", {})
    if len(response['contexts']) < 1:
        raise "No open contexts"
    else:
        return response['contexts'][0]['context']


@pytest.fixture
def recursive_compare():
    """Compares 2 objects recursively ignoring values of specific attributes."""
    def recursive_compare(expected, actual, ignore_attributes):
        assert type(expected) == type(actual)
        if type(expected) is list:
            assert len(expected) == len(actual)
            for index, val in enumerate(expected):
                recursive_compare(expected[index], actual[index], ignore_attributes)
            return

        if type(expected) is dict:
            assert expected.keys() == actual.keys()
            for index, val in enumerate(expected):
                if val not in ignore_attributes:
                    recursive_compare(expected[val], actual[val], ignore_attributes)
            return

        assert expected == actual
    return recursive_compare