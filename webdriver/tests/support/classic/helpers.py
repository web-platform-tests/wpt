import math
import sys

import webdriver

from tests.support import defaults
from tests.support.helpers import is_wayland
from tests.support.sync import Poll


def ignore_exceptions(f):
    def inner(session, *args, **kwargs):
        # Do not try to clean up already ended session.
        if session.session_id is None:
            return
        try:
            return f(session, *args, **kwargs)
        except webdriver.error.WebDriverException as e:
            print("Ignored exception %s" % e, file=sys.stderr)
    inner.__name__ = f.__name__
    return inner


def cleanup_session(session):
    """Clean-up the current session for a clean state.

    It runs after every single subtest, so it sends as few commands as
    possible. The window size and position are not reset here, because the
    session fixtures enforce them before each test anyway.
    """
    @ignore_exceptions
    def _dismiss_user_prompt(session):
        """Dismiss the open user prompt in the current window, if any."""
        try:
            session.alert.dismiss()
        except webdriver.NoSuchAlertException:
            pass

    @ignore_exceptions
    def _close_window(session, window):
        """Dismiss the open user prompt in the given window, and close it."""
        session.window_handle = window
        # Closing a window with an open user prompt would fail.
        _dismiss_user_prompt(session)
        session.window.close()

    @ignore_exceptions
    def _restore_timeouts(session):
        """Restore modified timeouts to their default values."""
        # A single command for all the timeouts saves round-trips.
        session.send_session_command("POST", "timeouts", {
            "implicit": defaults.IMPLICIT_WAIT_TIMEOUT * 1000,
            "pageLoad": defaults.PAGE_LOAD_TIMEOUT * 1000,
            "script": defaults.SCRIPT_TIMEOUT * 1000,
        })

    @ignore_exceptions
    def _restore_windows(session):
        """Dismiss open user prompts and close superfluous windows opened
        by the test.

        The current window is kept, or the first remaining one if the
        current window was closed, so it will not end the session implicitly
        by closing the last window. Its top-level browsing context ends up
        selected.
        """
        # Query the window handles only once.
        handles = session.handles
        if not handles:
            return

        try:
            current_window = session.window_handle
        except webdriver.NoSuchWindowException:
            current_window = None

        if current_window in handles:
            window_to_keep = current_window
        else:
            # The current window was closed, so select the first remaining one.
            window_to_keep = handles[0]

        for window in handles:
            if window != window_to_keep:
                _close_window(session, window)

        # Switching to the window also selects its top-level browsing context,
        # and unlike switching frames it doesn't fail for open user prompts.
        session.window_handle = window_to_keep
        _dismiss_user_prompt(session)

    _restore_timeouts(session)
    _restore_windows(session)


def set_default_window_rect(session):
    """Set the default window size and position with a single command."""
    width, height = defaults.WINDOW_SIZE
    x, y = defaults.WINDOW_POSITION
    try:
        session.window.rect = {"x": x, "y": y, "width": width, "height": height}
    except (webdriver.UnknownErrorException, webdriver.InvalidArgumentException):
        # Silently ignore this error as the command is not implemented for
        # Android, the same way the window `size` and `position` setters do.
        pass


def document_dimensions(session):
    return tuple(session.execute_script("""
        const {devicePixelRatio} = window;
        const {width, height} = document.documentElement.getBoundingClientRect();
        return [width * devicePixelRatio, height * devicePixelRatio];
        """))


def center_point(element):
    """Calculates the in-view center point of a web element."""
    inner_width, inner_height = element.session.execute_script(
        "return [window.innerWidth, window.innerHeight]")
    rect = element.rect

    # calculate the intersection of the rect that is inside the viewport
    visible = {
        "left": max(0, min(rect["x"], rect["x"] + rect["width"])),
        "right": min(inner_width, max(rect["x"], rect["x"] + rect["width"])),
        "top": max(0, min(rect["y"], rect["y"] + rect["height"])),
        "bottom": min(inner_height, max(rect["y"], rect["y"] + rect["height"])),
    }

    # arrive at the centre point of the visible rectangle
    x = (visible["left"] + visible["right"]) / 2.0
    y = (visible["top"] + visible["bottom"]) / 2.0

    # convert to CSS pixels, as centre point can be float
    return (math.floor(x), math.floor(y))


def document_hidden(session):
    return session.execute_script("return document.hidden")


def document_location(session):
    """
    Unlike ``webdriver.Session#url``, which always returns
    the top-level browsing context's URL, this returns
    the current browsing context's active document's URL.
    """
    return session.execute_script("return document.location.href")


def element_rect(session, element):
    return session.execute_script("""
        let element = arguments[0];
        let rect = element.getBoundingClientRect();

        return {
            x: rect.left + window.pageXOffset,
            y: rect.top + window.pageYOffset,
            width: rect.width,
            height: rect.height,
        };
        """, args=(element,))


def is_element_in_viewport(session, element):
    """Check if element is outside of the viewport"""
    return session.execute_script("""
        let el = arguments[0];

        let rect = el.getBoundingClientRect();
        let viewport = {
          height: window.innerHeight || document.documentElement.clientHeight,
          width: window.innerWidth || document.documentElement.clientWidth,
        };

        return !(rect.right < 0 || rect.bottom < 0 ||
            rect.left > viewport.width || rect.top > viewport.height)
    """, args=(element,))


def is_fullscreen(session):
    # At the time of writing, WebKit does not conform to the
    # Fullscreen API specification.
    #
    # Remove the prefixed fallback when
    # https://bugs.webkit.org/show_bug.cgi?id=158125 is fixed.
    return session.execute_script("""
        return !!(window.fullScreen || document.webkitIsFullScreen)
        """)


def _get_maximized_state(session):
    dimensions = session.execute_script("""
        return {
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            windowWidth: window.outerWidth,
            windowHeight: window.outerHeight,
        }
        """)

    # The maximized window can still have a border attached which would
    # cause its dimensions to exceed the whole available screen.
    return (dimensions["windowWidth"] >= dimensions["availWidth"] and
        dimensions["windowHeight"] >= dimensions["availHeight"] and
        # Only return true if the window is not in fullscreen mode
        not is_fullscreen(session)
    )


def is_maximized(session, original_rect):
    if _get_maximized_state(session):
        return True

    # Wayland doesn't guarantee that the window will get maximized
    # to the screen, so check if the dimensions got larger.
    elif is_wayland():
        dimensions = session.execute_script("""
            return {
                windowWidth: window.outerWidth,
                windowHeight: window.outerHeight,
            }
            """)
        return (
            dimensions["windowWidth"] > original_rect["width"] and
            dimensions["windowHeight"] > original_rect["height"] and
            # Only return true if the window is not in fullscreen mode
            not is_fullscreen(session)
        )
    else:
        return False


def is_not_maximized(session):
    return not _get_maximized_state(session)


def wait_for_new_handle(session, handles_before):
    def find_new_handle(session):
        new_handles = list(set(session.handles) - set(handles_before))
        assert len(new_handles) == 1, "No new window was opened"
        return new_handles[0]

    wait = Poll(session, timeout=5)
    return wait.until(find_new_handle)
