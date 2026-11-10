# META: timeout=long
"""Tests that Element Click returns only once the click has been dispatched.

Element Click dispatches its pointerMove, pointerDown and pointerUp in a single
tick, waits for the event loop to process the DOM events that generated, and
then allows "any navigations triggered by the click" to start, which presumes
the click has happened. A user agent's gesture recognisers can delay the click
of a tap (e.g. while waiting to see if it is a double tap); Element Click must
still not return until the click has been dispatched. The specification doesn't
say so explicitly for a click delayed by a gesture recogniser, which is what
https://github.com/w3c/webdriver/issues/1970 asks about.

Element Click doesn't specify which pointer type it uses, so these tests don't
assume one.
"""

import pytest

from tests.support.classic.gesture import (
    element_click,
    load_gesture_page,
    observe,
)
from tests.support.gesture import (
    VIEWPORT_VARIANTS,
    count,
    describe,
)


CLICK_TIMEOUT_SCRIPT = """
document.getElementById("target").addEventListener("click", () => {
  setTimeout(() => recordEvent("click-timeout", window, {}), 0);
});
"""


@pytest.mark.parametrize("variant", VIEWPORT_VARIANTS)
def test_click_dispatched_before_return(
    session, inline, configuration, new_tab_classic, variant
):
    target = load_gesture_page(session, inline, variant, script=CLICK_TIMEOUT_SCRIPT)

    at_return, eventually, duration = observe(
        session, configuration, lambda: element_click(session, configuration, target))
    message = describe(at_return, eventually, duration)

    assert count(at_return, "pointerup", "target") == 1, message
    assert count(at_return, "click", "target") == 1, message
    # A single click is not a double click.
    assert count(eventually, "dblclick") == 0, message
    # Whether "click-timeout", a setTimeout(0) from the click handler, had run
    # by the time of return is recorded in the events but not asserted: it
    # races the read, and is a separate question (whether Element Click waits
    # for timers).


@pytest.mark.parametrize("variant", ["none", "device-width"])
def test_click_handler_navigation_waited_for(
    session, inline, url, configuration, new_tab_classic, variant
):
    link = "/webdriver/tests/classic/element_click/support/input.html"
    target = load_gesture_page(session, inline, variant, script=f"""
        document.getElementById("target").addEventListener("click", () => {{
          location.href = "{link}";
        }});
        """)

    element_click(session, configuration, target)

    assert session.url == url(link)


@pytest.mark.parametrize("variant", ["none", "device-width"])
def test_click_has_user_activation(session, inline, configuration, new_tab_classic, variant):
    target = load_gesture_page(session, inline, variant, script="""
        document.getElementById("target").addEventListener("click", () => {
          window.activeInClick = navigator.userActivation.isActive;
        });
        """)

    element_click(session, configuration, target)

    assert session.execute_script("return window.activeInClick") is True
