import logging
import pathlib
import re
import time
from abc import ABC, abstractmethod
from typing import IO, Optional, TypeVar, Generic
from urllib.parse import urlsplit

import requests
import urllib3

from .utils import get_ext

logger = logging.getLogger(__name__)


def should_retry(status: int) -> bool:
    if 500 <= status <= 599:
        return True
    if status in {408, 429}:
        return True

    return False


T = TypeVar("T")


class GetRetry(ABC, Generic[T]):
    """Base class for implementing retryable get logic"""

    def before_retry(self) -> None:
        """Lifecycle method called before starting a get() attempt"""
        ...

    @abstractmethod
    def handle_resp(self, resp: requests.Response) -> T:
        """Lifecycle method called once we have a valid response.

        Reading the response body inside this method allows for retries in case
        the connection is dropped during the reads.
        """
        ...

    def on_exc(self, exc: BaseException, retryable: bool) -> None:
        """Lifecycle method called in case there's an exception

        This is called both for exceptions that could be retried,
        and fatal exceptions."""
        ...

    def __call__(self, url: str, max_retries: int = 5) -> T:
        if max_retries < 1:
            max_retries = 1
        wait = 2
        logger.info(f"Downloading {url}")
        for current_retry in range(1, max_retries + 1):
            try:
                logger.debug(
                    "Downloading %s Try %d/%d" % (url, current_retry, max_retries)
                )
                self.before_retry()
                resp = requests.get(url, stream=True)
                resp.raise_for_status()
                return self.handle_resp(resp)
            except (
                # All the requests errors that are about the connection or the response
                # rather than an invalid request
                requests.HTTPError,
                requests.exceptions.ConnectionError,
                requests.exceptions.ChunkedEncodingError,
                requests.exceptions.ContentDecodingError,
                requests.exceptions.RetryError,
                requests.exceptions.Timeout,
                urllib3.exceptions.HTTPError,
            ) as e:
                retry = False
                if current_retry < max_retries:
                    retry = True
                    if isinstance(e, requests.HTTPError):
                        if not should_retry(e.response.status_code):
                            retry = False

                self.on_exc(e, retry)

                if retry:
                    logger.error(f"Fetch error: {e}. Retrying after {wait}s...")
                    time.sleep(wait)
                    wait *= 2
                    continue

                # Maximum retries or fatal error
                raise
            except Exception as e:
                self.on_exc(e, False)
                raise

        raise RuntimeError("Code should be unreachable")


def get_download_filename(resp: requests.Response, default: str) -> str:
    """Get the filename from a requests.Response, or default"""
    filename = None

    content_disposition = resp.headers.get("content-disposition")
    if content_disposition:
        filenames = re.findall("filename=(.+)", content_disposition)
        if filenames:
            filename = filenames[0]

    if not filename:
        filename = urlsplit(resp.url).path.rsplit("/", 1)[1]

    return filename or default


def get(url: str) -> requests.Response:
    """Issue GET request to a given URL and return the response."""

    logger.debug("GET %s" % url)
    resp = requests.get(url, stream=True)
    resp.raise_for_status()
    return resp


class GetCheckStatus(GetRetry[bool]):
    def handle_resp(self, resp: requests.Response) -> bool:
        resp.close()
        return True


def check_status(url: str) -> bool:
    """Check if a HTTP request returns a non-error status code"""
    try:
        return GetCheckStatus()(url)
    except requests.RequestException:
        return False


class GetToResp(GetRetry[requests.Response]):
    def handle_resp(self, resp: requests.Response) -> requests.Response:
        return resp


def get_retry(url: str, max_retries: int = 5) -> requests.Response:
    """Issue GET request to a given URL and return the response."""
    return GetToResp()(url, max_retries)


class GetToFile(GetRetry[pathlib.Path]):
    def __init__(
        self, dest: pathlib.Path, default_filename: str, rename: Optional[str] = None
    ):
        self.dest = dest
        self.default_filename = default_filename
        self.rename = rename
        self.dest_path: Optional[pathlib.Path] = None

    def handle_resp(self, resp: requests.Response) -> pathlib.Path:
        filename = get_download_filename(resp, self.default_filename)
        if self.rename:
            filename = "%s%s" % (self.rename, get_ext(filename))

        self.dest_path = self.dest / filename

        with open(self.dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=64 * 1024):
                f.write(chunk)
        return self.dest_path

    def on_exc(self, exc: BaseException, retryable: bool) -> None:
        if self.dest_path is not None:
            try:
                self.dest_path.unlink()
            except OSError:
                pass


def get_download_to_file(
    url: str,
    dest: pathlib.Path,
    default_filename: str,
    rename: Optional[str] = None,
    max_retries: int = 5,
) -> pathlib.Path:
    """Download to a given path.

    By default the filename is taken from the content-disposition header in the response

    :param url: The URL to download
    :param dest: A Path representing the output directory
    :param default_filename: The filename to use if it can't be derived from the response
    :param rename: A filename to use instead of the response (or default) filename. The extension
    from the response (or default) is still used
    :param max_retries: The number of times to retry the download in case of error
    :returns: The Path of the downloaded file
    """
    fetcher = GetToFile(dest, default_filename, rename)
    return fetcher(url, max_retries)


class GetToDescriptor(GetRetry[None]):
    def __init__(self, fd: IO[bytes]):
        self.fd = fd

    def before_retry(self) -> None:
        self.fd.seek(0)
        self.fd.truncate(0)

    def handle_resp(self, resp: requests.Response) -> None:
        for chunk in resp.iter_content(16 * 1024):
            self.fd.write(chunk)
        self.fd.flush()
        self.fd.seek(0)


def get_download_to_descriptor(fd: IO[bytes], url: str, max_retries: int = 5) -> None:
    """Download an URL in chunks and saves it to a file descriptor (truncating it)
    It doesn't close the descriptor, but flushes it on success.
    It retries the download up to max_retries.
    This function is meant to download big files directly to the disk without
    caching the whole file in memory.
    """
    fetcher = GetToDescriptor(fd)
    fetcher(url, max_retries)
