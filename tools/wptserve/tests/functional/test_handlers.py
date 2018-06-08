from .conftest import doc_root
import json
import os
import sys
import uuid

import pytest
from six.moves.urllib.error import HTTPError

wptserve = pytest.importorskip("wptserve")


def test_filehandler_GET(server, request):
    resp = request("/document.txt")
    assert 200 == resp.getcode()
    assert "text/plain" == resp.info()["Content-Type"]
    assert open(os.path.join(doc_root, "document.txt"), 'rb').read() == resp.read()


def test_filehandler_headers(server, request):
    resp = request("/with_headers.txt")
    assert 200 == resp.getcode()
    assert "text/html" == resp.info()["Content-Type"]
    assert "PASS" == resp.info()["Custom-Header"]
    # This will fail if it isn't a valid uuid
    uuid.UUID(resp.info()["Another-Header"])
    assert resp.info()["Same-Value-Header"] == resp.info()["Another-Header"]
    assert resp.info()["Double-Header"] == "PA, SS"


def test_filehandler_range(server, request):
    resp = request("/document.txt", headers={"Range":"bytes=10-19"})
    assert 206 == resp.getcode()
    data = resp.read()
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert 10 == len(data)
    assert "bytes 10-19/%i" % len(expected) == resp.info()['Content-Range']
    assert "10" == resp.info()['Content-Length']
    assert expected[10:20] == data


def test_filehandler_range_no_end(server, request):
    resp = request("/document.txt", headers={"Range":"bytes=10-"})
    assert 206 == resp.getcode()
    data = resp.read()
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert len(expected) - 10 == len(data)
    assert "bytes 10-%i/%i" % (len(expected) - 1, len(expected)) == resp.info()['Content-Range']
    assert expected[10:] == data


def test_filehandler_range_no_start(server, request):
    resp = request("/document.txt", headers={"Range":"bytes=-10"})
    assert 206 == resp.getcode()
    data = resp.read()
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert 10 == len(data)
    assert "bytes %i-%i/%i" % (len(expected) - 10, len(expected) - 1, len(expected)) == resp.info()['Content-Range']
    assert expected[-10:] == data


def test_filehandler_multiple_ranges(server, request):
    resp = request("/document.txt", headers={"Range":"bytes=1-2,5-7,6-10"})
    assert 206 == resp.getcode()
    data = resp.read()
    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    assert resp.info()["Content-Type"].startswith("multipart/byteranges; boundary=")
    boundary = resp.info()["Content-Type"].split("boundary=")[1]
    parts = data.split("--" + boundary)
    assert "\r\n" == parts[0]
    assert "--" == parts[-1]
    expected_parts = [("1-2", expected[1:3]), ("5-10", expected[5:11])]
    for expected_part, part in zip(expected_parts, parts[1:-1]):
        header_string, body = part.split("\r\n\r\n")
        headers = dict(item.split(": ", 1) for item in header_string.split("\r\n") if item.strip())
        assert headers["Content-Type"] == "text/plain"
        assert headers["Content-Range"] == "bytes %s/%i" % (expected_part[0], len(expected))
        assert expected_part[1] + "\r\n" == body


def test_filehandler_range_invalid(server, request):
    with pytest.raises(HTTPError) as cm:
        request("/document.txt", headers={"Range":"bytes=11-10"})
    assert cm.value.code == 416

    expected = open(os.path.join(doc_root, "document.txt"), 'rb').read()
    with pytest.raises(HTTPError) as cm:
        request("/document.txt", headers={"Range":"bytes=%i-%i" % (len(expected), len(expected) + 10)})
    assert cm.value.code == 416


def test_filehandler_sub_config(server, request):
    resp = request("/sub.sub.txt")
    expected = b"localhost localhost %i" % server.port
    assert resp.read().rstrip() == expected


def test_filehandler_sub_headers(server, request):
    resp = request("/sub_headers.sub.txt", headers={"X-Test": "PASS"})
    expected = b"PASS"
    assert resp.read().rstrip() == expected


def test_filehandler_sub_params(server, request):
    resp = request("/sub_params.sub.txt", query="test=PASS")
    expected = b"PASS"
    assert resp.read().rstrip() == expected


