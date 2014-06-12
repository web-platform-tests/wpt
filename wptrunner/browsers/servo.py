import os

from .base import NullBrowser, ExecutorBrowser, require_arg
from ..executors import get_executor_kwargs
from ..executors.executorservo import ServoTestharnessExecutor

here = os.path.join(os.path.split(__file__)[0])

__wptrunner__ = {"product": "servo",
                 "check_args": "check_args",
                 "browser": "ServoBrowser",
                 "executor": {"testharness": "ServoTestharnessExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "get_executor_kwargs",
                 "env_options": "env_options"}

def check_args(**kwargs):
    require_arg(kwargs, "binary")

def browser_kwargs(**kwargs):
    return {"binary": kwargs["binary"]}

def env_options():
    return {"host": "localhost",
            "bind_hostname": "true"}

class ServoBrowser(NullBrowser):
    def __init__(self, logger, binary):
        NullBrowser.__init__(self, logger)
        self.binary = binary

    def executor_browser(self):
        return ExecutorBrowser, {"binary": self.binary}
