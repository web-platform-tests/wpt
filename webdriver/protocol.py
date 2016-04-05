import contextlib
import httplib
import json
import pytest
import types

import webdriver


class HTTPRequest(object):
    def __init__(self, host, port):
        self.host = host
        self.port = port

    def head(self, path):
        return self._request("HEAD", path)

    def get(self, path):
        return self._request("GET", path)

    @contextlib.contextmanager
    def _request(self, method, path):
        conn = httplib.HTTPConnection(self.host, self.port)
        try:
            conn.request(method, path)
            yield conn.getresponse()
        finally:
            conn.close()


@pytest.fixture
def http(request, session):
    return HTTPRequest(session.transport.host, session.transport.port)


def test_provides_http(http):
    # 4.0
    with http.head("/") as resp:
        assert resp.status == 404


def test_send_an_error(http):
    # 4.3 send an error, steps 1-5
    with http.get("/cream") as resp:
        assert resp.status == 404
        body = json.load(resp)
    assert "error" in body
    assert "message" in body
    assert "stacktrace" in body
    assert isinstance(body["error"], types.StringTypes)
    assert isinstance(body["message"], types.StringTypes)
    assert isinstance(body["stacktrace"], types.StringTypes)
    assert body["error"] == "unknown command"


def test_unknown_command(http, session):
    # 4.3 step 3
    with http.head("/foo") as resp:
        assert resp.status == 404
    with http.get("/foo") as resp:
        assert resp.status == 404

    # jump to step 1
    session.url


def test_invalid_session_id(http, session):
    # 4.3 step 5
    with http.get("/session/foo/url") as resp:
        assert resp.status == 404
        body = json.load(resp)
    assert body["error"] == "invalid session id"

    # jump to step 1
    session.url


def test_new_session(session):
    # 4.3 step 5
    session.end()
    assert session.session_id is None
    session.start()
    assert session.session_id is not None


def test_malformed_body_on_post(session):
    # 4.3 step 6
    session.start()
    with pytest.raises(webdriver.InvalidArgumentException):
        session.send_command("POST", "url", body="foo")
    with pytest.raises(webdriver.InvalidArgumentException):
        session.send_command("POST", "url", body="true")
    with pytest.raises(webdriver.InvalidArgumentException):
        session.send_command("POST", "url", body="[]")


def test_error_from_command(session):
    # 4.3 step 8
    session.start()
    with pytest.raises(webdriver.InvalidArgumentException):
        session.send_command("POST", "url", body={"foo": "bar"})


def test_success_loop(session):
    # 4.3 step 10
    session.url
    session.url


def test_match_a_request_unknown_command(session):
    # 4.4 match a request, steps 1-3
    session.start()
    with pytest.raises(webdriver.UnknownCommandException):
        session.send_command("GET", "cottage")


def test_match_a_request_case_sensitive(session):
    """4.4 match a request, steps 4-5"""
    session.start()
    with pytest.raises(webdriver.UnknownCommandException):
        session.send_command("GET", "URL")
