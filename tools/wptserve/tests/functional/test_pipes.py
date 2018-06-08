from .conftest import doc_root
import os
import urllib2
import time
import json
import re
import pytest

wptserve = pytest.importorskip("wptserve")


def test_status(server, request):
    resp = request("/document.txt", query="pipe=status(202)")
    assert resp.getcode() == 202


def test_header_not_set(server, request):
    resp = request("/document.txt", query="pipe=header(X-TEST,PASS)")
    assert resp.info()["X-TEST"] == "PASS"


def test_header_set(server, request):
    resp = request("/document.txt", query="pipe=header(Content-Type,text/html)")
    assert resp.info()["Content-Type"] == "text/html"


def test_header_multiple(server, request):
    resp = request("/document.txt", query="pipe=header(X-Test,PASS)|header(Content-Type,text/html)")
    assert resp.info()["X-TEST"] == "PASS"
    assert resp.info()["Content-Type"] == "text/html"


def test_header_multiple_same(server, request):
    resp = request("/document.txt", query="pipe=header(Content-Type,FAIL)|header(Content-Type,text/html)")
    assert resp.info()["Content-Type"] == "text/html"


def test_header_multiple_append(server, request):
    resp = request("/document.txt", query="pipe=header(X-Test,1)|header(X-Test,2,True)")
    assert resp.info()["X-Test"] == "1, 2"


def test_slice_both_bounds(server, request):
    resp = request("/document.txt", query="pipe=slice(1,10)")
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert resp.read() == expected[1:10]


def test_slice_no_upper(server, request):
    resp = request("/document.txt", query="pipe=slice(1)")
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert resp.read() == expected[1:]


def test_slice_no_lower(server, request):
    resp = request("/document.txt", query="pipe=slice(null,10)")
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert resp.read() == expected[:10]


def test_sub_config(server, request):
    resp = request("/sub.txt", query="pipe=sub")
    expected = "localhost localhost %i" % server.port
    assert resp.read().rstrip() == expected


def test_sub_file_hash(server, request):
    resp = request("/sub_file_hash.sub.txt")
    expected = """
md5: JmI1W8fMHfSfCarYOSxJcw==
sha1: nqpWqEw4IW8NjD6R375gtrQvtTo=
sha224: RqQ6fMmta6n9TuA/vgTZK2EqmidqnrwBAmQLRQ==
sha256: G6Ljg1uPejQxqFmvFOcV/loqnjPTW5GSOePOfM/u0jw=
sha384: lkXHChh1BXHN5nT5BYhi1x67E1CyYbPKRKoF2LTm5GivuEFpVVYtvEBHtPr74N9E
sha512: r8eLGRTc7ZznZkFjeVLyo6/FyQdra9qmlYCwKKxm3kfQAswRS9+3HsYk3thLUhcFmmWhK4dXaICz
JwGFonfXwg=="""
    assert resp.read().rstrip() == expected.strip()


def test_sub_file_hash_unrecognized(server, request):
    with pytest.raises(urllib2.HTTPError):
        request("/sub_file_hash_unrecognized.sub.txt")


def test_sub_headers(server, request):
    resp = request("/sub_headers.txt", query="pipe=sub", headers={"X-Test": "PASS"})
    expected = "PASS"
    assert resp.read().rstrip() == expected


def test_sub_location(server, request):
    resp = request("/sub_location.sub.txt?query_string")
    expected = """
host: localhost:{0}
hostname: localhost
path: /sub_location.sub.txt
pathname: /sub_location.sub.txt
port: {0}
query: ?query_string
scheme: http
server: http://localhost:{0}""".format(server.port)
    assert resp.read().rstrip() == expected.strip()


def test_sub_params(server, request):
    resp = request("/sub_params.txt", query="test=PASS&pipe=sub")
    expected = "PASS"
    assert resp.read().rstrip() == expected


def test_sub_url_base(server, request):
    resp = request("/sub_url_base.sub.txt")
    assert resp.read().rstrip() == "Before / After"


def test_sub_uuid(server, request):
    resp = request("/sub_uuid.sub.txt")
    # assertRegexpMatches(resp.read().rstrip(), r"Before [a-f0-9-]+ After")
    assert re.search("Before [a-f0-9-]+ After", resp.read().rstrip())


def test_sub_var(server, request):
    resp = request("/sub_var.sub.txt")
    port = server.port
    expected = "localhost %s A %s B localhost C" % (port, port)
    assert resp.read().rstrip() == expected


def test_trickle(server, request):
    #Actually testing that the response trickles in is not that easy
    t0 = time.time()
    resp = request("/document.txt", query="pipe=trickle(1:d2:5:d1:r2)")
    t1 = time.time()
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert resp.read() == expected
    assert 6 > t1-t0


def test_trickle_headers(server, request):
    resp = request("/document.txt", query="pipe=trickle(d0.01)")
    assert resp.info()["Cache-Control"] == "no-cache, no-store, must-revalidate"
    assert resp.info()["Pragma"] == "no-cache"
    assert resp.info()["Expires"] == "0"


def test_with_python_file_handler(server, request):
    resp = request("/test_string.py", query="pipe=slice(null,2)")
    assert resp.read() == "PA"


def test_with_python_func_handler(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return "PASS"
    route = ("GET", "/test/test_pipes_1/", handler)
    server.router.register(*route)
    resp = request(route[1], query="pipe=slice(null,2)")
    assert resp.read() == "PA"


def test_with_python_func_handler_using_response_writer(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        response.writer.write_content("PASS")
    route = ("GET", "/test/test_pipes_1/", handler)
    server.router.register(*route)
    resp = request(route[1], query="pipe=slice(null,2)")
    # slice has not been applied to the response, because response.writer was used.
    assert resp.read() == "PASS"


def test_header_pipe_with_python_func_using_response_writer(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        response.writer.write_content("CONTENT")
    route = ("GET", "/test/test_pipes_1/", handler)
    server.router.register(*route)
    resp = request(route[1], query="pipe=header(X-TEST,FAIL)")
    # header pipe was ignored, because response.writer was used.
    assert not resp.info().get("X-TEST")
    assert resp.read() == "CONTENT"


def test_with_json_handler(server, request):
    @wptserve.handlers.json_handler
    def handler(request, response):
        return json.dumps({'data': 'PASS'})
    route = ("GET", "/test/test_pipes_2/", handler)
    server.router.register(*route)
    resp = request(route[1], query="pipe=slice(null,2)")
    assert resp.read() == '"{'


def test_slice_with_as_is_handler(server, request):
    resp = request("/test.asis", query="pipe=slice(null,2)")
    assert 202 == resp.getcode()
    assert "Giraffe" == resp.msg
    assert "PASS" == resp.info()["X-Test"]
    # slice has not been applied to the response, because response.writer was used.
    assert "Content" == resp.read()


def test_headers_with_as_is_handler(server, request):
    resp = request("/test.asis", query="pipe=header(X-TEST,FAIL)")
    assert 202 == resp.getcode()
    assert "Giraffe" == resp.msg
    # header pipe was ignored.
    assert "PASS" == resp.info()["X-TEST"]
    assert "Content" == resp.read()


def test_trickle_with_as_is_handler(server, request):
    t0 = time.time()
    resp = request("/test.asis", query="pipe=trickle(1:d2:5:d1:r2)")
    t1 = time.time()
    assert 'Content' in resp.read()
    assert 6 > t1-t0
