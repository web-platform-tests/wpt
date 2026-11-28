"""Helpers for testing when commands return relative to gesture recognisers.

User agents run touch input through gesture recognisers (tap, double-tap to
zoom, long press, pan, pinch) which decide which DOM events are fired and
when. These helpers build a page that records every relevant event with its
dispatch order and timestamp, so tests can compare what had been dispatched
when a command returned with what was dispatched eventually.

See https://github.com/w3c/webdriver/issues/1970.
"""

import json
import os
import sys
import time


# Variant id -> (content of <meta name=viewport>, or None for no meta; CSS
# applied to the root element). No specification ties the viewport meta to the
# tap delay or to double-tap to zoom, but user agents commonly use it to decide
# whether a page is zoomable by double tap. The touch-action variants are the
# specified way of turning double-tap to zoom off.
VIEWPORT_VARIANTS = {
    "none": (None, ""),
    "device-width": ("width=device-width", ""),
    "device-width-initial-scale-1": ("width=device-width, initial-scale=1", ""),
    "initial-scale-1": ("initial-scale=1", ""),
    "user-scalable-no": ("width=device-width, user-scalable=no", ""),
    "fixed-scale": ("width=device-width, minimum-scale=1, maximum-scale=1", ""),
    "touch-action-manipulation": (None, "touch-action: manipulation;"),
    "touch-action-none": (None, "touch-action: none;"),
}

RECORDED_EVENTS = [
    "pointerover", "pointerenter", "pointerdown", "pointermove", "pointerup",
    "pointercancel", "pointerout", "pointerleave",
    "touchstart", "touchmove", "touchend", "touchcancel",
    "mouseover", "mouseenter", "mousemove", "mousedown", "mouseup",
    "click", "dblclick", "contextmenu",
    "selectstart", "dragstart", "focus", "keydown",
]

# Gesture recogniser outcomes of a touch being held down: a context menu,
# drag initiation, or the user agent taking the stream over. (selectstart is
# deliberately not included: it is also the default action of mousedown, so
# any click on text fires it.)
LONG_PRESS_EVENTS = {
    "contextmenu", "pointercancel", "touchcancel", "dragstart",
}

TEXT = (
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod "
    "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim "
    "veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea "
    "commodo consequat."
)

# #target is a narrow block of small text, which is what double-tap to zoom
# zooms into. #target2 is far enough away from it that a tap on each isn't a
# double tap.
DEFAULT_BODY = f"""
<div id=target>{TEXT}</div>
<div id=target2>{TEXT}</div>
"""

RECORDER = """
<script>
window.allEvents = {
  events: [],
  touchEventsSupported: "ontouchend" in window,
};

function recordEvent(type, target, extra) {
  const record = {
    type,
    target: target === window ? "window" : (target.id || target.nodeName),
    t: performance.now(),
  };
  Object.assign(record, extra);
  allEvents.events.push(record);
  if (allEvents.logToConsole) {
    console.log("gesture " + JSON.stringify(record));
  }
}

for (const type of %s) {
  window.addEventListener(type, event => {
    const extra = {};
    if ("pointerType" in event) {
      extra.pointerType = event.pointerType;
      extra.pointerId = event.pointerId;
    }
    if (typeof event.detail === "number") {
      extra.detail = event.detail;
    }
    if (type === "pointerup" && navigator.userActivation) {
      extra.hasBeenActive = navigator.userActivation.hasBeenActive;
    }
    recordEvent(type, event.target, extra);
  }, {capture: true, passive: true});
}
</script>
""" % RECORDED_EVENTS


def gesture_page_source(variant, body=DEFAULT_BODY, extra_css="", script="",
                        log_to_console=False):
    """Return the markup of a page using the given viewport variant.

    :param variant: Key of ``VIEWPORT_VARIANTS``.
    :param body: Markup containing an element with id "target".
    :param extra_css: Additional CSS rules.
    :param script: Additional script, run after the event recorder is set up.
    :param log_to_console: Also log each recorded event with console.log, as
                           "gesture " followed by the record as JSON.
    """
    meta_content, root_css = VIEWPORT_VARIANTS[variant]
    meta = "" if meta_content is None else f'<meta name=viewport content="{meta_content}">'
    if log_to_console:
        script = "allEvents.logToConsole = true;\n" + script

    return f"""
        {meta}
        <style>
          :root {{ {root_css} }}
          body {{ margin: 0; }}
          #target, #target2 {{
            box-sizing: border-box;
            width: 300px;
            height: 120px;
            margin: 10px;
            overflow: hidden;
            font-size: 12px;
            background: #eee;
          }}
          #target2 {{ margin-top: 200px; }}
          {extra_css}
        </style>
        {body}
        {RECORDER}
        <script>{script}</script>
        """


