import os

from mozprocess import ProcessHandler
from mozprofile import FirefoxProfile, Preferences
from mozprofile.permissions import ServerLocations
from mozrunner import FirefoxRunner

from .base import get_free_port, NullBrowser, ExecutorBrowser
from ..executors import get_executor_kwargs
from ..executors.executorservo import ServoTestharnessExecutor

here = os.path.join(os.path.split(__file__)[0])

__wptrunner__ = {"product": "servo",
                 "browser": "ServoBrowser",
                 "executor": {"testharness": "ServoTestharnessExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "get_executor_kwargs",
                 "env_options": "env_options"}

def browser_kwargs(product, binary, prefs_root, **kwargs):
    return {"binary": binary}

def env_options():
    return {"host": "localhost",
            "bind_hostname": "true"}

class ServoBrowser(NullBrowser):
    def __init__(self, logger, binary):
        NullBrowser.__init__(self, logger)
        self.binary = binary

    def executor_browser(self):
        return ExecutorBrowser, {"binary": self.binary}
