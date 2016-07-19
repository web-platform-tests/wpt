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


@pytest.fixture
def new_session(session):
    session.end()
    assert session.session_id is None
    return session


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


def test_unknown_command(http, new_session):
    # 4.3 step 3
    with http.head("/foo") as resp:
        assert resp.status == 404
    with http.get("/foo") as resp:
        assert resp.status == 404

    # jump to step 1
    new_session.url


def test_invalid_session_id(http, new_session):
    # 4.3 step 5
    with http.get("/session/foo/url") as resp:
        assert resp.status == 404
        body = json.load(resp)
    assert body["error"] == "invalid session id"

    # jump to step 1
    new_session.url


def test_new_session(new_session):
    # 4.3 step 5
    assert new_session.session_id is None
    new_session.start()
    assert new_session.session_id is not None


def test_malformed_body_on_post(new_session):
    # 4.3 step 6
    new_session.start()
    with pytest.raises(webdriver.InvalidArgumentException):
        new_session.send_command("POST", "url", body="foo")
    with pytest.raises(webdriver.InvalidArgumentException):
        new_session.send_command("POST", "url", body="true")
    with pytest.raises(webdriver.InvalidArgumentException):
        new_session.send_command("POST", "url", body="[]")

    # jump to step 1
    new_session.url


def test_error_from_command(new_session):
    # 4.3 step 8
    new_session.start()
    with pytest.raises(webdriver.InvalidArgumentException):
        new_session.send_command("POST", "url", body={"foo": "bar"})


def test_success_loop(new_session):
    # 4.3 step 10
    new_session.url
    new_session.url


def test_match_a_request_unknown_command(new_session):
    # 4.4 match a request, steps 1-3
    new_session.start()
    with pytest.raises(webdriver.UnknownCommandException):
        new_session.send_command("GET", "cottage")


def test_match_a_request_case_sensitive(new_session):
    """4.4 match a request, steps 4-5"""
    new_session.start()
    with pytest.raises(webdriver.UnknownCommandException):
        new_session.send_command("GET", "URL")
