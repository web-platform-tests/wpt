# mypy: allow-untyped-defs

import glob
import os
import shutil
import subprocess
import tarfile
import tempfile
import time
import json

import requests

from io import StringIO

from .base import Browser, ExecutorBrowser, require_arg
from .base import get_timeout_multiplier   # noqa: F401
from ..executors import executor_kwargs as base_executor_kwargs
from ..executors.executorselenium import (SeleniumTestharnessExecutor,  # noqa: F401
                                          SeleniumRefTestExecutor)  # noqa: F401

here = os.path.dirname(__file__)
# Number of seconds to wait between polling operations when detecting status of
# Sauce Connect sub-process.
sc_poll_period = 1

__wptrunner__ = {"product": "browserstack",
                 "check_args": "check_args",
                 "browser": "BrowserStackBrowser",
                 "executor": {"testharness": "SeleniumTestharnessExecutor",
                              "reftest": "SeleniumRefTestExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "executor_kwargs",
                 "env_extras": "env_extras",
                 "env_options": "env_options",
                 "timeout_multiplier": "get_timeout_multiplier",}

def get_capabilities(**kwargs):
    capabilities = json.loads(kwargs["browserstack_capabilities"])
    return capabilities


def check_args(**kwargs):
    require_arg(kwargs, "browserstack_capabilities")


def browser_kwargs(logger, test_type, run_info_data, config, **kwargs):
    url = kwargs["browserstack_url"]
    if url is None:
      url = "https://hub.browserstack.com/wd/hub"
    
    return {"browserstack_config": {"url": url}}


def executor_kwargs(logger, test_type, test_environment, run_info_data,
                    **kwargs):
    executor_kwargs = base_executor_kwargs(test_type, test_environment, run_info_data, **kwargs)

    executor_kwargs["capabilities"] = get_capabilities(**kwargs)

    return executor_kwargs


def env_extras(**kwargs):
    return []


def env_options():
    return {"supports_debugger": False}


class BrowserStackBrowser(Browser):
    init_timeout = 300

    def __init__(self, logger, browserstack_config, **kwargs):
        Browser.__init__(self, logger)
        self.browserstack_config = browserstack_config

    def start(self, **kwargs):
        pass

    def stop(self, force=False):
        pass

    def pid(self):
        return None

    def is_alive(self):
        # TODO: Should this check something about the connection?
        return True

    def cleanup(self):
        pass

    def executor_browser(self):
        return ExecutorBrowser, {"webdriver_url": self.browserstack_config["url"], "pac": None}
