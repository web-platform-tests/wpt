from .base import Browser, ExecutorBrowser, require_arg
from ..webdriver_server import ChromeDriverServer
from ..executors import executor_kwargs as base_executor_kwargs
from ..executors.executorwebdriver import (WebDriverTestharnessExecutor,  # noqa: F401
                                           WebDriverRefTestExecutor)  # noqa: F401
from ..executors.executorchrome import ChromeDriverWdspecExecutor  # noqa: F401


__wptrunner__ = {"product": "chrome",
                 "check_args": "check_args",
                 "browser": "ChromeBrowser",
                 "executor": {"testharness": "WebDriverTestharnessExecutor",
                              "reftest": "WebDriverRefTestExecutor",
                              "wdspec": "ChromeDriverWdspecExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "executor_kwargs",
                 "env_extras": "env_extras",
                 "env_options": "env_options"}


cli_arguments = [
    # https://cs.chromium.org/chromium/src/chrome/test/chromedriver/chrome_launcher.cc?l=70-75&rcl=50b9fd38ae9ca373dc8889637eb94a50eea7dc94
    "--disable-popup-blocking",
    "--enable-automation",
    "--ignore-certificate-errors",
    "--metrics-recording-only",

    # https://cs.chromium.org/chromium/src/chrome/test/chromedriver/chrome_launcher.cc?l=77-92&rcl=50b9fd38ae9ca373dc8889637eb94a50eea7dc94
    "--disable-hang-monitor",
    "--disable-prompt-on-repost",
    "--disable-sync",
    "--no-first-run",
    "--disable-background-networking",
    "--disable-web-resources",
    "--disable-client-side-phishing-detection",
    "--disable-default-apps",
    "--enable-logging",
    "--log-level=0",
    "--password-store=basic",
    "--use-mock-keychain",
    "--test-type=webdriver",
    "--force-fieldtrials=SiteIsolationExtensions/Control",
]


def check_args(**kwargs):
    require_arg(kwargs, "webdriver_binary")


def browser_kwargs(test_type, run_info_data, config, **kwargs):
    return {"binary": kwargs["binary"],
            "webdriver_binary": kwargs["webdriver_binary"],
            "webdriver_args": kwargs.get("webdriver_args")}


def executor_kwargs(test_type, server_config, cache_manager, run_info_data,
                    **kwargs):
    executor_kwargs = base_executor_kwargs(test_type, server_config,
                                           cache_manager, run_info_data,
                                           **kwargs)
    executor_kwargs["close_after_done"] = True

    capabilities = {
        "goog:chromeOptions": {
            "prefs": {
                "profile": {
                    "default_content_setting_values": {
                        "popups": 1
                    }
                }
            },
            "w3c": True
        }
    }

    kwargs["binary_args"] += cli_arguments

    for (kwarg, capability) in [("binary", "binary"), ("binary_args", "args")]:
        if kwargs[kwarg] is not None:
            capabilities["goog:chromeOptions"][capability] = kwargs[kwarg]

    if kwargs["headless"]:
        kwargs["binary_args"].append("--headless")

    if test_type == "testharness":
        capabilities["goog:chromeOptions"]["useAutomationExtension"] = False
        capabilities["goog:chromeOptions"]["excludeSwitches"] = ["enable-automation"]

    executor_kwargs["capabilities"] = capabilities

    return executor_kwargs


def env_extras(**kwargs):
    return []


def env_options():
    return {}


class ChromeBrowser(Browser):
    """Chrome is backed by the Chrome Debugger Protocol, which is supplied
    through ``wptrunner.webdriver.ChromeDriverServer``.
    """

    def __init__(self, logger, binary, webdriver_binary="chromedriver",
                 webdriver_args=None):
        """Creates a new representation of Chrome.  The `binary` argument gives
        the browser binary to use for testing."""
        Browser.__init__(self, logger)
        self.binary = binary
        self._expected_alive = False

    def start(self, **kwargs):
        self._expected_alive = True

    def stop(self, force=False):
        self._expected_alive = False

    def pid(self):
        return 0

    def is_alive(self):
        return self._expected_alive

    def cleanup(self):
        self.stop()

    def executor_browser(self):
        return ExecutorBrowser, {"binary": self.binary}
