import pytest

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def click(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/click"
                                  .format(session_id=session.session_id,
                                          element_id=element.id))


# 14.1 Element Click Link Element Tests Step 7

def test_click_numbers_link(session):
    # 14.1 Step 7
    url = "/webdriver/tests/element_click/support/input.html"
    session.url = inline("<a href=%s>123456</a>" % url)
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    assert session.url == "http://web-platform.test:8000%s" % url


def test_click_multi_line_link(session):
    # 14.1 Step 7
    url = "/webdriver/tests/element_click/support/input.html"
    session.url = inline("""
        <p style="background-color: rgb(255, 255, 0); width: 5em;">
            <a href=%s>Helloooooooooooooooooooo Worlddddddddddddddd</a>
        </p>""" % url)
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    assert session.url == "http://web-platform.test:8000%s" % url


def test_click_link_unload_event(session):
    # 14.1 Step 7
    url = "/webdriver/tests/element_click/support/input.html"
    session.url = inline("""<body onunload="checkUnload()">
                                <a href=%s>click here</a>
                                <input type=checkbox>
                                <script>
                                function checkUnload() {
                                    document.getElementsByTagName("input")[0].checked = true;
                                }
                                </script>
                            </body>""" % url)
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    assert session.url == "http://web-platform.test:8000%s" % url

    session.back()

    element = session.find.css("input", all=False)
    response = session.execute_script("return document.getElementsByTagName(\"input\")[0].checked;")
    assert response is True


def test_click_link_hash(session):
    # 14.1 Step 7
    session.url = inline("""<a href="#">aaaa</a>""")
    old_url = session.url

    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)

    new_url = session.url
    assert "%s%s" % (old_url, "#") == new_url


def test_click_link_closes_window(session, create_window):
    # 14.1 Step 7
    session.window_handle = create_window()

    session.url = inline("<a href=\"/webdriver/tests/element_click/support/close_window.html\">asdf</a>")
    element = session.find.css("a", all=False)
    response = click(session, element)
    assert_success(response)
    assert len(session.handles) == 1
