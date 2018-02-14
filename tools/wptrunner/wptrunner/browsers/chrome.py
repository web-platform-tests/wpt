from .base import Browser, ExecutorBrowser, require_arg
from ..webdriver_server import ChromeDriverServer
from ..executors import executor_kwargs as base_executor_kwargs
from ..executors.executorselenium import (SeleniumTestharnessExecutor,
                                          SeleniumRefTestExecutor)
from ..executors.executorchrome import ChromeDriverWdspecExecutor
from mozlog.structuredlog import StructuredLogger
from typing import List
from typing import Any
from typing import Dict
from typing import Tuple
from multiprocessing.managers import SyncManager
from typing import Text
from wptrunner.wpttest import RunInfo


__wptrunner__ = {"product": "chrome",
                 "check_args": "check_args",
                 "browser": "ChromeBrowser",
                 "executor": {"testharness": "SeleniumTestharnessExecutor",
                              "reftest": "SeleniumRefTestExecutor",
                              "wdspec": "ChromeDriverWdspecExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "executor_kwargs",
                 "env_extras": "env_extras",
                 "env_options": "env_options"}


def check_args(**kwargs):
    require_arg(kwargs, "webdriver_binary")


def browser_kwargs(test_type, run_info_data, **kwargs):
    return {"binary": kwargs["binary"],
            "webdriver_binary": kwargs["webdriver_binary"],
            "webdriver_args": kwargs.get("webdriver_args")}


def executor_kwargs(test_type,  # type: str
                    server_config,  # type: Dict[Text, Any]
                    cache_manager,  # type: SyncManager
                    run_info_data,  # type: RunInfo
                    **kwargs  # type: Any
                    ):
    # type: (...) -> Dict[str, Any]
    from selenium.webdriver import DesiredCapabilities

    executor_kwargs = base_executor_kwargs(test_type, server_config,
                                           cache_manager, **kwargs)
    executor_kwargs["close_after_done"] = True
    capabilities = dict(DesiredCapabilities.CHROME.items())
    capabilities.setdefault("chromeOptions", {})["prefs"] = {
        "profile": {
            "default_content_setting_values": {
                "popups": 1
            }
        }
    }
    for (kwarg, capability) in [("binary", "binary"), ("binary_args", "args")]:
        if kwargs[kwarg] is not None:
            capabilities["chromeOptions"][capability] = kwargs[kwarg]
    if test_type == "testharness":
        capabilities["chromeOptions"]["useAutomationExtension"] = False
        capabilities["chromeOptions"]["excludeSwitches"] = ["enable-automation"]
    if test_type == "wdspec":
        capabilities["chromeOptions"]["w3c"] = True
    executor_kwargs["capabilities"] = capabilities
    return executor_kwargs


def env_extras(**kwargs):
    # type: (**Any) -> List
    return []


def env_options():
    # type: () -> Dict[str, str]
    return {"bind_hostname": "true"}


class ChromeBrowser(Browser):
    """Chrome is backed by chromedriver, which is supplied through
    ``wptrunner.webdriver.ChromeDriverServer``.
    """

    def __init__(self, logger, binary, webdriver_binary="chromedriver",
                 webdriver_args=None):
        # type: (StructuredLogger, str, str, List) -> None
        """Creates a new representation of Chrome.  The `binary` argument gives
        the browser binary to use for testing."""
        Browser.__init__(self, logger)
        self.binary = binary
        self.server = ChromeDriverServer(self.logger,
                                         binary=webdriver_binary,
                                         args=webdriver_args)

    def start(self, **kwargs):
        # type: (**Any) -> None
        self.server.start(block=False)

    def stop(self, force=False):
        # type: (bool) -> None
        self.server.stop(force=force)

    def pid(self):
        # type: () -> int
        return self.server.pid

    def is_alive(self):
        # TODO(ato): This only indicates the driver is alive,
        # and doesn't say anything about whether a browser session
        # is active.
        return self.server.is_alive()

    def cleanup(self):
        # type: () -> None
        self.stop()

    def executor_browser(self):
        # type: () -> Tuple[type, Dict[str, str]]
        return ExecutorBrowser, {"webdriver_url": self.server.url}
