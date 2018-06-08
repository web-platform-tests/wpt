import pytest

wptserve = pytest.importorskip("wptserve")


def test_name_value(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        response.set_cookie("name", "value")
        return "Test"

    route = ("GET", "/test/name_value", handler)
    server.router.register(*route)
    resp = request(route[1])

    assert resp.info()["Set-Cookie"] == "name=value; Path=/"


def test_unset(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        response.set_cookie("name", "value")
        response.unset_cookie("name")
        return "Test"

    route = ("GET", "/test/unset", handler)
    server.router.register(*route)
    resp = request(route[1])

    assert "Set-Cookie" not in resp.info()


def test_delete(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        response.delete_cookie("name")
        return "Test"

    route = ("GET", "/test/delete", handler)
    server.router.register(*route)
    resp = request(route[1])

    parts = dict(item.split("=") for
                 item in resp.info()["Set-Cookie"].split("; ") if item)

    assert parts["name"] == ""
    assert parts["Path"] == "/"
    # Should also check that expires is in the past


def test_set_cookie(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return request.cookies["name"].value

    route = ("GET", "/test/set_cookie", handler)
    server.router.register(*route)
    resp = request(route[1], headers={"Cookie": "name=value"})
    assert resp.read() == b"value"
