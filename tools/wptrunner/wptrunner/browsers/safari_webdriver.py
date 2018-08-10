from copy import deepcopy

from . import safari

from ..executors import executor_kwargs as base_executor_kwargs
from ..executors.executorwebdriver import (WebDriverTestharnessExecutor,  # noqa: F401
                                           WebDriverRefTestExecutor)  # noqa: F401

__wptrunner__ = deepcopy(safari.__wptrunner__)
__wptrunner__["product"] = "safari_webdriver"
__wptrunner__["executor"]["testharness"] = "WebDriverTestharnessExecutor"
__wptrunner__["executor"]["reftest"] = "WebDriverRefTestExecutor"

for k, v in __wptrunner__.items():
    if k in ("product", "executor"):
        continue

    globals()[v] = getattr(safari, v)

SafariDriverWdspecExecutor = safari.SafariDriverWdspecExecutor
