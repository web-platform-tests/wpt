from . import chrome

from ..executors import executor_kwargs as base_executor_kwargs

from ..executors.executorwebdriver import (WebDriverTestharnessExecutor,  # noqa: F401
                                           WebDriverRefTestExecutor)  # noqa: F401

__wptrunner__ = chrome.__wptrunner__
__wptrunner__["product"] = "chrome_webdriver"
__wptrunner__["executor"]["testharness"] = "WebDriverTestharnessExecutor"
__wptrunner__["executor"]["reftest"] = "WebDriverRefTestExecutor"
__wptrunner__["executor_kwargs"] = "executor_kwargs"

for k, v in __wptrunner__.items():
    if k in ("product", "executor", "executor_kwargs"):
        continue

    globals()[v] = getattr(chrome, v)

ChromeDriverWdspecExecutor = chrome.ChromeDriverWdspecExecutor


def executor_kwargs(test_type, server_config, cache_manager, run_info_data,
                    **kwargs):
    executor_kwargs = base_executor_kwargs(test_type, server_config,
                                           cache_manager, run_info_data,
                                           **kwargs)
    executor_kwargs["close_after_done"] = True

    capabilities = {
        "browserName": "chrome",
        "platform": "ANY",
        "version": "",
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

    for (kwarg, capability) in [("binary", "binary"), ("binary_args", "args")]:
        if kwargs[kwarg] is not None:
            capabilities["goog:chromeOptions"][capability] = kwargs[kwarg]

    if test_type == "testharness":
        capabilities["goog:chromeOptions"]["useAutomationExtension"] = False
        capabilities["goog:chromeOptions"]["excludeSwitches"] = ["enable-automation"]

    always_match = {"alwaysMatch": capabilities}
    executor_kwargs["capabilities"] = always_match

    return executor_kwargs
