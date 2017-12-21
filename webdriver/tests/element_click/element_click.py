import pytest

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def click(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/click"
                                  .format(session_id=session.session_id,
                                          element_id=element.id))


# 14.1 Element Click

def test_no_browsing_context(session, create_window):
    # 14.1 step 1
    session.window_handle = create_window()
    session.close()

    response = session.transport.send("POST", "session/{session_id}/element/{element_id}/click"
                                      .format(session_id=session.session_id,
                                              element_id="foo"))
    assert_error(response, "no such window")


def test_scroll_into_element_view(session):
    # 14.1 Step 4
    session.url = inline("<input type=text value=Federer><div style=\"height: 200vh; width: 5000vh\">")

    # Scroll to the bottom right of the page
    session.execute_script("window.scrollTo(document.body.scrollWidth, document.body.scrollHeight);")
    element = session.find.css("input", all=False)
    # Clear and scroll back to the top of the page
    response = click(session, element)
    assert_success(response)

    # Check if element cleared is scrolled into view
    response = session.execute_script("""rect = document.getElementsByTagName("input")[0].getBoundingClientRect();
                                        xOffset = window.pageXOffset;
                                        yOffset = window.pageYOffset;
                                        return  rect["top"] < (window.innerHeight + yOffset) &&
                                                rect["left"] < (window.innerWidth + xOffset) &&
                                                (rect["top"] + rect["height"]) > yOffset &&
                                                (rect["left"] + rect["width"]) > xOffset;""")
    assert response is True


@pytest.mark.parametrize("transform", ["translate(-50px, -50px)", "rotate(50deg)"])

def test_element_not_interactable(session, transform):
    # 14.1 Step 5
    session.url = inline("<div style=\"width: 500px; height: 100px; background-color: green; transform: " + transform + """;">
                            <a href=#>aaaa</a>
                        </div>""")
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


@pytest.mark.parametrize("element", ["""<input type=button value=Roger style="position: absolute; left: 10px; top: 10px">
                                    <div style="position: absolute; height: 100px; width: 100px; background: rgba(255,0,0,.5); left: 10px; top: 5px"></div>""",
                                    "<input type=button value=Roger style=\"pointer-events: none\">",
                                    """<div style="position: absolute; height: 50px; width: 100px; background: rgba(255,0,0,.5); left: 10px; top: 50px; overflow: hidden">
                                        ABCDEFGHIJKLMNOPQRSTUVWXYZ
                                        <input type=text value=Federer style="position: absolute; top: 50px; left: 10px;">
                                    </div>"""])

def test_element_click_intercepted(session, element):
    # 14.1 Step 6
    # Test intercepted click
    # Test no pointer events
    # Test overflow hidden
    session.url = inline(element)

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


def test_match_option_element(session):
    # 14.1 Step 7
    session.url = inline("""
                        <select id=sel style="position: absolute; left: 10px; top: 50px">
                            <option id=op1></option>
                            <option id=op2>Roger</option>
                            <option id=op3>Federer</option>
                        </select>
                        <script>
                        document.getElementById("sel").addEventListener("focus", checkFocus => {window.focusCheck = true;});
                        document.getElementById("sel").addEventListener("mouseover", checkMouseOver => {window.mouseOverCheck = true;});
                        document.getElementById("sel").addEventListener("mousedown", checkMouseDown => {window.mouseDownCheck = true;});
                        document.getElementById("sel").addEventListener("mouseup", checkMouseUp => {window.mouseUpCheck = true;});
                        document.getElementById("sel").addEventListener("click", checkMouseClick => {window.mouseClickCheck = true;});
                        document.getElementById("sel").addEventListener("input", checkInputEvent => {window.inputEventCheck = true;});
                        document.getElementById("sel").addEventListener("change", checkChangeEvent => {window.changeEventCheck = true;});
                        window.addEventListener("mousemove", checkMouseMove => {window.mouseMoveCheck = true;});
                        </script>""")

    sel = session.find.css("#sel", all=False)
    op = session.find.css("#op2", all=False)

    response = click(session, sel)
    assert_success(response)
    response = click(session, op)
    assert_success(response)

    response = session.execute_script("return document.getElementById(\"op2\").selected;")
    assert response is True

    for event in ["focusCheck", "mouseOverCheck", "mouseMoveCheck", "mouseDownCheck", "mouseUpCheck", "mouseClickCheck", "inputEventCheck", "changeEventCheck"]:
        response = session.execute_script("return window.%s;" % event)
        assert response is True
