# mypy: allow-untyped-defs

import socket
import time

import pytest
from mozlog.structuredlog import StructuredLogger

from ..executors import base

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


class FakeProtocol:
    def __init__(self, alive=True):
        self._alive = alive

    def is_alive(self):
        return self._alive


def test_pytestrun_run_func_success():
    def do_pytest(path, timeout):
        return ("OK", None), []

    runner = base.PytestRun(StructuredLogger("test"), do_pytest, FakeProtocol(),
                            "/some/test.py", 10, 5)
    runner.run_func()
    assert runner.result == (True, (("OK", None), []))


def test_pytestrun_run_func_socket_timeout_with_alive_browser_reports_internal_error():
    def do_pytest(path, timeout):
        raise socket.timeout()

    runner = base.PytestRun(StructuredLogger("test"), do_pytest, FakeProtocol(alive=True),
                            "/some/test.py", 10, 5)
    runner.run_func()
    success, (status, message) = runner.result
    assert not success
    assert status == "INTERNAL-ERROR"


def test_pytestrun_run_func_exception_with_alive_browser_reports_internal_error():
    def do_pytest(path, timeout):
        raise ValueError("boom")

    runner = base.PytestRun(StructuredLogger("test"), do_pytest, FakeProtocol(alive=True),
                            "/some/test.py", 10, 5)
    runner.run_func()
    success, (status, message) = runner.result
    assert not success
    assert status == "INTERNAL-ERROR"
    assert "boom" in message


def test_pytestrun_run_func_exception_with_dead_browser_reports_crash():
    def do_pytest(path, timeout):
        raise ValueError("boom")

    runner = base.PytestRun(StructuredLogger("test"), do_pytest, FakeProtocol(alive=False),
                            "/some/test.py", 10, 5)
    runner.run_func()
    assert runner.result == (False, ("CRASH", None))


def test_pytestrun_set_timeout_is_noop():
    runner = base.PytestRun(StructuredLogger("test"), lambda path, timeout: None,
                            FakeProtocol(), "/some/test.py", 10, 5)
    assert runner.set_timeout() is None


def test_pytestrun_run_reports_crash_when_browser_dies_during_hang():
    def do_pytest(path, timeout):
        time.sleep(0.5)

    runner = base.PytestRun(StructuredLogger("test"), do_pytest, FakeProtocol(alive=False),
                            "/some/test.py", 0.05, 0.025)
    success, (status, message) = runner.run()
    assert not success
    assert status == "CRASH"


class FakeBrowser:
    host = "127.0.0.1"
    port = 4444
    env: dict[str, str] = {}
    pac = None


def make_pytest_executor(monkeypatch, protocol_alive, pytest_result):
    executor = base.PytestExecutor(StructuredLogger("test"), FakeBrowser(), server_config=None,
                                   webdriver_binary="webdriver", webdriver_args=[],
                                   target_platform="linux")
    executor.setup(None)
    monkeypatch.setattr(executor.protocol, "is_alive", lambda: protocol_alive)
    monkeypatch.setattr(base.pytestrunner, "run", lambda *args, **kwargs: pytest_result)
    return executor


def test_do_pytest_reports_crash_when_browser_dead_despite_ok_result(monkeypatch):
    executor = make_pytest_executor(monkeypatch, protocol_alive=False,
                                    pytest_result=(("OK", None), []))

    harness_result, subtest_results = executor.do_pytest("/some/test.py", 10)

    assert harness_result == ("CRASH", None)
    assert subtest_results == []


def test_do_pytest_reports_crash_when_browser_dead_despite_error_result(monkeypatch):
    # A non-OK, non-CRASH pytest result (e.g. a collection error) is just as
    # uninformative about browser liveness as an OK one.
    executor = make_pytest_executor(monkeypatch, protocol_alive=False,
                                    pytest_result=(("ERROR", "boom"), []))

    harness_result, subtest_results = executor.do_pytest("/some/test.py", 10)

    assert harness_result == ("CRASH", "boom")


def test_do_pytest_keeps_result_when_browser_alive(monkeypatch):
    executor = make_pytest_executor(monkeypatch, protocol_alive=True,
                                    pytest_result=(("OK", None), []))

    harness_result, subtest_results = executor.do_pytest("/some/test.py", 10)

    assert harness_result == ("OK", None)


def test_do_pytest_skips_is_alive_probe_when_already_crash(monkeypatch):
    executor = make_pytest_executor(monkeypatch, protocol_alive=True,
                                    pytest_result=(("CRASH", "boom"), []))
    monkeypatch.setattr(executor.protocol, "is_alive",
                        lambda: (_ for _ in ()).throw(AssertionError("should not be called")))

    harness_result, subtest_results = executor.do_pytest("/some/test.py", 10)

    assert harness_result == ("CRASH", "boom")
