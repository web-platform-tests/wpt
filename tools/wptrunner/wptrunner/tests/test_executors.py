# mypy: allow-untyped-defs

import socket
from http.client import HTTPException
from unittest import mock

import pytest

from .. import wpttest
from ..browsers.base import ExecutorBrowser
from ..executors import base, protocol

@pytest.mark.parametrize("ranges_value, total_pages, expected", [
    ([], 3, {1, 2, 3}),
    ([[1, 2]], 3, {1, 2}),
    ([[1], [3, 4]], 5, {1, 3, 4}),
    ([[1],[3]], 5, {1, 3}),
    ([[2, None]], 5, {2, 3, 4, 5}),
    ([[None, 2]], 5, {1, 2}),
    ([[None, 2], [2, None]], 5, {1, 2, 3, 4, 5}),
    ([[1], [6, 7], [8]], 5, {1})])
def test_get_pages_valid(ranges_value, total_pages, expected):
    assert base.get_pages(ranges_value, total_pages) == expected


def make_wdspec_test():
    return wpttest.WdspecTest("/",
                              "/tests",
                              "/foo/test_foo.py",
                              inherit_metadata=[],
                              test_metadata=None,
                              path="foo/test_foo.py")


@pytest.fixture
def executor(logger):
    return base.PytestExecutor(logger,
                               ExecutorBrowser(host="127.0.0.1", port=0, pac=None),
                               {},
                               webdriver_binary=None,
                               webdriver_args=None,
                               target_platform="linux")


@pytest.mark.parametrize("alive", [True, False])
@pytest.mark.parametrize("harness_status", ["OK", "ERROR", "INTERNAL-ERROR"])
def test_pytest_executor_checks_alive(executor, alive, harness_status):
    data = (harness_status, "message", None, {"key": "value"}, "stack")
    subtests = [("sub", "ERROR", "ConnectionRefusedError")]
    with mock.patch.object(executor, "is_alive", return_value=alive), \
         mock.patch.object(base, "PytestRun") as run:
        run.return_value.run.return_value = (True, (data, subtests))
        result, subtest_results = executor.do_test(make_wdspec_test())

    assert result.status == (harness_status if alive else "CRASH")
    assert result.message == "message"
    assert result.extra == {"key": "value"}
    assert result.stack == "stack"
    assert [(s.name, s.status) for s in subtest_results] == [("sub", "ERROR")]


@pytest.mark.parametrize("alive", [True, False])
def test_pytest_executor_failed_run_checks_alive(executor, alive):
    with mock.patch.object(executor, "is_alive", return_value=alive), \
         mock.patch.object(base, "PytestRun") as run:
        run.return_value.run.return_value = (False, ("EXTERNAL-TIMEOUT", None))
        result, subtest_results = executor.do_test(make_wdspec_test())

    assert result.status == ("EXTERNAL-TIMEOUT" if alive else "CRASH")
    assert subtest_results == []


def test_pytest_executor_crash_skips_alive_check(executor):
    with mock.patch.object(executor, "is_alive") as is_alive, \
         mock.patch.object(base, "PytestRun") as run:
        run.return_value.run.return_value = (False, ("CRASH", None))
        result, _ = executor.do_test(make_wdspec_test())

    assert result.status == "CRASH"
    is_alive.assert_not_called()


@pytest.mark.parametrize("method", ["request", "getresponse"])
@pytest.mark.parametrize("exc", [ConnectionRefusedError, socket.timeout, HTTPException])
def test_pytest_protocol_connection_failure_is_dead(executor, method, exc):
    with mock.patch.object(protocol, "HTTPConnection") as conn_cls:
        getattr(conn_cls.return_value, method).side_effect = exc
        alive = protocol.PytestProtocol(executor, executor.browser).is_alive()

    assert alive is False
    conn_cls.return_value.close.assert_called_once_with()


@pytest.mark.parametrize("status, expected", [(404, True), (200, False), (500, False)])
def test_pytest_protocol_alive_only_for_404(executor, status, expected):
    with mock.patch.object(protocol, "HTTPConnection") as conn_cls:
        conn_cls.return_value.getresponse.return_value.status = status
        alive = protocol.PytestProtocol(executor, executor.browser).is_alive()

    assert alive is expected
    conn_cls.assert_called_once_with("127.0.0.1", 0, timeout=2)
    conn_cls.return_value.request.assert_called_once_with("HEAD", "/invalid")
    conn_cls.return_value.close.assert_called_once_with()
