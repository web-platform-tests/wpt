# mypy: allow-untyped-defs

import io
from typing import Tuple
from unittest import mock

import pytest
import requests

from tools.wpt import httputils


def make_resp(
    status: int = 200,
    body: Tuple[bytes, ...] = (b"part", b"data"),
    fail_stream: bool = False,
    url: str = "http://example/file.zip",
) -> requests.models.Response:
    resp = requests.models.Response()
    resp.status_code = status
    resp.url = url

    def iter_content(*args, **kwargs):
        yield body[0]
        if fail_stream:
            raise requests.exceptions.ChunkedEncodingError("connection dropped")
        yield from body[1:]

    resp.iter_content = iter_content  # type: ignore
    resp.close = lambda: None  # type: ignore
    return resp


@pytest.fixture
def mock_get():
    """Patch requests.get to return (or raise) items from a list, one per call."""
    with (
        mock.patch("tools.wpt.httputils.time.sleep"),
        mock.patch("tools.wpt.httputils.requests.get") as get,
    ):

        def set_responses(*responses):
            get.side_effect = list(responses)
            return get

        yield set_responses


@pytest.mark.parametrize(
    "status,expected",
    [
        (500, True),
        (503, True),
        (408, True),
        (429, True),
        (404, False),
        (403, False),
        (200, False),
    ],
)
def test_should_retry(status, expected):
    assert httputils.should_retry(status) is expected


def test_get_retry_retries_server_error(mock_get):
    get = mock_get(make_resp(503), make_resp(200))
    assert httputils.get_retry("http://example/").status_code == 200
    assert get.call_count == 2
    assert get.call_args.kwargs["stream"] is False


def test_get_retry_connection_error(mock_get):
    get = mock_get(requests.ConnectionError(), make_resp(200))
    assert httputils.get_retry("http://example/").status_code == 200
    assert get.call_count == 2


@pytest.mark.parametrize("failure", [make_resp(404), requests.exceptions.InvalidURL()])
def test_get_retry_no_retry_fatal(mock_get, failure):
    get = mock_get(*[failure] * 5)
    with pytest.raises(requests.RequestException):
        httputils.get_retry("http://example/")
    assert get.call_count == 1


def test_get_retry_max_retries(mock_get):
    get = mock_get(*[make_resp(503)] * 3)
    with pytest.raises(requests.HTTPError):
        httputils.get_retry("http://example/", max_retries=3)
    assert get.call_count == 3


@pytest.mark.parametrize(
    "responses,expected",
    [
        ([make_resp(200)], True),
        ([make_resp(404)], False),
        ([make_resp(503)] * 5, False),
        ([requests.ConnectionError()] * 5, False),
        ([requests.ConnectionError(), make_resp(200)], True),
    ],
)
def test_check_status(mock_get, responses, expected):
    get = mock_get(*responses)
    assert httputils.check_status("http://example/") is expected
    assert get.call_args.kwargs["stream"] is True


def test_download_to_file_retries_dropped_stream(mock_get, tmp_path):
    get = mock_get(make_resp(fail_stream=True), make_resp())
    path = httputils.get_download_to_file("http://example/", tmp_path, "default.zip")
    assert path == tmp_path / "file.zip"
    assert path.read_bytes() == b"partdata"
    assert get.call_count == 2
    assert get.call_args.kwargs["stream"] is True


def test_download_to_file_removes_partial_file(mock_get, tmp_path):
    mock_get(*[make_resp(fail_stream=True)] * 2)
    with pytest.raises(requests.exceptions.ChunkedEncodingError):
        httputils.get_download_to_file(
            "http://example/", tmp_path, "default.zip", max_retries=2
        )
    assert list(tmp_path.iterdir()) == []


def test_download_to_file_http_error(mock_get, tmp_path):
    get = mock_get(make_resp(404))
    with pytest.raises(requests.HTTPError):
        httputils.get_download_to_file("http://example/", tmp_path, "default.zip")
    assert get.call_count == 1


def test_download_to_file_no_retry_os_error(mock_get, tmp_path):
    get = mock_get(*[make_resp()] * 5)
    with pytest.raises(FileNotFoundError):
        httputils.get_download_to_file(
            "http://example/", tmp_path / "missing", "default.zip"
        )
    assert get.call_count == 1


@pytest.mark.parametrize(
    "url,headers,rename,expected",
    [
        ("http://example/file.tar.gz", {}, None, "file.tar.gz"),
        ("http://example/file.tar.gz", {}, "renamed", "renamed.tar.gz"),
        ("http://example/", {}, None, "default.zip"),
        (
            "http://example/",
            {"content-disposition": "attachment; filename=header.dmg"},
            None,
            "header.dmg",
        ),
    ],
)
def test_download_to_file_filename(mock_get, tmp_path, url, headers, rename, expected):
    resp = make_resp(url=url)
    resp.headers.update(headers)
    mock_get(resp)
    path = httputils.get_download_to_file(url, tmp_path, "default.zip", rename)
    assert path == tmp_path / expected


def test_download_to_descriptor_retries_dropped_stream(mock_get):
    get = mock_get(make_resp(fail_stream=True), make_resp())
    fd = io.BytesIO()
    httputils.get_download_to_descriptor(fd, "http://example/")
    # Data from the failed attempt is truncated and fd is rewound
    assert fd.read() == b"partdata"
    assert get.call_count == 2
    assert get.call_args.kwargs["stream"] is True


def test_download_to_descriptor_http_error(mock_get):
    get = mock_get(make_resp(404))
    with pytest.raises(requests.HTTPError):
        httputils.get_download_to_descriptor(io.BytesIO(), "http://example/")
    assert get.call_count == 1
