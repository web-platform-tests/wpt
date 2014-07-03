import os
import time
import tempfile
import shutil
import subprocess

from mozprofile import FirefoxProfile, Preferences
from mozrunner import B2GDeviceRunner
import mozdevice
import moznetwork

from .base import get_free_port, BrowserError, Browser, ExecutorBrowser
from ..executors.executormarionette import MarionetteTestharnessExecutor, required_files

here = os.path.split(__file__)[0]

__wptrunner__ = {"product": "b2g",
                 "check_args": "check_args",
                 "browser": "B2GBrowser",
                 "executor": {"testharness": "B2GMarionetteTestharnessExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "get_executor_kwargs",
                 "env_options": "env_options"}


def check_args(**kwargs):
    pass


def browser_kwargs(**kwargs):
    return {"prefs_root": kwargs["prefs_root"],
            "no_backup": kwargs.get("b2g_no_backup", False)}


def get_executor_kwargs(http_server_url, **kwargs):
    timeout_multiplier = kwargs["timeout_multiplier"]
    if timeout_multiplier is None:
        timeout_multiplier = 2

    executor_kwargs = {"http_server_url": http_server_url,
                       "timeout_multiplier": timeout_multiplier,
                       "close_after_done": False}
    return executor_kwargs


def env_options():
    return {"host": "web-platform.test",
            "bind_hostname": "false",
            "test_server_port": False,
            "required_files": required_files}


class B2GBrowser(Browser):
    used_ports = set()
    init_timeout = 180

    def __init__(self, logger, prefs_root, no_backup=False):
        Browser.__init__(self, logger)
        logger.info("Waiting for device")
        subprocess.call(["adb", "wait-for-device"])
        self.device = mozdevice.DeviceManagerADB()
        self.marionette_port = get_free_port(2828, exclude=self.used_ports)
        self.used_ports.add(self.marionette_port)
        self.cert_test_app = None
        self.runner = None
        self.prefs_root = prefs_root

        self.no_backup = no_backup
        self.backup_path = None
        self.backup_paths = []
        self.backup_dirs = []

    def setup(self):
        self.logger.info("Running B2G setup")
        self.backup_path = tempfile.mkdtemp()

        self.logger.debug(self.backup_path)

        if not self.no_backup:
            self.backup_dirs = [("/data/local", os.path.join(self.backup_path, "local")),
                                ("/data/b2g/mozilla", os.path.join(self.backup_path, "profile"))]

            self.backup_paths = [("/system/etc/hosts", os.path.join(self.backup_path, "etc/hosts"))]

            for remote, local in self.backup_dirs:
                self.device.getDirectory(remote, local)

            for remote, local in self.backup_paths:
                self.device.getFile(remote, local)

        self.setup_hosts()

    def start(self):
        profile = FirefoxProfile()

        profile.set_preferences({"dom.disable_open_during_load": False,
                                 # "dom.mozBrowserFramesEnabled": True,
                                 # "dom.ipc.tabs.disabled": False,
                                 # "dom.ipc.browser_frames.oop_by_default": False,
                                 # "marionette.force-local": True,
                                 # "dom.testing.datastore_enabled_for_hosted_apps": True
                                 })

        self.logger.debug("Creating device runner")
        self.runner = B2GDeviceRunner(profile=profile)
        self.logger.debug("Starting device runner")
        self.runner.start()
        self.wait_for_net()
        self.logger.debug("Device runner started")

    def setup_hosts(self):
        hosts = ["web-platform.test", "www.web-platform.test", "www1.web-platform.test", "www2.web-platform.test",
                 "xn--n8j6ds53lwwkrqhv28a.web-platform.test", "xn--lve-6lad.web-platform.test"]

        host_ip = moznetwork.get_ip()

        temp_dir = tempfile.mkdtemp()
        hosts_path = os.path.join(temp_dir, "hosts")
        remote_path = "/system/etc/hosts"
        try:
            self.device.getFile("/etc/hosts", hosts_path)

            with open(hosts_path, "a+") as f:
                hosts_present = set()
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    ip, host = line.split()
                    hosts_present.add(host)

                    if host in hosts and ip != host_ip:
                        raise Exception("Existing hosts file has an ip for %s" % host)

                f.seek(f.tell() - 1)
                if f.read() != "\n":
                    f.write("\n")

                for host in hosts:
                    f.write("%s%s%s\n" % (host_ip, " " * (28 - len(host_ip)), host))

            self.logger.info("Installing hosts file")

            self.device.remount()
            self.device.removeFile(remote_path)
            self.device.pushFile(hosts_path, remote_path)
        finally:
            os.unlink(hosts_path)
            os.rmdir(temp_dir)

    def load_prefs(self):
        prefs_path = os.path.join(self.prefs_root, "prefs_general.js")
        if os.path.exists(prefs_path):
            preferences = Preferences.read_prefs(prefs_path)
        else:
            self.logger.warning("Failed to find base prefs file in %s" % prefs_path)
            preferences = []

        return preferences

    def wait_for_net(self):
        # TODO: limit how long we wait before we fail
        # consider the possibility that wlan0 is not the right interface

        self.logger.info("Waiting for net connection")

        def has_connection():
            try:
                return self.device.getIP(["wlan0"]) is not None
            except mozdevice.DMError:
                return False

        t0 = time.time()
        timeout = 60
        while not has_connection():
            if time.time() - t0 > timeout:
                self.logger.error("Waiting for net timed out")
                raise BrowserError("Waiting for net timed out")
            time.sleep(1)

    def stop(self):
        pass

    def cleanup(self):
        self.logger.debug("Running browser cleanup steps")

        for remote, local in self.backup_dirs:
            self.device.removeDir(remote)
            self.device.pushDir(local, remote)

        for remote, local in self.backup_paths:
            self.device.removeFile(remote)
            self.device.pushFile(local, remote)

        shutil.rmtree(self.backup_path)
        self.device.reboot(wait=True)

    def pid(self):
        return "Remote"

    def is_alive(self):
        return True

    def executor_browser(self):
        return B2GExecutorBrowser, {"marionette_port": self.marionette_port}


class B2GExecutorBrowser(ExecutorBrowser):
    # The following methods are called from a different process
    def __init__(self, *args, **kwargs):
        ExecutorBrowser.__init__(self, *args, **kwargs)
        self.device = mozdevice.DeviceManagerADB()
        self.executor = None
        subprocess.check_call([self.device._adbPath,
                               'forward',
                               'tcp:%s' % self.marionette_port,
                               'tcp:2828'])

    def after_connect(self, executor):
        self.executor = executor
        self.executor.logger.debug("Running browser.after_connect steps")
        self.install_cert_app()
        self.use_cert_app()
        self.wait_for_net()

    def install_cert_app(self):
        marionette = self.executor.marionette
        if self.device.dirExists("/data/local/webapps/certtest-app"):
            self.executor.logger.info("certtest_app is already installed")
            return
        self.executor.logger.info("Installing certtest_app")
        self.device.pushFile(os.path.join(here, "b2g_setup", "certtest_app.zip"),
                             "/data/local/certtest_app.zip")

        self.executor.logger.debug("Running install script")
        with open(os.path.join(here, "b2g_setup", "app_install.js"), "r") as f:
            script = f.read()

        marionette.set_context("chrome")
        marionette.set_script_timeout(5000)
        marionette.execute_async_script(script)
        self.executor.logger.debug("Install script complete")

    def use_cert_app(self):
        marionette = self.executor.marionette

        self.wait_for_homescreen(marionette)
        self.executor.logger.info("Homescreen loaded")

        marionette.set_context("content")

        # app management is done in the system app
        marionette.switch_to_frame()

        self.executor.logger.debug("Loading app_management library")
        marionette.import_script(os.path.join(here, "b2g_setup", "app_management.js"))
        script = "GaiaApps.launchWithName('CertTest App');"

        # NOTE: if the app is already launched, this doesn't launch a new app, it will return
        # a reference to the existing app
        self.executor.logger.info("Launching CertTest app")
        self.cert_test_app = marionette.execute_async_script(script, script_timeout=5000)
        if not self.cert_test_app:
            raise Exception("Launching CertTest App failed")
        marionette.switch_to_frame(self.cert_test_app["frame"])

    def wait_for_net(self):
        # TODO: limit how long we wait before we fail
        # consider the possibility that wlan0 is not the right interface
        self.executor.logger.info("Waiting for net connection")
        def has_connection():
            try:
                return self.device.getIP(["wlan0"]) is not None
            except mozdevice.DMError:
                return False

        t0 = time.time()
        timeout = 60
        while not has_connection():
            if time.time() - t0 > timeout:
                raise BrowserError("Waiting for net timed out")
            time.sleep(1)

    def wait_for_homescreen(self, marionette):
        self.executor.logger.info("Waiting for homescreen to load")
        marionette.set_context(marionette.CONTEXT_CONTENT)
        marionette.execute_async_script("""
let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
let app = null;
if (manager) {
  app = ('getActiveApp' in manager) ? manager.getActiveApp() : manager.getCurrentDisplayedApp();
}
if (app) {
  log('Already loaded home screen');
  marionetteScriptFinished();
} else {
  log('waiting for mozbrowserloadend');
  window.addEventListener('mozbrowserloadend', function loaded(aEvent) {
    log('received mozbrowserloadend for ' + aEvent.target.src);
    if (aEvent.target.src.indexOf('ftu') != -1 || aEvent.target.src.indexOf('homescreen') != -1) {
      window.removeEventListener('mozbrowserloadend', loaded);
      marionetteScriptFinished();
    }
  });
}""", script_timeout=30000)


class B2GMarionetteTestharnessExecutor(MarionetteTestharnessExecutor):
    def after_connect(self):
        self.browser.after_connect(self)
        MarionetteTestharnessExecutor.after_connect(self)
