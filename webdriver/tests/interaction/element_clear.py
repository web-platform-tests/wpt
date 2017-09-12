from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline


def clear(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/clear"
                                  .format(session_id=session.session_id,
                                          element_id=element.id))


# 14.2 Element Clear

def test_no_browsing_context(session, create_window):
    # 14.2 step 1
    session.url = inline("<p>This is not an editable paragraph.")
    element = session.find.css("p", all=False)

    session.window_handle = create_window()
    session.close()

    response = clear(session, element)
    assert_error(response, "no such window")


def test_element_not_found(session):
    # 14.2 Step 2
    response = clear(session, "box1")
    assert_error(response, "no such element")


def test_element_not_editable(session):
    # 14.2 Step 3
    session.url = inline("<p>This is not an editable paragraph.")

    element = session.find.css("p", all=False)
    response = clear(session, element)
    assert_error(response, "invalid element state")


def test_element_not_resettable(session):
    # 14.2 Step 3
    session.url = inline("<input type=button value=Federer>")

    element = session.find.css("input", all=False)
    response = clear(session, element)
    assert_error(response, "invalid element state")


def test_scroll_into_element_view(session):
    # 14.2 Step 4
    session.url = inline("<input type=text value=Federer><div style= \"height: 200vh; width: 5000vh\">")

    # Scroll to the bottom right of the page
    session.execute_script("window.scrollTo(document.body.scrollWidth, document.body.scrollHeight);")
    element = session.find.css("input", all=False)
    # Clear and scroll back to the top of the page
    response = clear(session, element)

    # Check if element cleared is scrolled into view
    rect = session.execute_script("return document.getElementsByTagName(\"input\")[0].getBoundingClientRect()")

    pageDict = {}

    pageDict["innerHeight"] = session.execute_script("return window.innerHeight")
    pageDict["innerWidth"] = session.execute_script("return window.innerWidth")
    pageDict["pageXOffset"] = session.execute_script("return window.pageXOffset")
    pageDict["pageYOffset"] = session.execute_script("return window.pageYOffset")

    assert rect["top"] < (pageDict["innerHeight"] + pageDict["pageYOffset"]) and \
           rect["left"] < (pageDict["innerWidth"] + pageDict["pageXOffset"]) and \
           (rect["top"] + element.rect["height"]) > pageDict["pageYOffset"] and \
           (rect["left"] + element.rect["width"]) > pageDict["pageXOffset"]


# TODO
# Any suggestions on implementation?
# def test_session_implicit_wait_timeout(session):
    # 14.2 Step 5

# TODO
# Any suggestions on implementation?
# def test_element_not_interactable(session):
#     # 14.2 Step 6
#     assert_error(response, "element not interactable")


def test_element_readonly(session):
    # 14.2 Step 7
    session.url = inline("<input type=text readonly value=Federer>")

    element = session.find.css("input", all=False)
    response = clear(session, element)
    assert_error(response, "invalid element state")


def test_element_disabled(session):
    # 14.2 Step 7
    session.url = inline("<input type=text disabled value=Federer>")

    element = session.find.css("input", all=False)
    response = clear(session, element)
    assert_error(response, "invalid element state")


def test_element_pointer_events_disabled(session):
    # 14.2 Step 7
    session.url = inline("<input type=text value=Federer style=\"pointer-events: none\">")

    element = session.find.css("input", all=False)
    response = clear(session, element)
    assert_error(response, "invalid element state")


def test_clear_editable_element(session):
    # 14.2 Step 8
    session.url = inline("<p contenteditable=true>This is an editable paragraph.")

    element = session.find.css("p", all=False)
    response = clear(session, element)

    assert element.text == ""


def test_clear_resettable_element(session):
    # 14.2 Step 8
    session.url = inline("<input type=text value=Federer>")

    element = session.find.css("input", all=False)
    response = clear(session, element)
    assert element.property("value") == ""