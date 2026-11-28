"""WebDriver BiDi helpers for testing gesture recognisers.

Each recorded event is also logged to the console, so its log.entryAdded event
is sent to the client as soon as the remote end processes it. Comparing those
with the command response shows which events had been dispatched when the
command finished, without the extra round trip a separate script evaluation
needs. See tests.support.gesture.
"""

import asyncio
import json
import time

from webdriver.bidi.modules.input import Actions
from webdriver.bidi.modules.script import ContextTarget

from tests.support.gesture import (
    DEFAULT_BODY,
    PAGE_DIAGNOSTICS_EXPRESSION,
    PAGE_LOADED_EXPRESSION,
    READ_TIMEOUT,
    SYNC_SAMPLES,
    annotate,
    command_timeout,
    emit_data,
    emit_phase,
    estimate_offset,
    gesture_page_source,
    page_not_loaded_message,
    report,
    settle_time,
)


LOG_PREFIX = "gesture "


async def bounded(awaitable, what):
    """Await a read of the page, failing the test with data if it hangs."""
    try:
        return await asyncio.wait_for(awaitable, READ_TIMEOUT)
    except asyncio.TimeoutError:
        emit_data({"error": "read-timeout", "what": what[:100], "timeout": READ_TIMEOUT})
        assert False, f"{what[:100]} did not return within {READ_TIMEOUT}s"


async def get_element(bidi_session, context, selector):
    return await bounded(
        bidi_session.script.evaluate(
            expression=f"document.querySelector({json.dumps(selector)})",
            target=ContextTarget(context["context"]),
            await_promise=False,
        ),
        f"querySelector {selector}")


async def flush_stale_input(bidi_session, context):
    """Send an unmatched touch pointerUp, then a key press.

    releaseActions doesn't release a touch that is down in some WebKit-based
    remote ends (https://bugs.webkit.org/show_bug.cgi?id=213060), and the
    release may only be delivered when later input arrives, so the key press
    is there to make sure some input does. Best effort: failures are reported
    as data, not raised. See also ac1d3f13bec.
    """
    actions = Actions()
    actions.add_pointer(pointer_type="touch").pointer_move(1, 1).pointer_up(button=0)
    actions.add_key().pause().pause().key_down("a").key_up("a")
    emit_phase("flush-start")
    try:
        await asyncio.wait_for(
            bidi_session.input.perform_actions(
                actions=actions, context=context["context"]), 10)
        emit_phase("flush-done")
    except Exception as e:
        emit_data({"note": "flush-failed", "exception": repr(e)})


async def load_gesture_page(bidi_session, context, inline, variant,
                            body=DEFAULT_BODY, extra_css="", script=""):
    """Load a page using the given viewport variant and return #target.

    See ``tests.support.gesture.gesture_page_source`` for the parameters.
    """
    url = inline(gesture_page_source(variant, body, extra_css, script,
                                     log_to_console=True))
    # Release anything a previous test left down, while the document that
    # received it is still current, so it doesn't reach the new page.
    await flush_stale_input(bidi_session, context)
    await bidi_session.browsing_context.navigate(
        context=context["context"], url=url, wait="complete")

    # With wait="complete" the page should be loaded already, but poll in case
    # the remote end returned while the old document was still current.
    start = time.monotonic()
    loaded = False
    while time.monotonic() - start < 10:
        if await evaluate(bidi_session, context, PAGE_LOADED_EXPRESSION):
            loaded = True
            break
        await asyncio.sleep(0.05)
    waited = round((time.monotonic() - start) * 1000)

    if not loaded:
        page_info = json.loads(await evaluate_raw(
            bidi_session, context, PAGE_DIAGNOSTICS_EXPRESSION))
        tree = await bidi_session.browsing_context.get_tree()
        message = page_not_loaded_message(
            url, page_info.get("document.URL"), page_info,
            handles=f"{[c['context'] for c in tree]}, current {context['context']}")
        emit_data({"error": "page-not-loaded", "waited_ms": waited, "message": message})
        assert False, message
    if waited > 0:
        emit_data({"note": "page-loaded-late", "waited_ms": waited})

    return await get_element(bidi_session, context, "#target")


