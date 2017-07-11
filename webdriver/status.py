import pytest


def assert_status_response(http_status, res):
        assert http_status == 200
        assert res["ready"] in [True, False]
        assert isinstance(res["message"], basestring)


# TODO: figure out if geckodriver supports sessionless status
# currently response body for GET /status without a session is
# coming back empty
def test_get_status_no_session(http):
    # with http.get("status", use_json=True) as result:
        # [status, obj] = result
        # assert_status_response(status, obj)
    pass


def test_get_status_with_session(session):
    response = session.transport.send("GET", "status")
    result = response.body["value"]
    assert_status_response(response.status, result)
