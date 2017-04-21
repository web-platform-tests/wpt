# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import glob
import os
import subprocess
import sys
import tarfile
import tempfile
import time
import urlparse
from cStringIO import StringIO as CStringIO
from ConfigParser import SafeConfigParser
from urlparse import urljoin

import requests

from .base import Browser, ExecutorBrowser, require_arg
from ..executors import executor_kwargs as base_executor_kwargs
from ..executors.executorselenium import (SeleniumTestharnessExecutor,
                                          SeleniumRefTestExecutor)

here = os.path.split(__file__)[0]

sc_process = None


__wptrunner__ = {"product": "sauce",
                 "check_args": "check_args",
                 "browser": "SauceBrowser",
                 "executor": {"testharness": "SeleniumTestharnessExecutor",
                              "reftest": "SeleniumRefTestExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "executor_kwargs",
                 "prerun": "prerun",
                 "env_options": "env_options"}


def get_capabilities(**kwargs):
    browser_name = kwargs["sauce_browser"]
    platform = kwargs["sauce_platform"]
    version = kwargs["sauce_version"]
    build = kwargs["sauce_build"]
    tags = kwargs["sauce_tags"]
    tunnel_id = kwargs["sauce_tunnel_id"]
    prerun_script = {
        "MicrosoftEdge": {
            "executable": "sauce-storage:edge-prerun.bat",
            "background": False,
        },
        "safari": {
            "executable": "sauce-storage:safari-prerun.sh",
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


def browser_kwargs(**kwargs):
    sauce_config = get_sauce_config(**kwargs)

    return {"sauce_config": sauce_config}


def executor_kwargs(test_type, server_config, cache_manager, run_info_data,
                    **kwargs):
    executor_kwargs = base_executor_kwargs(test_type, server_config,
                                           cache_manager, **kwargs)

    executor_kwargs["capabilities"] = get_capabilities(**kwargs)

    return executor_kwargs


def env_options():
    return {"host": "web-platform.test",
            "bind_hostname": "true",
            "supports_debugger": False}


def get_tar(url, dest):
    resp = requests.get(url, stream=True)
    resp.raise_for_status()
    with tarfile.open(fileobj=CStringIO(resp.raw.read())) as f:
        f.extractall(path=dest)


def prerun(**kwargs):
    global sc_process

    sauce_user = kwargs["sauce_user"]
    sauce_key = kwargs["sauce_key"]
    sauce_tunnel_id = kwargs["sauce_tunnel_id"]
    sauce_connect_binary = kwargs.get("sauce_connect_binary")
    sauce_config = get_sauce_config(**kwargs)
    url = urljoin(sauce_config["url"], "hub/status")

    if not sauce_connect_binary:
        temp_path = tempfile.gettempdir()
        get_tar("https://saucelabs.com/downloads/sc-latest-linux.tar.gz", temp_path)
        sauce_connect_binary = glob.glob(os.path.join(temp_path, "sc-*-linux/bin/sc"))[0]

    sc_process = subprocess.Popen([
        sauce_connect_binary,
        "--user=%s" % sauce_user,
        "--api-key=%s" % sauce_key,
        "--no-remove-colliding-tunnels",
        "--tunnel-identifier=%s" % sauce_tunnel_id,
        "--readyfile=./sauce_is_ready",
        "--tunnel-domains",
        "web-platform.test",
        "*.web-platform.test"
    ])
    while not os.path.exists('./sauce_is_ready') and not sc_process.poll():
        time.sleep(5)

    if sc_process.returncode is not None and sc_process.returncode > 0:
        raise SauceException("Unable to start Sauce Connect Proxy. Process exited with code %s", sc_process.returncode)

    try:
        tunnel_request = requests.get(url)
    except requests.RequestException as e:
        raise SauceException("Unable to connect to Sauce Labs webdriver server.")

    upload_prerun_exec('edge-prerun.bat', sauce_user, sauce_key)
    upload_prerun_exec('safari-prerun.sh', sauce_user, sauce_key)

    return sc_process


def upload_prerun_exec(file_name, sauce_user, sauce_key):
    auth = (sauce_user, sauce_key)
    url = "https://saucelabs.com/rest/v1/storage/%s/%s?overwrite=true" % (sauce_user, file_name)

    with open(os.path.join(here, 'sauce_setup', file_name), 'rb') as f:
        requests.post(url, data=f, auth=auth)


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
