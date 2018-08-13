from copy import deepcopy

from . import edge

from ..executors.executorwebdriver import (WebDriverTestharnessExecutor,  # noqa: F401
                                           WebDriverRefTestExecutor)  # noqa: F401

__wptrunner__ = deepcopy(edge.__wptrunner__)
__wptrunner__["product"] = "edge_webdriver"
__wptrunner__["executor"]["testharness"] = "WebDriverTestharnessExecutor"
__wptrunner__["executor"]["reftest"] = "WebDriverRefTestExecutor"

for k, v in __wptrunner__.items():
    if k in ("product", "executor"):
        continue

    globals()[v] = getattr(edge, v)

EdgeDriverWdspecExecutor = edge.EdgeDriverWdspecExecutor
