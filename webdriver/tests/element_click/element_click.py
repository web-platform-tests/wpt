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
    assert session.execute_script("""
        rect = document.getElementsByTagName("input")[0].getBoundingClientRect();
        xOffset = window.pageXOffset;
        yOffset = window.pageYOffset;
        return  rect["top"] < (window.innerHeight + yOffset) &&
                rect["left"] < (window.innerWidth + xOffset) &&
                (rect["top"] + rect["height"]) > yOffset &&
                (rect["left"] + rect["width"]) > xOffset;""") is True


@pytest.mark.parametrize("transform", ["translate(-100px, -100px)", "rotate(50deg)"])
def test_element_not_interactable(session, transform):
    # 14.1 Step 5
    session.url = inline("""<div style="width: 500px; height: 100px;
                                background-color: blue; transform: %s";>
                        </div>""" % transform)
    element = session.find.css("div", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


@pytest.mark.parametrize("element",
    ["""<input type=button value=Roger style="position: absolute; left: 10px; top: 10px">
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
        <select>
            <option id=op1></option>
            <option id=op2>Roger</option>
            <option id=op3>Federer</option>
        </select>
        <script>
        window.events = [];
        for (let expected of ["focus", "mouseover", "mousedown", "mouseup", "click", "input", "change", "mousemove"]) {
          document.getElementsByTagName("select")[0].addEventListener(expected, ({type}) => window.events.push(type));
        }
        </script>""")

    sel = session.find.css("select", all=False)
    options = session.find.css("option")

    response = click(session, sel)
    assert_success(response)
    response = click(session, options[1])
    assert_success(response)

    assert options[1].selected is True
    events = session.execute_script("return window.events;")
    for check in ["focus", "mouseover", "mousedown", "mouseup", "click", "input", "change", "mousemove"]:
        assert check in events
