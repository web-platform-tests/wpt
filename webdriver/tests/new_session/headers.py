def test_missing_first_match(new_session, add_browser_capabilities):
    response, _ = new_session({"capabilities": {"alwaysMatch": add_browser_capabilities({})}})
    assert 'cache-control' in response.headers
    assert 'no-cache' == response.headers['cache-control']
    assert 'content-type' in response.headers
    assert 'application/json; charset=utf-8' == response.headers['content-type']
