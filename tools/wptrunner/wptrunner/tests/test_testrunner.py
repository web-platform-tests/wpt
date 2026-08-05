# mypy: allow-untyped-defs

import collections
import types
from unittest import mock

from mozlog.structuredlog import StructuredLogger

from .. import testrunner


class FakeBrowser:
    def __init__(self, is_alive=True, has_crash_dump=False):
        self.browser_pid = None
        self._is_alive = is_alive
        self._has_crash_dump = has_crash_dump

    def check_crash(self, test_id):
        return self._has_crash_dump

    def is_alive(self):
        return self._is_alive


class FakeTest:
    def __init__(self, test_id="/test.html", test_type="testharness", timeout=10,
                restart_after=False):
        self.id = test_id
        self.test_type = test_type
        self.timeout = timeout
        self.restart_after = restart_after

    def disabled(self, subtest_name):
        return False

    def expected_fail_message(self, subtest_name):
        return None


class FakeFileResult:
    def __init__(self, status="OK", expected="OK", known_intermittent=None):
        self.status = status
        self.expected = expected
        self.known_intermittent = known_intermittent or []
        self.extra = {}
        self.message = None
        self.stack = None


class FakeTestGroup:
    subsuite = None


def make_manager(status="OK", browser_alive=True, has_crash_dump=False,
                 retry_index=0, restart_after=False, restart_on_unexpected=True,
                 test_type="testharness"):
    manager = object.__new__(testrunner.TestRunnerManager)
    test = FakeTest(test_type=test_type, restart_after=restart_after)
    manager.state = testrunner.RunningState(FakeTestGroup(), test)
    manager.timer = None
    manager.logger = StructuredLogger("test")
    manager.browser = FakeBrowser(is_alive=browser_alive, has_crash_dump=has_crash_dump)
    manager.update_status_on_crash = True
    manager.test_count = 0
    manager.unexpected_pass_tests = collections.defaultdict(list)
    manager.unexpected_fail_tests = collections.defaultdict(list)
    manager.executor_implementation = types.SimpleNamespace(
        executor_kwargs={"timeout_multiplier": 1})
    manager.recording = mock.MagicMock()
    manager.pause_after_test = False
    manager.pause_on_unexpected = False
    manager.restart_on_unexpected = restart_on_unexpected
    manager.retry_index = retry_index
    manager.after_test_end = mock.MagicMock()

    file_result = FakeFileResult(status=status, expected="OK")
    return manager, test, file_result


def test_test_ended_no_restart_for_ok_result():
    manager, test, file_result = make_manager(status="OK", browser_alive=True)
    manager.test_ended(test, (file_result, []))
    args, kwargs = manager.after_test_end.call_args
    assert args[1] is False


def test_test_ended_restarts_on_crash_status_even_if_browser_reports_alive():
    manager, test, file_result = make_manager(status="CRASH", browser_alive=True)
    manager.test_ended(test, (file_result, []))
    args, kwargs = manager.after_test_end.call_args
    assert args[1] is True


def test_test_ended_forces_restart_when_browser_died_despite_ok_status():
    manager, test, file_result = make_manager(status="OK", browser_alive=False)
    manager.test_ended(test, (file_result, []))
    args, kwargs = manager.after_test_end.call_args
    assert args[1] is True


def test_test_ended_skips_is_alive_probe_when_status_already_forces_restart():
    manager, test, file_result = make_manager(status="CRASH", browser_alive=True)
    manager.browser.is_alive = mock.MagicMock(side_effect=AssertionError("should not be called"))
    manager.test_ended(test, (file_result, []))
    manager.browser.is_alive.assert_not_called()
