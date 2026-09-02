# mypy: allow-untyped-defs

import copy
import sys

import pytest_asyncio
import webdriver

import tests.support.fixtures as global_fixtures
from tests.support import defaults
from tests.support.helpers import deep_update

SCRIPT_TIMEOUT = 1
PAGE_LOAD_TIMEOUT = 3
IMPLICIT_WAIT_TIMEOUT = 0


@pytest_asyncio.fixture(scope="function")
async def session(capabilities, configuration):
    """Create and start a session for a test that does not itself test session creation.

    By default the session will stay open after each test, but we always try to start a
    new one and assume that if that fails there is already a valid session. This makes it
    possible to recover from some errors that might leave the session in a bad state, but
    does not demand that we start a new session per test.
    """
    # Update configuration capabilities with custom ones from the
    # capabilities fixture, which can be set by tests
    caps = copy.deepcopy(configuration["capabilities"])
    deep_update(caps, capabilities)
    caps = {"alwaysMatch": caps}

    await global_fixtures.reset_current_session_if_necessary(caps)

    if global_fixtures.get_current_session() is None:
        global_fixtures.set_current_session(webdriver.Session(
            configuration["host"],
            configuration["port"],
            capabilities=caps))

    try:
        session = global_fixtures.get_current_session()
        session.start()

        # Enforce a fixed default window size and position
        if session.capabilities.get("setWindowRect"):
            session.window.size = defaults.WINDOW_SIZE
            session.window.position = defaults.WINDOW_POSITION

        # Set default timeouts
        multiplier = configuration["timeout_multiplier"]
        session.timeouts.implicit = IMPLICIT_WAIT_TIMEOUT * multiplier
        session.timeouts.page_load = PAGE_LOAD_TIMEOUT * multiplier
        session.timeouts.script = SCRIPT_TIMEOUT * multiplier

        yield session

        cleanup_session(session)

    except Exception:
        # Make sure we end up in a known state if something goes wrong.
        global_fixtures.get_current_session().end()
        raise


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


@ignore_exceptions
def _switch_to_top_level_browsing_context(session):
    """If the current browsing context selected by WebDriver is a
    `<frame>` or an `<iframe>`, switch it back to the top-level
    browsing context.
    """
    session.switch_to_frame(None)


def _windows(session, exclude=None):
    """Set of window handles, filtered by an `exclude` list if
    provided.
    """
    if exclude is None:
        exclude = []
    wins = [w for w in session.handles if w not in exclude]
    return set(wins)


def cleanup_session(session):
    """Clean-up the current session for a clean state."""
    @ignore_exceptions
    def _dismiss_user_prompts(session):
        """Dismiss any open user prompts in windows."""
        current_window = session.window_handle

        for window in _windows(session):
            session.window_handle = window
            try:
                session.alert.dismiss()
            except webdriver.NoSuchAlertException:
                pass

        session.window_handle = current_window

    @ignore_exceptions
    def _ensure_valid_window(session):
        """If current window was closed, ensure to have a valid one selected."""
        try:
            session.window_handle
        except webdriver.NoSuchWindowException:
            handles = session.handles
            if handles:
                # Update only when there is at least one valid window left.
                session.window_handle = handles[0]

    @ignore_exceptions
    def _restore_timeouts(session):
        """Restore modified timeouts to their default values."""
        session.timeouts.implicit = defaults.IMPLICIT_WAIT_TIMEOUT
        session.timeouts.page_load = defaults.PAGE_LOAD_TIMEOUT
        session.timeouts.script = defaults.SCRIPT_TIMEOUT

    @ignore_exceptions
    def _restore_window_state(session):
        """Reset window to an acceptable size.

        This also includes bringing it out of maximized, minimized,
        or fullscreen state.
        """
        if session.capabilities.get("setWindowRect"):
            session.window.size = defaults.WINDOW_SIZE

    @ignore_exceptions
    def _restore_windows(session):
        """Close superfluous windows opened by the test.

        It will not end the session implicitly by closing the last window.
        """
        current_window = session.window_handle

        for window in _windows(session, exclude=[current_window]):
            session.window_handle = window
            if len(session.handles) > 1:
                session.window.close()

        session.window_handle = current_window

    _restore_timeouts(session)
    _ensure_valid_window(session)
    _dismiss_user_prompts(session)
    _restore_windows(session)
    _restore_window_state(session)
    _switch_to_top_level_browsing_context(session)
