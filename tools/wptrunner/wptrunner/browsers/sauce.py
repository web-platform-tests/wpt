# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import glob
import os
import shutil
import subprocess
import tarfile
import tempfile
import time
from cStringIO import StringIO as CStringIO

import requests

from .base import Browser, ExecutorBrowser, require_arg
from ..executors import executor_kwargs as base_executor_kwargs
from ..executors.executorselenium import (SeleniumTestharnessExecutor,
                                          SeleniumRefTestExecutor)

here = os.path.split(__file__)[0]


__wptrunner__ = {"product": "sauce",
                 "check_args": "check_args",
                 "browser": "SauceBrowser",
                 "executor": {"testharness": "SeleniumTestharnessExecutor",
                              "reftest": "SeleniumRefTestExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "executor_kwargs",
                 "env_extras": "env_extras",
                 "env_options": "env_options"}


def get_capabilities(**kwargs):
    browser_name = kwargs["sauce_browser"]
    platform = kwargs["sauce_platform"]
    version = kwargs["sauce_version"]
    build = kwargs["sauce_build"]
    tags = kwargs["sauce_tags"]
    tunnel_id = kwargs["sauce_tunnel_id"]
    base_url = "http://%s:%d/tools/wptrunner/wptrunner/browsers/sauce_setup/" % \
               (kwargs.config.domains[""], kwargs.config.ports["http"][0])
    prerun_script = {
        "MicrosoftEdge": {
            "executable": base_url + "edge-prerun.sub.bat",
            "background": False,
        },
        "safari": {
            "executable": base_url + "safari-prerun.sub.sh",
            "background": False,
        }
    }
    capabilities = {
        "browserName": browser_name,
        "build": build,
        "disablePopupHandler": True,
        "name": "%s %s on %s" % (browser_name, version, platform),
        "platform": platform,
        "public": "public",
        "selenium-version": "3.3.1",
        "tags": tags,
        "tunnel-identifier": tunnel_id,
        "version": version,
        "prerun": prerun_script.get(browser_name)
    }

    if browser_name == 'MicrosoftEdge':
        capabilities['selenium-version'] = '2.4.8'

    return capabilities


def get_sauce_config(**kwargs):
    browser_name = kwargs["sauce_browser"]
    sauce_user = kwargs["sauce_user"]
    sauce_key = kwargs["sauce_key"]

    hub_url = "%s:%s@localhost:4445" % (sauce_user, sauce_key)
    data = {
        "url": "http://%s/wd/hub" % hub_url,
        "browserName": browser_name,
        "capabilities": get_capabilities(**kwargs)
    }

    return data


def check_args(**kwargs):
    require_arg(kwargs, "sauce_browser")
    require_arg(kwargs, "sauce_platform")
    require_arg(kwargs, "sauce_version")
    require_arg(kwargs, "sauce_user")
    require_arg(kwargs, "sauce_key")


def browser_kwargs(test_type, run_info_data, **kwargs):
    sauce_config = get_sauce_config(**kwargs)

    return {"sauce_config": sauce_config}


def executor_kwargs(test_type, server_config, cache_manager, run_info_data,
                    **kwargs):
    executor_kwargs = base_executor_kwargs(test_type, server_config,
                                           cache_manager, **kwargs)

    executor_kwargs["capabilities"] = get_capabilities(config=server_config, **kwargs)

    return executor_kwargs


def env_extras(**kwargs):
    return [SauceConnect(**kwargs)]


def env_options():
    return {"supports_debugger": False}


def get_tar(url, dest):
    resp = requests.get(url, stream=True)
    resp.raise_for_status()
    with tarfile.open(fileobj=CStringIO(resp.raw.read())) as f:
        f.extractall(path=dest)


class SauceConnect():

    def __init__(self, **kwargs):
        self.sauce_user = kwargs["sauce_user"]
        self.sauce_key = kwargs["sauce_key"]
        self.sauce_tunnel_id = kwargs["sauce_tunnel_id"]
        self.sauce_connect_binary = kwargs.get("sauce_connect_binary")
        self.sc_process = None
        self.temp_dir = None
        self.env_config = None

    def __call__(self, env_options, env_config):
        self.env_config = env_config

        return self

    def __enter__(self):
        # Because this class implements the context manager protocol, it is
        # possible for instances to be provided to the `with` statement
        # directly. This class implements the callable protocol so that data
        # which is not available during object initialization can be provided
        # prior to this moment. Instances must be invoked in preparation for
        # the context manager protocol, but this additional constraint is not
        # itself part of the protocol.
        assert self.env_config is not None, 'The instance has been invoked.'

        if not self.sauce_connect_binary:
            self.temp_dir = tempfile.mkdtemp()
            get_tar("https://saucelabs.com/downloads/sc-4.4.9-linux.tar.gz", self.temp_dir)
            self.sauce_connect_binary = glob.glob(os.path.join(self.temp_dir, "sc-*-linux/bin/sc"))[0]

        self.sc_process = subprocess.Popen([
            self.sauce_connect_binary,
            "--user=%s" % self.sauce_user,
            "--api-key=%s" % self.sauce_key,
            "--no-remove-colliding-tunnels",
            "--tunnel-identifier=%s" % self.sauce_tunnel_id,
            "--metrics-address=0.0.0.0:9876",
            "--readyfile=./sauce_is_ready",
            "--tunnel-domains",
            ",".join(self.env_config['domains'].values())
        ])

        # Timeout config vars
        each_sleep_secs = 1
        max_wait = 30
        kill_wait = 5

        tot_wait = 0
        while not os.path.exists('./sauce_is_ready') and self.sc_process.poll() is None:
            if tot_wait >= max_wait:
                self.sc_process.terminate()
                while self.sc_process.poll() is None:
                    time.sleep(each_sleep_secs)
                    tot_wait += each_sleep_secs
                    if tot_wait >= (max_wait + kill_wait):
                        self.sc_process.kill()
                        break
                raise SauceException("Sauce Connect Proxy was not ready after %d seconds" % tot_wait)

            time.sleep(each_sleep_secs)
            tot_wait += each_sleep_secs

        if self.sc_process.returncode is not None:
            raise SauceException("Unable to start Sauce Connect Proxy. Process exited with code %s", self.sc_process.returncode)

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.env_config = None
        self.sc_process.terminate()
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                shutil.rmtree(self.temp_dir)
            except OSError:
                pass


class SauceException(Exception):
    pass


class SauceBrowser(Browser):
    init_timeout = 300

    def __init__(self, logger, sauce_config):
        Browser.__init__(self, logger)
        self.sauce_config = sauce_config

    def start(self):
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
        return ExecutorBrowser, {"webdriver_url": self.sauce_config["url"]}
