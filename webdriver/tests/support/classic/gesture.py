"""WebDriver Classic helpers for testing gesture recognisers.

See tests.support.gesture.
"""

import json
import socket
import time

from webdriver.error import ScriptTimeoutException

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


def execute(session, script, timeout=READ_TIMEOUT):
    """Execute a script, failing the test with data if the remote end hangs.

    ``execute_script`` has no timeout, so a stuck remote end would otherwise
    hang until the whole file times out and loses its results. A
    ``ScriptTimeoutException`` (seen mid-test in Chrome on Android) is retried
    once, with a note in the data.
    """
    for attempt in range(2):
        try:
            return session.send_session_command(
                "POST", "execute/sync", {"script": script, "args": []}, timeout=timeout)
        except ScriptTimeoutException:
            if attempt == 1:
                raise
            emit_data({"note": "script-timeout-retried", "script": script[:100]})
        except (socket.timeout, TimeoutError):
            emit_data({"error": "read-timeout", "script": script[:100], "timeout": timeout})
            assert False, f"script did not return within {timeout}s: {script[:100]}"


def flush_stale_input(session):
    """Send an unmatched touch pointerUp, then a key press.

    Release Actions doesn't release a touch that is down in some WebKit-based
    remote ends (https://bugs.webkit.org/show_bug.cgi?id=213060), and the
    release may only be delivered when later input arrives, so the key press
    is there to make sure some input does. Best effort: failures are reported
    as data, not raised. See also ac1d3f13bec.
    """
    touch = session.actions.sequence("pointer", "pointer_id", {"pointerType": "touch"})
    touch.pointer_move(1, 1).pointer_up()
    key = session.actions.sequence("key", "flush_key_id")
    key.pause(0).pause(0).key_down("a").key_up("a")
    emit_phase("flush-start")
    try:
        session.send_session_command(
            "POST", "actions", {"actions": [touch.dict, key.dict]}, timeout=10)
        emit_phase("flush-done")
    except Exception as e:
        emit_data({"note": "flush-failed", "exception": repr(e)})


def load_gesture_page(session, inline, variant, body=DEFAULT_BODY,
                      extra_css="", script=""):
    """Load a page using the given viewport variant and return #target.

    See ``tests.support.gesture.gesture_page_source`` for the parameters.
    """
    url = inline(gesture_page_source(variant, body, extra_css, script))
    # Release anything a previous test left down, while the document that
    # received it is still current, so it doesn't reach the new page.
    flush_stale_input(session)
    session.url = url

    # Navigate To should only return once the page has loaded, but some remote
    # ends return while the old document is still current, so poll.
    start = time.monotonic()
    loaded = False
    while time.monotonic() - start < 10:
        try:
            if execute(session, f"return {PAGE_LOADED_EXPRESSION};"):
                loaded = True
                break
        except ScriptTimeoutException:
            # Seen on the first test of a session in Chrome on Android, while
            # the navigation is still in progress.
            emit_data({"note": "load-poll-script-timeout"})
        time.sleep(0.05)
    waited = round((time.monotonic() - start) * 1000)

    if not loaded:
        page_info = json.loads(execute(session, f"return {PAGE_DIAGNOSTICS_EXPRESSION};"))
        message = page_not_loaded_message(
            url, session.url, page_info,
            handles=f"{session.handles}, current {session.window_handle}")
        emit_data({"error": "page-not-loaded", "waited_ms": waited, "message": message})
        assert False, message
    if waited > 0:
        emit_data({"note": "page-loaded-late", "waited_ms": waited})

    return session.find.css("#target", all=False)


def get_events(session):
    return execute(session, "return window.allEvents.events;")


def touch_events_supported(session):
    return execute(session, "return window.allEvents.touchEventsSupported;")


def visual_scale(session):
    return execute(session, "return window.visualViewport ? visualViewport.scale : 1;")


def sync_clock(session):
    """Estimate the offset between the page's clock and this process's.

    See ``tests.support.gesture.estimate_offset``. Must be called on the
    document whose events are being timed, as performance.now() restarts for
    each document.
    """
    samples = []
    for i in range(SYNC_SAMPLES + 1):
        sent_ns = time.monotonic_ns()
        page_ms = execute(session, "return performance.now();")
        received_ns = time.monotonic_ns()
        if i > 0:  # The first is a warm-up.
            samples.append((sent_ns, page_ms, received_ns))
    return estimate_offset(samples)


def bounded_command(session, configuration, method, uri, body):
    """Send a session command, failing the test with data if it hangs."""
    timeout = command_timeout(configuration)
    emit_phase(f"command-start {method} {uri}")
    try:
        result = session.send_session_command(method, uri, body, timeout=timeout)
        emit_phase(f"command-returned {method} {uri}")
        return result
    except (socket.timeout, TimeoutError):
        # Don't read events: a remote end that hung on this command may hang
        # on the next one too, and the data line must get out first.
        emit_data({"error": "command-timeout", "uri": uri, "timeout": timeout})
        assert False, f"{method} {uri} did not return within {timeout}s"


def perform_actions(session, configuration, sequences):
    """Perform Actions with the action sequences as dicts, bounded in time."""
    return bounded_command(
        session, configuration, "POST", "actions", {"actions": sequences})


def element_click(session, configuration, element):
    """Element Click, bounded in time."""
    return bounded_command(
        session, configuration, "POST", f"element/{element.id}/click", {})


def observe(session, configuration, perform):
    """Run ``perform`` and record events at its return and once settled.

    The events at return are read with an extra command, so they may include
    events dispatched up to one round trip after the command returned. Each
    event also has ``rel_ms``, its time relative to the return of ``perform``
    (see ``tests.support.gesture.annotate``). Prints a "GESTURE-DATA" line, see
    ``tests.support.gesture.report``.

    :returns: Tuple of (events at return, events once settled, duration of
              ``perform`` in seconds).
    """
    sync_before = sync_clock(session)
    emit_phase("perform-start")
    start = time.monotonic()
    try:
        perform()
    except Exception as e:
        # After a timeout the remote end may hang on further commands.
        events = None
        if not isinstance(e, AssertionError):
            try:
                events = get_events(session)
            except Exception as e2:
                events = f"unavailable: {e2!r}"
        emit_data({"error": "perform-raised", "exception": repr(e),
                   "after_ms": round((time.monotonic() - start) * 1000),
                   "events": events})
        raise
    returned_ns = time.monotonic_ns()
    duration = time.monotonic() - start
    emit_phase("perform-returned")

    at_return = get_events(session)
    emit_phase("read-at-return-done")
    time.sleep(settle_time(configuration))
    eventually = get_events(session)
    emit_phase("read-eventually-done")
    sync_after = sync_clock(session)

    # Use the sync with the shorter round trip, and report the drift between
    # them as a check on the estimate.
    sync = min(sync_before, sync_after, key=lambda s: s["rtt_ms"])
    sync = dict(sync, drift_ms=round(sync_after["offset_ms"] - sync_before["offset_ms"], 3))
    at_return = annotate(at_return, sync, returned_ns)
    eventually = annotate(eventually, sync, returned_ns)

    report(at_return, eventually, duration, sync=sync)
    return at_return, eventually, duration
