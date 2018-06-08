from types import MethodType

import pytest

wptserve = pytest.importorskip("wptserve")


def send_body_as_header(self):
    if self._response.add_required_headers:
        self.write_default_headers()

    self.write("X-Body: ")
    self._headers_complete = True


def test_head_without_body(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        response.writer.end_headers = MethodType(send_body_as_header,
                                                 response.writer,
                                                 wptserve.response.ResponseWriter)
        return [("X-Test", "TEST")], "body\r\n"

    route = ("GET", "/test/test_head_without_body", handler)
    server.router.register(*route)
    resp = request(route[1], method="HEAD")
    assert "6" == resp.info()['Content-Length']
    assert "TEST" == resp.info()['x-Test']
    assert "" == resp.info()['x-body']


def test_head_with_body(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        response.send_body_for_head_request = True
        response.writer.end_headers = MethodType(send_body_as_header,
                                                 response.writer,
                                                 wptserve.response.ResponseWriter)
        return [("X-Test", "TEST")], "body\r\n"

    route = ("GET", "/test/test_head_with_body", handler)
    server.router.register(*route)
    resp = request(route[1], method="HEAD")
    assert "6" == resp.info()['Content-Length']
    assert "TEST" == resp.info()['x-Test']
    assert "body" == resp.info()['X-Body']
