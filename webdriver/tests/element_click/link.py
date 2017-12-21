import pytest

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def click(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/click"
                                  .format(session_id=session.session_id,
                                          element_id=element.id))


# 14.1 Element Click Link Element Tests Step 7

@pytest.mark.parametrize("element", ["<a href=\"/webdriver/tests/element_click/support/input.html\">123456</a>",
                                     """<p style="background-color: rgb(255, 255, 0); width: 5em;">
                                        <a href="/webdriver/tests/element_click/support/input.html">Helloooooooooooooooooooo Worlddddddddddddddd</a>
                                    </p>"""])

def test_element_click_link(session, element):
    # 14.1 Step 7
    session.url = inline(element)
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    element = session.find.css("input", all=False)
    assert element.attribute("value") == "Hello World"


def test_element_click_link_unload_event(session):
    # 14.1 Step 7
    session.url = inline("""<body onunload="checkUnload()">
                                <a href="/webdriver/tests/element_click/support/input.html">click here</a>
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

    session.back()

    element = session.find.css("input", all=False)
    response = session.execute_script("return document.getElementById(\"unloadCheck\").checked;")
    assert response is True


def test_element_click_link_hash(session):
    # 14.1 Step 7
    session.url = inline("<a href=\"#\">aaaa</a>")
    OldUrl = session.url

    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    NewUrl = session.url
    assert OldUrl + "#" == NewUrl


def test_element_click_link_closes_window(session):
    # 14.1 Step 7
    session.execute_script("window.open();")

    handles = session.handles
    session.window_handle = handles[1]
    session.url = inline("<a href=\"/webdriver/tests/element_click/support/close_window.html\">asdf</a>")
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)
    assert len(session.handles) == 1
