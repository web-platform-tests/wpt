import json
import os
import urlparse
from uuid import uuid4

import webdriver

from support.asserts import assert_error
from support.http_request import HTTPRequest

default_host = "http://127.0.0.1"
default_port = "4444"

def _dismiss_user_prompts(session):
    """Dismisses any open user prompts in windows."""
    current_window = session.window_handle

    for window in _windows(session):
        session.window_handle = window
        try:
            session.alert.dismiss()
        except webdriver.NoSuchAlertException:
            pass

    session.window_handle = current_window

def _restore_windows(session):
    """Closes superfluous windows opened by the test without ending
    the session implicitly by closing the last window.
    """
    current_window = session.window_handle

    for window in _windows(session, exclude=[current_window]):
        session.window_handle = window
        if len(session.handles) > 1:
            session.close()

    session.window_handle = current_window

def _switch_to_top_level_browsing_context(session):
    """If the current browsing context selected by WebDriver is a
    `<frame>` or an `<iframe>`, switch it back to the top-level
    browsing context.
    """
    session.switch_frame(None)

def _windows(session, exclude=None):
    """Set of window handles, filtered by an `exclude` list if
    provided.
    """
    if exclude is None:
        exclude = []
    wins = [w for w in session.handles if w not in exclude]
    return set(wins)

def create_frame(session):
    """Create an `iframe` element in the current browsing context and insert it
    into the document. Return an element reference."""
    def create_frame():
        append = """
            var frame = document.createElement('iframe');
            document.body.appendChild(frame);
            return frame;
        """
        response = session.execute_script(append)

    return create_frame

def create_window(session):
    """Open new window and return the window handle."""
    def create_window():
        windows_before = session.handles
        name = session.execute_script("window.open()")
        assert len(session.handles) == len(windows_before) + 1
        new_windows = list(set(session.handles) - set(windows_before))
        return new_windows.pop()
    return create_window

def http(session):
    return HTTPRequest(session.transport.host, session.transport.port)

def server_config():
    return json.loads(os.environ.get("WD_SERVER_CONFIG"))

def session(session_session, request):
    # finalisers are popped off a stack,
    # making their ordering reverse
    request.addfinalizer(lambda: _switch_to_top_level_browsing_context(session_session))
    request.addfinalizer(lambda: _restore_windows(session_session))
    request.addfinalizer(lambda: _dismiss_user_prompts(session_session))

    return session_session

# Create a wdclient `Session` object for each Pytest "session"
def session_session(request):
    host = os.environ.get("WD_HOST", default_host)
    port = int(os.environ.get("WD_PORT", default_port))
    capabilities = json.loads(os.environ.get("WD_CAPABILITIES", "{}"))

    session = webdriver.Session(host, port, desired_capabilities=capabilities)

    def destroy():
        if session.session_id is not None:
            session.end()

    request.addfinalizer(destroy)

    return session

def url(server_config):
    def inner(path, query="", fragment=""):
        rv = urlparse.urlunsplit(("http",
                                  "%s:%s" % (server_config["host"],
                                             server_config["ports"]["http"][0]),
                                  path,
                                  query,
                                  fragment))
        return rv
    return inner

def switch_to_inactive(session):
    """Create a new browsing context, switch to that new context, and then
    delete the context."""
    def switch_to_inactive():
        initial = session.send_session_command("GET", "window/handles")

        session.send_session_command("POST",
                                     "execute/sync",
                                     dict(script="window.open();", args=[]))
        with_new = session.send_session_command("GET", "window/handles")

        assert len(initial) == len(with_new) - 1

        new_handle = (set(with_new) - set(initial)).pop()

        session.send_session_command("POST",
                                     "window",
                                     dict(handle=new_handle))

        session.send_session_command("DELETE", "window")

    return switch_to_inactive

def create_dialog(session):
    """Create a dialog (one of "alert", "prompt", or "confirm") and provide a
    function to validate that the dialog has been "handled" (either accepted or
    dismissed) by returning some value."""

    def create_dialog(dialog_type):
        dialog_id = str(uuid4())
        dialog_text = "text " + dialog_id

        assert dialog_type in ("alert", "confirm", "prompt"), (
               "Invalid dialog type: '%s'" % dialog_type)

        # Script completion and modal summoning are scheduled on two separate
        # turns of the event loop to ensure that both occur regardless of how
        # the user agent manages script execution.
        spawn = """
            var done = arguments[0];
            window.__WEBDRIVER = "initial value {0}";
            setTimeout(function() {{
                done();
            }}, 0);
            setTimeout(function() {{
                window.__WEBDRIVER = window.{1}("{2}");
            }}, 0);
        """.format(dialog_id, dialog_type, dialog_text)

        session.send_session_command("POST",
                                     "execute/async",
                                     dict(script=spawn, args=[]))

        def assert_dialog_handled(expected_value):
            result = session.transport.send("GET",
                                            "session/%s/alert/text" % session.session_id)

            # If there were any existing dialogs prior to the creation of this
            # fixture's dialog, then the "Get Alert Text" command will return
            # successfully. In that case, the text must be different than that
            # of this fixture's dialog.
            try:
                assert_error(result, "no such alert")
            except:
                assert (result.status == 200 and
                        result.body["value"] != dialog_text), (
                       "%s dialog was not handled." % dialog_type)

            probe = "return window.__WEBDRIVER;"
            result = session.send_session_command("POST",
                                                  "execute/sync",
                                                  dict(script=probe, args=[]))

            assert result == expected_value, (
                   "%s dialog was not handled with expected value" % s)

        return assert_dialog_handled

    return create_dialog