def settle_time(configuration):
    """Return seconds to wait for any gesture recogniser to have resolved."""
    return 1.5 * configuration["timeout_multiplier"]


def long_press_pause(configuration):
    """Return a pause duration in ms past any long press threshold."""
    return int(1500 * configuration["timeout_multiplier"])


def find_index(events, type, target=None, nth=0):
    """Return the index of the nth event of type at target, or None."""
    count = 0
    for i, event in enumerate(events):
        if event["type"] == type and (target is None or event["target"] == target):
            if count == nth:
                return i
            count += 1
    return None


def count(events, type, target=None):
    return sum(1 for event in events
               if event["type"] == type and (target is None or event["target"] == target))


def dispatched_before(events, a, b):
    """Return whether event a was dispatched before event b.

    Each of a and b is a tuple of (type, target, nth). An event that was never
    dispatched is not before anything, and anything is before it.
    """
    index_a = find_index(events, *a)
    if index_a is None:
        return False
    index_b = find_index(events, *b)
    return index_b is None or index_a < index_b


def types(events, include=None):
    return [event["type"] for event in events
            if include is None or event["type"] in include]


def click_delay(events):
    """Return the time between the first pointerup and click in ms, or None."""
    up = find_index(events, "pointerup")
    click = find_index(events, "click")
    if up is None or click is None:
        return None
    return events[click]["t"] - events[up]["t"]


# Expression that is true once the page from gesture_page_source has loaded.
PAGE_LOADED_EXPRESSION = "!!window.allEvents && !!document.getElementById('target')"

# Expression giving the page's own view of what it is, as a JSON string, for
# diagnosing a page that didn't load as expected.
PAGE_DIAGNOSTICS_EXPRESSION = """JSON.stringify((() => {
  const attempt = f => { try { return f(); } catch (e) { return "error: " + e; } };
  return {
    "document.location.href": attempt(() => document.location.href),
    "document.URL": attempt(() => document.URL),
    "window.top.location.href": attempt(() => window.top.location.href),
    readyState: attempt(() => document.readyState),
    title: attempt(() => document.title),
    outerHTML: attempt(() => document.documentElement.outerHTML.slice(0, 300)),
  };
})())"""


def page_not_loaded_message(requested_url, webdriver_url, page_info, handles=None):
    """Return a message for a gesture page that didn't load as expected."""
    lines = [
        "gesture page not loaded",
        f"requested url: {requested_url[:200]}",
        f"WebDriver url: {webdriver_url}",
    ]
    lines += [f"{key}: {value}" for key, value in page_info.items()]
    if handles is not None:
        lines.append(f"window handles: {handles}")
    return "\n".join(lines)


def slow_handler_script(event_types, ms=150, once=False):
    """Return script making a page block its main thread when events fire.

    Adds capture listeners that busy-wait for ``ms`` milliseconds, so what a
    user agent does after dispatching the event (such as a gesture
    recogniser's follow-up event) is held up that long. Used to tell remote
    ends that wait for such follow-up events from those that don't.

    :param event_types: Event types to block on, e.g. ["pointerup", "touchend"].
    :param once: Only block the first time each type fires.
    """
    return f"""
    for (const type of {json.dumps(list(event_types))}) {{
      window.addEventListener(type, () => {{
        const end = performance.now() + {ms};
        while (performance.now() < end) {{}}
        recordEvent("slow-handler-done:" + type, window, {{}});
      }}, {{capture: true, passive: true, once: {json.dumps(once)}}});
    }}
    """


def command_timeout(configuration):
    """Return seconds after which a command is considered to have hung."""
    return 10 * configuration["timeout_multiplier"]


# Seconds after which a read of the page's state is considered to have hung.
READ_TIMEOUT = 10

# Number of round trips used to estimate the offset between the page's
# performance.now() and the runner's monotonic clock. The first is discarded
# as a warm-up.
SYNC_SAMPLES = 9


