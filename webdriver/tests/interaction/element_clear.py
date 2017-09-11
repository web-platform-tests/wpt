import pytest

from tests.support.asserts import assert_error, assert_success, assert_dialog_handled
from tests.support.inline import inline


def clear(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/clear"
                                  .format(session_id=session.session_id,
                                          element_id=element))


# 14.2 Element Clear

def test_no_browsing_context(session, create_window):
    # 14.2 step 1
    session.window_handle = create_window()
    session.close()

    result = clear(session, "box1")
    assert_error(result, "no such window")


def test_element_not_found(session):
    # 14.2 Step 2
    result = clear(session, "box1")
    assert_error(result, "no such element")


def test_element_not_editable(session):
    # 14.2 Step 3
    session.url = inline("""
        <p id="para" contenteditable="false">This is not an editable paragraph.</p>
        """)

    element = session.find.css("#para", all=False)
    result = clear(session, element.id)
    assert_error(result, "invalid element state")


def test_element_not_resettable(session):
    # 14.2 Step 3
    session.url = inline("""
        <input id="box1" type="button" value="Federer"/><br>
        """)

    element = session.find.css("#box1", all=False)
    result = clear(session, element.id)
    assert_error(result, "invalid element state")


def test_scroll_into_element_view(session):
    # 14.2 Step 4
    session.url = inline("""
        <input id="box1" type="text" value="Federer"/><br>
        <div style="height: 10000px"><br>
        """)

    # Scroll to the bottom of the page
    session.execute_script("""window.scrollTo(0, document.body.scrollHeight);""")
    element = session.find.css("#box1", all=False)
    # Clear and scroll back to the top of the page
    result = clear(session, element.id)

    # Check if element cleared is scrolled into view
    rect = session.execute_script("""return document.getElementById("box1").getBoundingClientRect()""")

    innerHeight = session.execute_script("""return window.innerHeight""")
    innerWidth = session.execute_script("""return window.innerWidth""")
    pageXOffset = session.execute_script("""return window.pageXOffset""")
    pageYOffset = session.execute_script("""return window.pageYOffset""")

    assert rect["top"] < (innerHeight + pageYOffset) and \
           rect["left"] < (innerWidth + pageXOffset) and \
           (rect["top"] + element.rect["height"]) > pageYOffset and \
           (rect["left"] + element.rect["width"]) > pageXOffset

# TODO
# def test_session_implicit_wait_timeout(session):
    # 14.2 Step 5

# TODO
# def test_element_not_interactable(session):
#     # 14.2 Step 6
#     assert_error(result, "element not interactable")


def test_element_readonly(session):
    # 14.2 Step 7
    session.url = inline("""
        <input id="box1" type="text" readonly value="Federer"/><br>
        """)

    element = session.find.css("#box1", all=False)
    result = clear(session, element.id)
    assert_error(result, "invalid element state")


def test_element_disabled(session):
    # 14.2 Step 7
    session.url = inline("""
        <input id="box1" type="text" disabled value="Federer"/><br>
        """)

    element = session.find.css("#box1", all=False)
    result = clear(session, element.id)
    assert_error(result, "invalid element state")


def test_element_pointer_events_disabled(session):
    # 14.2 Step 7
    session.url = inline("""
        <input id="box1" type="text" value="Federer" style="pointer-events: none"/><br>
        """)

    element = session.find.css("#box1", all=False)
    result = clear(session, element.id)
    assert_error(result, "invalid element state")


def test_clear_editable_element(session):
    # 14.2 Step 8
    session.url = inline("""
        <p id="para" contenteditable="true">This is an editable paragraph.</p>
        """)

    element = session.find.css("#para", all=False)
    result = clear(session, element.id)

    assert element.text == ""


def test_clear_resettable_element(session):
    # 14.2 Step 8
    session.url = inline("""
        <input id="box1" type="text" value="Federer"/><br>
        """)

    element = session.find.css("#box1", all=False)
    result = clear(session, element.id)

    assert session.execute_script("""return document.getElementById("box1").value""") == ""

