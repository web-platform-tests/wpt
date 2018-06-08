import pytest

wptserve = pytest.importorskip("wptserve")
from wptserve.request import InputFile


def test_seek(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        rv = []
        f = request.raw_input
        f.seek(5)
        rv.append(f.read(2))
        rv.append(f.tell())
        f.seek(0)
        rv.append(f.readline())
        rv.append(f.tell())
        rv.append(f.read(-1))
        rv.append(f.tell())
        f.seek(0)
        rv.append(f.read())
        f.seek(0)
        rv.extend(f.readlines())

        return " ".join(str(item) for item in rv)

    route = ("POST", "/test/test_seek", handler)
    server.router.register(*route)
    resp = request(route[1], method="POST", body="12345ab\ncdef")
    assert resp.getcode() == 200
    assert resp.read().split(" ") == ["ab", "7", "12345ab\n", "8", "cdef", "12", "12345ab\ncdef", "12345ab\n", "cdef"]


def test_seek_input_longer_than_buffer(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        rv = []
        f = request.raw_input
        f.seek(5)
        rv.append(f.read(2))
        rv.append(f.tell())
        f.seek(0)
        rv.append(f.tell())
        rv.append(f.tell())
        return " ".join(str(item) for item in rv)

    route = ("POST", "/test/test_seek", handler)
    server.router.register(*route)

    old_max_buf = InputFile.max_buffer_size
    InputFile.max_buffer_size = 10
    try:
        resp = request(route[1], method="POST", body="1"*20)
        assert resp.getcode() == 200
        assert resp.read().split(" ") == ["11", "7", "0", "0"]
    finally:
        InputFile.max_buffer_size = old_max_buf


def test_iter(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        f = request.raw_input
        return " ".join(line for line in f)

    route = ("POST", "/test/test_iter", handler)
    server.router.register(*route)
    resp = request(route[1], method="POST", body="12345\nabcdef\r\nzyxwv")
    assert resp.getcode() == 200
    assert resp.read().split(" ") == ["12345\n", "abcdef\r\n", "zyxwv"]


def test_iter_input_longer_than_buffer(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        f = request.raw_input
        return " ".join(line for line in f)

    route = ("POST", "/test/test_iter", handler)
    server.router.register(*route)

    old_max_buf = InputFile.max_buffer_size
    InputFile.max_buffer_size = 10
    try:
        resp = request(route[1], method="POST", body="12345\nabcdef\r\nzyxwv")
        assert resp.getcode() == 200
        assert resp.read().split(" ") == ["12345\n", "abcdef\r\n", "zyxwv"]
    finally:
        InputFile.max_buffer_size = old_max_buf


def test_request_body(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        request.raw_input.seek(5)
        return request.body

    route = ("POST", "/test/test_body", handler)
    server.router.register(*route)
    resp = request(route[1], method="POST", body="12345ab\ncdef")
    assert resp.read() == "12345ab\ncdef"


def test_request_route_match(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return request.route_match["match"] + " " + \
            request.route_match["*"]

    route = ("GET", "/test/{match}_*", handler)
    server.router.register(*route)
    resp = request("/test/some_route")
    assert resp.read() == "some route"


def test_auth(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return " ".join((request.auth.username, request.auth.password))

    route = ("GET", "/test/test_auth", handler)
    server.router.register(*route)
    resp = request(route[1], auth=("test", "PASS"))
    assert resp.getcode() == 200
    assert resp.read().split(" ") == ["test", "PASS"]
