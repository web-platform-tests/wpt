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

def test_click_link(session, element):
    # 14.1 Step 7
    session.url = inline(element)
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    element = session.find.css("input", all=False)
    assert element.attribute("value") == "Hello World"


def test_click_link_unload_event(session):
    # 14.1 Step 7
    session.url = inline("""<body onunload="checkUnload()">
                                <a href="/webdriver/tests/element_click/support/input.html">click here</a>
                                <input type=checkbox>
                                <script>
                                function checkUnload() {
                                    document.getElementsByTagName("input")[0].checked = true;
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
    response = session.execute_script("return document.getElementsByTagName(\"input\")[0].checked;")
    assert response is True


def test_click_link_hash(session):
    # 14.1 Step 7
    session.url = inline("<a href=\"#\">aaaa</a>")
    oldUrl = session.url

    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    newUrl = session.url
    assert "%s%s" %(oldUrl, "#") == newUrl


def test_click_link_closes_window(session, create_window):
    # 14.1 Step 7
    session.window_handle = create_window()

    session.url = inline("<a href=\"/webdriver/tests/element_click/support/close_window.html\">asdf</a>")
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)
    assert len(session.handles) == 1
