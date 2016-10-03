import pytest
import webdriver


def test_resize(session):
    # setting the window size by webdriver is synchronous
    # so we should see the results immediately

    session.window.size = (200, 100)
    assert session.window.size == {"width": 100, "height": 200}

    session.window.size = (100, 200)
    assert session.window.size == {"width": 200, "height": 100}

def test_resize_by_script(session):
    # setting the window size by JS is asynchronous
    # so we poll waiting for the results

    size0 = session.window.size

    session.execute_script("window.resizeTo(100, 200)")
    size1 = session.window.size
    while size0 == size1:
        size1 = session.window.size
    assert size1 == {"width": 100, "height": 200}

    session.execute_script("window.resizeTo(200, 100)")
    size2 = session.window.size
    while size1 == size2:
        size2 = session.window.size
    assert size2 == {"width": 200, "height": 100}

@pytest.mark.xfail(raises=webdriver.UnsupportedOperationException)
def test_window_position_types(http, session):
    session.start()
    with http.get("/session/%s/window/position" % session.session_id) as resp:
        assert resp.status == 200
        body = json.load(resp)
    assert "x" in body
    assert "y" in body
    assert isinstance(body["x"], int)
    assert isinstance(body["y"], int)

    size = session.window.position
    assert isinstance(size, tuple)
    assert isinstance(size[0], int)
    assert isinstance(size[1], int)
