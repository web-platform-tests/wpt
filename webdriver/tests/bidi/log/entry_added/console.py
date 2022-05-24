import math
import time

import pytest

from . import assert_console_entry


@pytest.mark.asyncio
@pytest.mark.parametrize("log_argument, expected_text", [
    ("'TEST'", "TEST"),
    ("'TWO', 'PARAMETERS'", "TWO PARAMETERS"),
    ("{}", "[object Object]"),
    ("['1', '2', '3']", "1,2,3"),
    ("null, undefined", "null undefined"),
], ids=[
    'single string',
    'two strings',
    'empty object',
    'array of strings',
    'null and undefined',
])
async def test_text_with_argument_variation(bidi_session,
                                            wait_for_event,
                                            log_argument,
                                            expected_text,
                                            top_context):
    await bidi_session.session.subscribe(events=["log.entryAdded"])

    on_entry_added = wait_for_event("log.entryAdded")

    await bidi_session.script.evaluate(
        expression=f"console.log({log_argument})",
        target=bidi_session.script.ContextTarget(top_context["context"]))

    event_data = await on_entry_added

    assert_console_entry(event_data, text=expected_text)


@pytest.mark.asyncio
@pytest.mark.parametrize("log_method, expected_level", [
    ("assert", "error"),
    ("debug", "debug"),
    ("error", "error"),
    ("info", "info"),
    ("log", "info"),
    ("table", "info"),
    ("trace", "debug"),
    ("warn", "warning"),
])
async def test_level(bidi_session,
                     wait_for_event,
                     top_context,
                     log_method,
                     expected_level):
    await bidi_session.session.subscribe(events=["log.entryAdded"])

    on_entry_added = wait_for_event("log.entryAdded")

    if log_method == 'assert':
        # assert has to be called with a first falsy argument to trigger a log.
        await bidi_session.script.evaluate(
            expression="console.assert(false, 'foo')",
            target=bidi_session.script.ContextTarget(top_context["context"]))
    else:
        await bidi_session.script.evaluate(
            expression=f"console.{log_method}('foo')",
            target=bidi_session.script.ContextTarget(top_context["context"]))

    event_data = await on_entry_added

    assert_console_entry(event_data, text="foo", level=expected_level, method=log_method)


@pytest.mark.asyncio
async def test_timestamp(bidi_session, current_time, wait_for_event, top_context):
    await bidi_session.session.subscribe(events=["log.entryAdded"])

    on_entry_added = wait_for_event("log.entryAdded")

    time_start = current_time()

    await bidi_session.script.evaluate(
        expression="""
            const resolve = arguments[0];
            setTimeout(() => {
                console.log('foo');
                resolve();
            }, 100);
        """,
        target=bidi_session.script.ContextTarget(top_context["context"]))

    event_data = await on_entry_added

    time_end = current_time()

    assert_console_entry(event_data, text="foo", time_start=time_start, time_end=time_end)


@pytest.mark.asyncio
@pytest.mark.parametrize("new_context_method_name", ["refresh", "new_window"])
async def test_new_context(bidi_session,
                           current_session,
                           wait_for_event,
                           new_context_method_name,
                           top_context):
    await bidi_session.session.subscribe(events=["log.entryAdded"])

    on_entry_added = wait_for_event("log.entryAdded")
    await bidi_session.script.evaluate(
        expression="console.log('foo')",
        target=bidi_session.script.ContextTarget(top_context["context"]))
    event_data = await on_entry_added
    assert_console_entry(event_data, text="foo")

    new_context_method = getattr(current_session, new_context_method_name)
    new_context_method()

    on_entry_added = wait_for_event("log.entryAdded")
    await bidi_session.script.evaluate(
        expression="console.log('foo_after_refresh')",
        target=bidi_session.script.ContextTarget(top_context["context"]))
    event_data = await on_entry_added
    assert_console_entry(event_data, text="foo_after_refresh")