def estimate_offset(samples):
    """Estimate the offset between the page clock and the runner clock.

    Like NTP, this picks the sample with the shortest round trip, as it's the
    least likely to have been queued, so its midpoint is the best estimate of
    when the page read its clock.

    :param samples: List of (runner time at send in ns, page performance.now()
                    in ms, runner time at receive in ns), both ns values from
                    ``time.monotonic_ns()``.
    :returns: Dict with offset_ms (page time minus runner time, so runner time
              of an event is its page time minus this), rtt_ms (shortest round
              trip, the error bound of the offset is half of it), rtt_median_ms
              and spread_ms (range of the offsets of all samples).
    """
    estimates = []
    for sent_ns, page_ms, received_ns in samples:
        midpoint_ms = (sent_ns + received_ns) / 2 / 1e6
        estimates.append((received_ns - sent_ns, page_ms - midpoint_ms))
    rtts = sorted(rtt for rtt, _ in estimates)
    offsets = [offset for _, offset in estimates]
    best_rtt, best_offset = min(estimates)
    return {
        "offset_ms": round(best_offset, 3),
        "rtt_ms": round(best_rtt / 1e6, 3),
        "rtt_median_ms": round(rtts[len(rtts) // 2] / 1e6, 3),
        "spread_ms": round(max(offsets) - min(offsets), 3),
    }


def annotate(events, sync, returned_ns):
    """Return copies of events with rel_ms, their time relative to the return.

    Negative means before the command returned. Only meaningful to within half
    of ``sync["rtt_ms"]`` (and the page clock's resolution).

    :param events: Events with ``t`` set to the page's performance.now().
    :param sync: Result of ``estimate_offset``.
    :param returned_ns: ``time.monotonic_ns()`` when the command returned.
    """
    returned_ms = returned_ns / 1e6
    return [dict(event, rel_ms=round(event["t"] - sync["offset_ms"] - returned_ms, 1))
            for event in events]


def _tag(event):
    pointer_type = event.get("pointerType")
    suffix = f"({pointer_type})" if pointer_type not in (None, "touch") else ""
    rel = event.get("rel_ms")
    when = "" if rel is None else f"@{rel:+.0f}"
    return event["type"] + suffix + when


def summary(at_return, eventually=None, duration=None, **extra):
    """Return a one line summary of the observed events.

    If the events have rel_ms, each is followed by @ and its time in ms
    relative to the command's return.
    """
    events = eventually if eventually is not None else at_return
    parts = []
    if duration is not None:
        parts.append(f"took {duration * 1000:.0f}ms")
    delay = click_delay(events)
    parts.append("click-pointerup " + ("-" if delay is None else f"{delay:.0f}ms"))
    gap = tap_gap(events)
    if gap is not None:
        parts.append(f"tap gap {gap:.0f}ms")
    parts.append("at return: " + (",".join(_tag(e) for e in at_return) or "-"))
    after = events[len(at_return):]
    parts.append("after: " + (",".join(_tag(e) for e in after) or "-"))
    for key, value in extra.items():
        parts.append(f"{key} {value}")
    return "; ".join(parts)


def report(at_return, eventually=None, duration=None, **extra):
    """Report the observations as one "GESTURE-DATA" line, see ``emit_data``."""
    events = eventually if eventually is not None else at_return

    def trim(event):
        return {key: round(value, 1) if key == "t" else value
                for key, value in event.items()}

    emit_data({
        "test": os.environ.get("PYTEST_CURRENT_TEST", "").split(" ")[0],
        "duration_ms": None if duration is None else round(duration * 1000),
        "click_delay": click_delay(events),
        "tap_gap": tap_gap(events),
        "at_return_count": len(at_return),
        "events": [trim(e) for e in events],
        "summary": summary(at_return, eventually, duration),
        **extra,
    })


def emit_phase(name):
    """Emit a "GESTURE-DATA" line saying a step is about to start or has ended.

    The last one before a hang shows where it stopped.
    """
    emit_data({
        "phase": name,
        "test": os.environ.get("PYTEST_CURRENT_TEST", "").split(" ")[0],
        "time": round(time.time(), 3),
    })


def emit_data(payload):
    """Write ``payload`` to stdout as a "GESTURE-DATA" JSON line.

    wptrunner runs pytest with output capture off, so the line ends up in the
    log even if the test later fails or the file times out.
    """
    sys.stdout.write("GESTURE-DATA " + json.dumps(payload, default=str) + "\n")
    sys.stdout.flush()


def tap_gap(events):
    """Return ms between the first pointerup and the second pointerdown, or None.

    If this is within a user agent's double-tap window, the two taps may be
    recognised as a double tap; otherwise they can't be.
    """
    up = find_index(events, "pointerup")
    down = find_index(events, "pointerdown", nth=1)
    if up is None or down is None:
        return None
    return events[down]["t"] - events[up]["t"]


def describe(at_return, eventually=None, duration=None, **extra):
    """Describe the observed events, for use as an assertion message."""
    lines = [summary(at_return, eventually, duration, **extra)]
    events = eventually if eventually is not None else at_return
    lines.append(f"{len(at_return)} events at return:")
    for i, event in enumerate(events):
        if i == len(at_return):
            lines.append("after return:")
        details = ", ".join(f"{key}={value}" for key, value in event.items()
                            if key not in ("type", "target", "t"))
        lines.append(f"  {event['t']:9.1f} {event['type']} @{event['target']} {details}")

    return "\n".join(lines)
