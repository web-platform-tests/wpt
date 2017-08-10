import pytest
import json

from tests.support.asserts import assert_error, assert_success, assert_dialog_handled
from tests.support.fixtures import create_dialog
from tests.support.inline import inline


def test_closed_browsing_context(new_session):
    _, session = new_session({})
    session.end()

    # 15.1: Closed session context
    result = session.transport.send("GET",
                                    "session/%s/source" % session.session_id)

    assert_error(result, "no such window")


# [...]
# 2. Handle any user prompts and return its value if it is an error.
# [...]
# In order to handle any user prompts a remote end must take the following
# steps:
# 2. Run the substeps of the first matching user prompt handler:
#
#    [...]
#    - dismiss state
#      1. Dismiss the current user prompt.
#    [...]
#
# 3. Return success.
def test_handle_prompt_dismiss(new_session):
    _, session = new_session({"alwaysMatch": {"unhandledPromptBehavior": "dismiss"}})
    session.url = inline("<title>WD doc title</title>")

    expected_source = session.source

    create_dialog(session)("alert", text="dismiss #1", result_var="dismiss1")

    result = session.transport.send("GET",
                                    "session/%s/source" % session.session_id)

    assert_success(result, expected_source)
    assert_dialog_handled(session, "dismiss #1")
    assert read_global(session, "dismiss1") == None

    create_dialog(session)("confirm", text="dismiss #2", result_var="dismiss2")

    result = session.transport.send("GET",
                                    "session/%s/source" % session.session_id)

    assert_success(result, expected_source)
    assert_dialog_handled(session, "dismiss #2")
    assert read_global(session, "dismiss2") == None

    create_dialog(session)("prompt", text="dismiss #3", result_var="dismiss3")

    result = session.transport.send("GET",
                                    "session/%s/source" % session.session_id)

    assert_success(result, expected_source)
    assert_dialog_handled(session, "dismiss #3")
    assert read_global(session, "dismiss3") == None


# 15.1.3 "Let source be the result returned from the outerHTML IDL attribute
#         of the document element"
def test_source_matches_outer_html(session):
    expected_source = session.execute_script(
        "return document.documentElement.outerHTML")

    assert session.source == expected_source

