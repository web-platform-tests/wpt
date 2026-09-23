def test_debug(session, inline):
    session.url = inline("<title>debug</title>")
    assert session.title == "debug"
