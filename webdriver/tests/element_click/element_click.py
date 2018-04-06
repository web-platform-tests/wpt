import pytest

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def click(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/click"
                                  .format(session_id=session.session_id,
                                          element_id=element.id))


# 14.1 Element Click
def test_scroll_into_view(session):
    # 14.1 Step 4
    session.url = inline("""<input type=text value=Federer 
                            style="position: absolute; left: 0vh; top: 500vh">""")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_success(response)

    # Check if element clicked is scrolled into view
    assert session.execute_script("""
        rect = document.getElementsByTagName("input")[0].getBoundingClientRect();
        return rect["top"] >= 0 && rect["left"] >= 0 &&
            (rect["top"] + rect["height"]) <= window.innerHeight &&
            (rect["left"] + rect["width"]) <= window.innerWidth;""") is True


@pytest.mark.parametrize("transform", ["translate(-100px, -100px)", "rotate(50deg)"])
def test_element_not_interactable(session, transform):
    # 14.1 Step 5
    session.url = inline("""<div style="width: 500px; height: 100px;
                                background-color: blue; transform: %s";>
                        </div>""" % transform)
    element = session.find.css("div", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


def test_element_not_interactable_out_of_view(session):
    # 14.1 Step 5
    session.url = inline("""
        <div style="width: 500px; height: 100px;
            position: absolute; left: 0px; top: -150px; background-color: blue;">
        </div>""")
    element = session.find.css("div", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


def test_element_click_intercepted(session):
    # 14.1 Step 6
    session.url = inline("""
        <input type=button value=Roger style="position: absolute; left: 10px; top: 10px">
        <div style="position: absolute; height: 100px; width: 100px; background: rgba(255,0,0,.5); left: 10px; top: 5px"></div>""")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


def test_element_click_intercepted_pointer_events(session):
    # 14.1 Step 6
    session.url = inline("<input type=button value=Roger style=\"pointer-events: none\">")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


def test_element_click_intercepted_overflow_hidden(session):
    # 14.1 Step 6
    session.url = inline("""
        <div style="position: absolute; height: 50px; width: 100px; background: rgba(255,0,0,.5); left: 10px; top: 50px; overflow: hidden">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <input type=text value=Federer style="position: absolute; top: 50px; left: 10px;">
        </div>""")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")