def test_function_handler_string_rv(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return "test data"

    route = ("GET", "/test/test_string_rv", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert 200 == resp.getcode()
    assert "9" == resp.info()["Content-Length"]
    assert "test data" == resp.read()


def test_function_handler_tuple_1_rv(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return ()

    route = ("GET", "/test/test_tuple_1_rv", handler)
    server.router.register(*route)

    with pytest.raises(HTTPError) as cm:
        request(route[1])

    assert cm.value.code == 500


def test_function_handler_tuple_2_rv(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return [("Content-Length", 4), ("test-header", "test-value")], "test data"

    route = ("GET", "/test/test_tuple_2_rv", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert 200 == resp.getcode()
    assert "4" == resp.info()["Content-Length"]
    assert "test-value" == resp.info()["test-header"]
    assert "test" == resp.read()


def test_function_handler_tuple_3_rv(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return 202, [("test-header", "test-value")], "test data"

    route = ("GET", "/test/test_tuple_3_rv", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert 202 == resp.getcode()
    assert "test-value" == resp.info()["test-header"]
    assert "test data" == resp.read()


def test_function_handler_tuple_3_rv_1(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return (202, "Some Status"), [("test-header", "test-value")], "test data"

    route = ("GET", "/test/test_tuple_3_rv_1", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert 202 == resp.getcode()
    assert "Some Status" == resp.msg
    assert "test-value" == resp.info()["test-header"]
    assert "test data" == resp.read()


def test_function_handler_tuple_4_rv(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return 202, [("test-header", "test-value")], "test data", "garbage"

    route = ("GET", "/test/test_tuple_1_rv", handler)
    server.router.register(*route)

    with pytest.raises(HTTPError) as cm:
        request(route[1])

    assert cm.value.code == 500


def test_function_handler_none_rv(server, request):
    @wptserve.handlers.handler
    def handler(request, response):
        return None

    route = ("GET", "/test/test_none_rv", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert resp.getcode() == 200
    assert "Content-Length" not in resp.info()
    assert resp.read() == b""


def test_json_handler_json_0(server, request):
    @wptserve.handlers.json_handler
    def handler(request, response):
        return {"data": "test data"}

    route = ("GET", "/test/test_json_0", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert 200 == resp.getcode()
    assert {"data": "test data"} == json.load(resp)


def test_json_handler_json_tuple_2(server, request):
    @wptserve.handlers.json_handler
    def handler(request, response):
        return [("Test-Header", "test-value")], {"data": "test data"}

    route = ("GET", "/test/test_json_tuple_2", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert 200 == resp.getcode()
    assert "test-value" == resp.info()["test-header"]
    assert {"data": "test data"} == json.load(resp)


def test_json_handler_json_tuple_3(server, request):
    @wptserve.handlers.json_handler
    def handler(request, response):
        return (202, "Giraffe"), [("Test-Header", "test-value")], {"data": "test data"}

    route = ("GET", "/test/test_json_tuple_2", handler)
    server.router.register(*route)
    resp = request(route[1])
    assert 202 == resp.getcode()
    assert "Giraffe" == resp.msg
    assert "test-value" == resp.info()["test-header"]
    assert {"data": "test data"} == json.load(resp)


def test_python_handler_string(server, request):
    resp = request("/test_string.py")
    assert 200 == resp.getcode()
    assert "text/plain" == resp.info()["Content-Type"]
    assert "PASS" == resp.read()


def test_python_handler_tuple_2(server, request):
    resp = request("/test_tuple_2.py")
    assert 200 == resp.getcode()
    assert "text/html" == resp.info()["Content-Type"]
    assert "PASS" == resp.info()["X-Test"]
    assert "PASS" == resp.read()


def test_python_handler_tuple_3(server, request):
    resp = request("/test_tuple_3.py")
    assert 202 == resp.getcode()
    assert "Giraffe" == resp.msg
    assert "text/html" == resp.info()["Content-Type"]
    assert "PASS" == resp.info()["X-Test"]
    assert "PASS" == resp.read()


def test_python_handler_import(server, request):
    dir_name = os.path.join(doc_root, "subdir")
    assert dir_name not in sys.path
    assert "test_module" not in sys.modules
    resp = request("/subdir/import_handler.py")
    assert dir_name not in sys.path
    assert "test_module" not in sys.modules
    assert 200 == resp.getcode()
    assert "text/plain" == resp.info()["Content-Type"]
    assert "PASS" == resp.read()


def test_python_handler_no_main(server, request):
    with pytest.raises(HTTPError) as cm:
        request("/no_main.py")

    assert cm.value.code == 500


def test_python_handler_invalid(server, request):
    with pytest.raises(HTTPError) as cm:
        request("/invalid.py")

    assert cm.value.code == 500


def test_python_handler_missing(server, request):
    with pytest.raises(HTTPError) as cm:
        request("/missing.py")

    assert cm.value.code == 404


def test_directory_handler_directory(server, request):
    resp = request("/")
    assert 200 == resp.getcode()
    assert "text/html" == resp.info()["Content-Type"]
    #Add a check that the response is actually sane


def test_directory_handler_subdirectory_trailing_slash(server, request):
    resp = request("/subdir/")
    assert resp.getcode() == 200
    assert resp.info()["Content-Type"] == "text/html"


def test_directory_handler_subdirectory_no_trailing_slash(server, request):
    # This seems to resolve the 301 transparently, so test for 200
    resp = request("/subdir")
    assert resp.getcode() == 200
    assert resp.info()["Content-Type"] == "text/html"


def test_directory_handler_as_is(server, request):
    resp = request("/test.asis")
    assert 202 == resp.getcode()
    assert "Giraffe" == resp.msg
    assert "PASS" == resp.info()["X-Test"]
    assert "Content" == resp.read()
    #Add a check that the response is actually sane
