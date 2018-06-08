import pytest
from six.moves.urllib.error import HTTPError

wptserve = pytest.importorskip("wptserve")


def test__filehandler_not_handled(server, request):
    with pytest.raises(HTTPError) as cm:
        request("/not_existing")

    assert cm.value.code == 404


def test__rewriter_rewrite(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return request.request_path

    route = ("GET", "/test/rewritten", handler)
    server.rewriter.register("GET", "/test/original", route[1])
    server.router.register(*route)
    resp = request("/test/original")
    assert 200 == resp.getcode()
    assert "/test/rewritten" == resp.read()


def test_request_handler_exception(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        raise Exception

    route = ("GET", "/test/raises", handler)
    server.router.register(*route)
    with pytest.raises(HTTPError) as cm:
        request("/test/raises")

    assert cm.value.code == 500