async def evaluate_raw(bidi_session, context, expression):
    """Evaluate an expression and return its string value."""
    result = await bounded(
        bidi_session.script.evaluate(
            expression=expression,
            target=ContextTarget(context["context"]),
            await_promise=False,
        ),
        expression)
    return result["value"]


async def evaluate(bidi_session, context, expression):
    result = await bounded(
        bidi_session.script.evaluate(
            expression=f"JSON.stringify({expression})",
            target=ContextTarget(context["context"]),
            await_promise=False,
        ),
        expression)
    return json.loads(result["value"])


async def get_events(bidi_session, context):
    return await evaluate(bidi_session, context, "window.allEvents.events")


async def touch_events_supported(bidi_session, context):
    return await evaluate(bidi_session, context, "window.allEvents.touchEventsSupported")


async def visual_scale(bidi_session, context):
    return await evaluate(
        bidi_session, context, "window.visualViewport ? visualViewport.scale : 1")


async def sync_clock(bidi_session, context):
    """Estimate the offset between the page's clock and this process's.

    See ``tests.support.gesture.estimate_offset``. Must be called on the
    document whose events are being timed.
    """
    samples = []
    for i in range(SYNC_SAMPLES + 1):
        sent_ns = time.monotonic_ns()
        page_ms = await evaluate(bidi_session, context, "performance.now()")
        received_ns = time.monotonic_ns()
        if i > 0:  # The first is a warm-up.
            samples.append((sent_ns, page_ms, received_ns))
    return estimate_offset(samples)


async def observe(bidi_session, context, configuration, perform):
    """Await ``perform()`` and record events at its response and once settled.

    The client creates a task for each event listener call when the event is
    received, before resolving the command whose response follows it. As the
    listener here never awaits, it has run for every event received before the
    response by the time ``perform()`` resumes. Requires a subscription to
    log.entryAdded.

    Each event also has ``rel_ms``, its time relative to the response (see
    ``tests.support.gesture.annotate``); those from log.entryAdded also have
    ``delivery_ms``, how long after the event the runner received its log
    entry, which shows how weak the lower bound is.

    :returns: Tuple of (events logged before the response, events read with
              a script evaluation after the response, events once settled,
              duration of ``perform()`` in seconds). The first is a lower
              bound of what had been dispatched at the response, the second
              an upper bound.
    """
    logged = []
    arrivals_ns = []

    async def on_entry(method, data):
        text = data.get("text") or ""
        if text.startswith(LOG_PREFIX):
            logged.append(json.loads(text[len(LOG_PREFIX):]))
            arrivals_ns.append(time.monotonic_ns())

    remove_listener = bidi_session.add_event_listener("log.entryAdded", on_entry)
    try:
        sync_before = await sync_clock(bidi_session, context)
        emit_phase("perform-start")
        start = time.monotonic()
        timeout = command_timeout(configuration)
        try:
            await asyncio.wait_for(perform(), timeout)
        except asyncio.TimeoutError:
            events = await get_events(bidi_session, context)
            emit_data({"error": "command-timeout", "logged": logged, "events": events})
            assert False, (f"command did not return within {timeout}s; "
                           f"logged: {logged}; events: {events}")
        returned_ns = time.monotonic_ns()
        duration = time.monotonic() - start
        at_response = list(logged)
        at_response_arrivals_ns = list(arrivals_ns)
        emit_phase("perform-returned")

        read_after_response = await get_events(bidi_session, context)
        emit_phase("read-after-response-done")
        await asyncio.sleep(settle_time(configuration))
        eventually = await get_events(bidi_session, context)
        emit_phase("read-eventually-done")
        sync_after = await sync_clock(bidi_session, context)
    finally:
        remove_listener()

    sync = min(sync_before, sync_after, key=lambda s: s["rtt_ms"])
    sync = dict(sync, drift_ms=round(sync_after["offset_ms"] - sync_before["offset_ms"], 3))
    at_response = annotate(at_response, sync, returned_ns)
    for event, arrival_ns in zip(at_response, at_response_arrivals_ns):
        event["delivery_ms"] = round(
            (arrival_ns - returned_ns) / 1e6 - event["rel_ms"], 1)
    read_after_response = annotate(read_after_response, sync, returned_ns)
    eventually = annotate(eventually, sync, returned_ns)

    report(at_response, eventually, duration, sync=sync,
           read_after_response_count=len(read_after_response))
    return at_response, read_after_response, eventually, duration
