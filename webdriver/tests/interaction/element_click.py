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
    session.url = inline("<p>This is not an editable paragraph.")
    element = session.find.css("p", all=False)

    session.window_handle = create_window()
    session.close()

    response = click(session, element)
    assert_error(response, "no such window")


def test_element_file_upload_state(session):
    # 14.1 Step 3
    session.url = inline("<input type=file value=Federer>")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "invalid argument")


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


@pytest.mark.parametrize("element", ["""<div style="width: 500px; height: 100px; background-color: green; transform: translate(-50px, -50px);">
                                            <a href=#>aaaa</a>
                                        </div>""",
                                    """<div style="width: 500px; height: 100px; background-color: green; transform: rotate(50deg);">
                                            <a href=#>aaaa</a>
                                        </div>"""])

def test_element_not_interactable(session, element):
#     # 14.1 Step 5
    session.url = inline(element)
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


def test_match_option_element(session, mouse_chain):
    # 14.1 Step 7
    session.url = inline("""<select id=sel style="position: absolute; left: 10px; top: 50px">
                            <option id=op1></option>
                            <option id=op2>Roger</option>
                            <option id=op3>Federer</option>
                        </select>

                        <input id=focusCheck type=checkbox>
                        <input id=mouseOverCheck type=checkbox>
                        <input id=mouseMoveCheck type=checkbox>
                        <input id=mouseDownCheck type=checkbox>
                        <input id=mouseUpCheck type=checkbox>
                        <input id=mouseClickCheck type=checkbox>
                        <input id=inputEventCheck type=checkbox>
                        <input id=changeEventCheck type=checkbox>
                        <script>
                        document.getElementById("sel").addEventListener("focus", checkFocus);
                        document.getElementById("sel").addEventListener("mouseover", checkMouseOver);
                        document.getElementById("sel").addEventListener("mousedown", checkMouseDown);
                        document.getElementById("sel").addEventListener("mouseup", checkMouseUp);
                        document.getElementById("sel").addEventListener("click", checkMouseClick);
                        document.getElementById("sel").addEventListener("input", checkInputEvent);
                        document.getElementById("sel").addEventListener("change", checkChangeEvent);

                        window.addEventListener("mousemove", checkMouseMove);

                        function checkFocus() {
                            document.getElementById("focusCheck").checked = true;
                        }
                        function checkMouseOver() {
                            document.getElementById("mouseOverCheck").checked = true;
                        }
                        function checkMouseMove() {
                            document.getElementById("mouseMoveCheck").checked = true;
                        }
                        function checkMouseDown() {
                            document.getElementById("mouseDownCheck").checked = true;
                        }
                        function checkMouseUp() {
                            document.getElementById("mouseUpCheck").checked = true;
                        }
                        function checkMouseClick() {
                            document.getElementById("mouseClickCheck").checked = true;
                        }
                        function checkInputEvent() {
                            document.getElementById("inputEventCheck").checked = true;
                        }
                        function checkChangeEvent() {
                            document.getElementById("changeEventCheck").checked = true;
                        }

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
        response = session.execute_script("return document.getElementById(\"%s\").checked;" % event)
        assert response is True


@pytest.mark.parametrize("element", ["<a href=\"/webdriver/tests/interaction/support/test.html\">123456</a>",
                                     """<p style="background-color: rgb(255, 255, 0); width: 5em;">
                                        <a href=\"/webdriver/tests/interaction/support/test.html\">Helloooooooooooooooooooo Worlddddddddddddddd</a>
                                    </p>"""])

def test_element_click_link(session, element):
    # 14.1 Step 6
    session.url = inline(element)
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    element = session.find.css("input", all=False)
    assert element.attribute("value") == "Hello World"


def test_element_click_link_unload_event(session):
    # 14.1 Step 6
    session.url = inline("""<body onunload="checkUnload()">
                                <a href="/webdriver/tests/interaction/support/test.html">click here</a>
                                <input id=unloadCheck type=checkbox>
                                <script>
                                function checkUnload() {                        
                                    document.getElementById("unloadCheck").checked = true;                       
                                }
                                </script>
                            </body>""")
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    element = session.find.css("input", all=False)
    assert element.attribute("value") == "Hello World"

    session.transport.send("POST", "session/{session_id}/back".format(session_id=session.session_id))

    element = session.find.css("input", all=False)
    response = session.execute_script("return document.getElementById(\"unloadCheck\").checked;")
    assert response is True


def test_element_click_link_hash(session):
    # 14.1 Step 6
    session.url = inline("<a href=\"#\">aaaa</a>")
    oldUrl = session.transport.send("GET", "session/{session_id}/url".format(session_id=session.session_id))
    assert_success(oldUrl)
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    newUrl = session.transport.send("GET", "session/{session_id}/url".format(session_id=session.session_id))
    assert_success(newUrl)
    assert oldUrl.body["value"] + "#" == newUrl.body["value"]
