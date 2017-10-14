# META: timeout=long

import json


def test_window(session):
    session.execute_script("window.foo = window.open()")
    raw_json = session.execute_script("return window.foo;")
    obj = json.loads(raw_json)
    assert len(obj) == 1
    assert "window-fcc6-11e5-b4f8-330a88ab9d7f" in obj
    handle = obj["window-fcc6-11e5-b4f8-330a88ab9d7f"]
    assert handle in session.window_handles
