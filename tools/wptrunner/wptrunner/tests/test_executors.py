# mypy: allow-untyped-defs

from types import SimpleNamespace
from unittest import mock

import pytest

from ..executors import base
from ..executors.executorchrome import ChromeDriverTestharnessExecutor
from ..executors.executoredge import EdgeDriverTestharnessExecutor
from ..executors.executorwebdriver import WebDriverTestharnessExecutor

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


@pytest.fixture
def webdriver_browser():
    return SimpleNamespace(pac=None, webdriver_url="http://localhost:4444",
                           capabilities=None)


@pytest.mark.parametrize("executor_cls", [
    ChromeDriverTestharnessExecutor,
    EdgeDriverTestharnessExecutor,
])
def test_new_test_window_focus(monkeypatch, webdriver_browser, executor_cls):
    events = []

    def create_test_window(self, protocol):
        events.append("select test window")
        return "test-window"

    monkeypatch.setattr(WebDriverTestharnessExecutor, "create_test_window",
                        create_test_window)
    executor = executor_cls(mock.Mock(), webdriver_browser, {})
    protocol = mock.Mock()
    executor.protocol = protocol
    protocol.testharness.persistent_test_window = None
    protocol.cdp.execute_cdp_command.side_effect = events.append

    assert executor.create_test_window(protocol) == "test-window"
    assert events == ["select test window", "Page.bringToFront"]


def test_reused_chrome_test_window_focus(webdriver_browser):
    executor = ChromeDriverTestharnessExecutor(mock.Mock(), webdriver_browser, {},
                                             reuse_window=True)
    protocol = mock.Mock()
    executor.protocol = protocol
    protocol.testharness.persistent_test_window = "test-window"

    assert executor.create_test_window(protocol) == "test-window"
    assert protocol.method_calls == [
        mock.call.base.set_window("test-window"),
        mock.call.base.load("about:blank"),
        mock.call.cdp.execute_cdp_command("Page.resetNavigationHistory"),
        mock.call.cdp.execute_cdp_command("Page.bringToFront"),
    ]
