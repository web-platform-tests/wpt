import pytest

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def click(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/click"
                                  .format(session_id=session.session_id,
                                          element_id=element.id))


# 14.1 Element Click
def test_scroll_into_view(session):
    session.url = inline("""
        <input type=text value=Federer 
        style="position: absolute; left: 0vh; top: 500vh">""")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_success(response)

    # Check if element clicked is scrolled into view
    assert session.execute_script("""
        let [input] = arguments;
        rect = input.getBoundingClientRect();
        return rect["top"] >= 0 && rect["left"] >= 0 &&
            (rect["top"] + rect["height"]) <= window.innerHeight &&
            (rect["left"] + rect["width"]) <= window.innerWidth;
            """, args=(element,)) is True


@pytest.mark.parametrize("transform", ["translate(-100px, -100px)", "rotate(50deg)"])
def test_element_not_interactable_css_transform(session, transform):
    session.url = inline("""
        <div style="width: 500px; height: 100px;
            background-color: blue; transform: %s;">
            <input type=button>                        
        </div>""" % transform)
    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


def test_element_not_interactable_out_of_view(session):
    session.url = inline("""
        <div style="width: 500px; height: 100px;
            position: absolute; left: 0px; top: -150px; background-color: blue;">
        </div>""")
    element = session.find.css("div", all=False)
    response = click(session, element)
    assert_error(response, "element not interactable")


def test_element_intercepted(session):
    session.url = inline("""
        <input type=button value=Roger style="position: absolute; left: 10px; top: 10px">
        <div style="position: absolute; height: 100px; width: 100px; background: rgba(255,0,0,.5); left: 10px; top: 5px"></div>""")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element click intercepted")


def test_element_intercepted_no_pointer_events(session):
    session.url = inline("""<input type=button value=Roger style="pointer-events: none">""")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element click intercepted")


def test_element_not_visible_overflow_hidden(session):
    session.url = inline("""
        <div style="position: absolute; height: 50px; width: 100px; background: rgba(255,0,0,.5); left: 10px; top: 50px; overflow: hidden">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <input type=text value=Federer style="position: absolute; top: 50px; left: 10px;">
        </div>""")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "element not visible")
