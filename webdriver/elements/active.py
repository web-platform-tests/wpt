import pytest
from webdriver.client import Element, element_key

from support.asserts import assert_error, assert_success, assert_dialog_handled
from support.fixtures import create_dialog
from support.inline import inline

def assert_element_result(result):
    assert result.status == 200
    assert isinstance(result.body["value"], dict)
    assert element_key in result.body["value"]

def get_id(session, element_json):
    element = Element(session, element_json[element_key])
    return element.attribute("id")

# > 1. If the current browsing context is no longer open, return error with
# >    error code no such window. 
def test_closed_context(session, create_window):
    new_window = create_window()
    session.window_handle = new_window
    session.close()

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

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
    session.url = inline("<body id='document-body'><p>Hello, World!</p></body>")

    create_dialog(session)("alert", text="dismiss #1", result_var="dismiss1")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_element_result(result)
    assert get_id(session, result.body["value"]) == "document-body"
    assert_dialog_handled(session, "dismiss #1")
    assert session.execute_script("return dismiss1;") == None

    create_dialog(session)("confirm", text="dismiss #2", result_var="dismiss2")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_element_result(result)
    assert get_id(session, result.body["value"]) == "document-body"
    assert_dialog_handled(session, "dismiss #2")
    assert read_global(session, "dismiss2") == None

    create_dialog(session)("prompt", text="dismiss #3", result_var="dismiss3")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_element_result(result)
    assert get_id(session, result.body["value"]) == "document-body"
    assert_dialog_handled(session, "dismiss #3")
    assert read_global(session, "dismiss3") == None

# [...]
# 2. Handle any user prompts and return its value if it is an error.
# [...]
# In order to handle any user prompts a remote end must take the following
# steps:
# 2. Run the substeps of the first matching user prompt handler:
#
#    [...]
#    - accept state
#      1. Accept the current user prompt.
#    [...]
#
# 3. Return success.
def test_handle_prompt_accept(new_session, get_id):
    _, session = new_session({"alwaysMatch": {"unhandledPromptBehavior": "accept"}})
    session.url = inline("<body id='document-body'><p>Hello, World!</p></body>")
    create_dialog(session)("alert", text="accept #1", result_var="accept1")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_element_result(result)
    assert get_id(session, result.body["value"]) == "document-body"
    assert_dialog_handled(session, "accept #1")
    assert read_global(session, "accept1") == None

    create_dialog(session)("confirm", text="accept #2", result_var="accept2")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_element_result(result)
    assert get_id(session, result.body["value"]) == "document-body"
    assert_dialog_handled(session, "accept #2")
    assert read_global(session, "accept2"), True

    create_dialog(session)("prompt", text="accept #3", result_var="accept3")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_element_result(result)
    assert get_id(session, result.body["value"]) == "document-body"
    assert_dialog_handled(session, "accept #3")
    assert read_global(session, "accept3") == ""

# [...]
# 2. Handle any user prompts and return its value if it is an error.
# [...]
# In order to handle any user prompts a remote end must take the following
# steps:
# 2. Run the substeps of the first matching user prompt handler:
#
#    [...]
#    - missing value default state
#    - not in the table of simple dialogs
#      1. Dismiss the current user prompt.
#      2. Return error with error code unexpected alert open.
def test_handle_prompt_missing_value(session, create_dialog):
    session.url = inline("<body id='document-body'><p>Hello, World!</p></body>")

    create_dialog("alert", text="dismiss #1", result_var="dismiss1")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_error(result, "unexpected alert open")
    assert_dialog_handled(session, "dismiss #1")
    assert session.execute_script("return accept1;") == None

    create_dialog("confirm", text="dismiss #2", result_var="dismiss2")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_error(result, "unexpected alert open")
    assert_dialog_handled(session, "dismiss #2")
    assert session.execute_script("return dismiss2;") == False

    create_dialog("prompt", text="dismiss #3", result_var="dismiss3")

    result = session.transport.send("GET",
                                    "session/%s/element/active" % session.session_id)

    assert_error(result, "unexpected alert open")
    assert_dialog_handled(session, "dismiss #3")
    assert session.execute_script("return dismiss3;") == None

# > [...]
# > 3. Let active element be the active element of the current browsing
# >    context's document element.
# > 4. Let active web element be the JSON Serialization of active element.
# > 5. Return success with data active web element.
def test_sucess_document(session):
    session.url = inline("""
        <body id="document-body">
            <h1>Heading</h1>
            <input id="the-input" />
            <input id="interactable-input" />
            <input id="non-interactable-input" style="opacity: 0;" />
            <p>Another element</p>
        </body>""")
    result = session.transport.send("GET", "session/%s/element/active" % session.session_id)

    assert_element_result(result)

    assert get_id(session, result.body["value"]) == "document-body"

def test_sucess_input(session):
    session.url = inline("""
        <body id="document-body">
            <h1>Heading</h1>
            <input id="interactable-input" autofocus />
            <input id="non-interactable-input" style="opacity: 0;" />
            <p>Another element</p>
        </body>""")
    result = session.transport.send("GET", "session/%s/element/active" % session.session_id)

    assert_element_result(result)

    assert get_id(session, result.body["value"]) == "interactable-input"

def test_sucess_input_non_interactable(session):
    session.url = inline("""
        <body id="document-body">
            <h1>Heading</h1>
            <input id="interactable-input" />
            <input id="non-interactable-input" style="opacity: 0;" autofocus />
            <p>Another element</p>
        </body>""")
    result = session.transport.send("GET", "session/%s/element/active" % session.session_id)

    assert_element_result(result)

    assert get_id(session, result.body["value"]) == "non-interactable-input"
