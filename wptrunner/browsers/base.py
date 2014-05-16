import os
import socket
import sys
import time
import tempfile
import shutil
import subprocess

import mozprocess
from mozprofile import FirefoxProfile, Preferences
from mozprofile.permissions import ServerLocations
from mozrunner import FirefoxRunner, B2GRunner
import mozdevice
import moznetwork

here = os.path.split(__file__)[0]

def get_free_port(start_port, exclude=None):
    port = start_port
    while True:
        if exclude and port in exclude:
            port += 1
            continue
        s = socket.socket()
        try:
            s.bind(("127.0.0.1", port))
        except socket.error:
            port += 1
        else:
            return port
        finally:
            s.close()

class BrowserError(Exception):
    pass

class ProcessHandler(mozprocess.ProcessHandlerMixin):
    pass

class Browser(object):
    process_cls = None
    init_timeout = 30

    def __init__(self, logger):
        self.logger = logger

    def __enter__(self):
        self.setup()
        return self

    def __exit__(self, *args, **kwargs):
        self.cleanup()

    def setup(self):
        pass

    def start(self):
        raise NotImplementedError

    def stop():
        raise NotImplementedError

    def on_output(self, line):
        raise NotImplementedError

    def is_alive(self):
        raise NotImplementedError

    def cleanup(self):
        pass

    def executor_browser(self):
        return ExecutorBrowser, {}

class NullBrowser(Browser):
    """No-op browser to use in scenarios where the TestManager shouldn't
    actually own the browser process (e.g. Servo where we start one browser
    per test)"""
    def start(self):
        pass

    def stop(self):
        pass

    def is_alive(self):
        return True

class ExecutorBrowser(object):
    def __init__(self, **kwargs):
        """View of the Browser used by the Executor object.
        This is needed because the Executor runs in a child process and
        we can't ship Browser instances between processes on Windows.

        Typically this will have a few product-specific properties set,
        but in some cases it may have more elaborate methods for setting
        up the browser from the runner process.
        """
        for k, v in kwargs.iteritems():
            setattr(self, k, v)
