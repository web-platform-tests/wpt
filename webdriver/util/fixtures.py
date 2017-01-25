import webdriver

def session(_session, request):
    # finalisers are popped off a stack,
    # making their ordering reverse
    request.addfinalizer(lambda: _switch_to_top_level_browsing_context(_session))
    request.addfinalizer(lambda: _restore_windows(_session))
    request.addfinalizer(lambda: _dismiss_user_prompts(_session))

    return _session

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
        if len(session.window_handles) > 1:
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

def create_window(session):
    """Open new window and return the window handle."""
    def create_window():
        windows_before = session.handles
        name = session.execute_script("window.open()")
        assert len(session.handles) == len(windows_before) + 1
        new_windows = list(set(session.handles) - set(windows_before))
        return new_windows.pop()
    return create_window

def create_frame(session):
    def create_frame():
        session.start()
        append = """
            var frame = document.createElement('iframe');
            document.body.appendChild(frame);
            return frame;
        """
        response = session.send_command("POST",
                                        "execute/sync",
                                        dict(script=append, args=[]))
        return response["value"]

    return create_frame
