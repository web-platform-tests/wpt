# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

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

class NullBrowser(Browser):
    """No-op browser to use in scenarios where the TestManager shouldn't
    actually own the browser process (e.g. servo where we start one browser
    per test)"""
    def start(self):
        pass

    def stop(self):
        pass

    def is_alive(self):
        return True

class ServoBrowser(NullBrowser):
    def __init__(self, logger, binary):
        Browser.__init__(self, logger)
        self.binary = binary

class FirefoxBrowser(Browser):
    used_ports = set()

    def __init__(self, logger, binary, prefs_root):
        Browser.__init__(self, logger)
        self.binary = binary
        self.prefs_root = prefs_root
        self.marionette_port = get_free_port(2828, exclude=self.used_ports)
        self.used_ports.add(self.marionette_port)
        self.runner = None

    def start(self):
        env = os.environ.copy()
        env['MOZ_CRASHREPORTER_NO_REPORT'] = '1'

        locations = ServerLocations(filename=os.path.join(here, "server-locations.txt"))

        preferences = self.load_prefs()

        profile = FirefoxProfile(locations=locations, proxy=True, preferences=preferences)
        profile.set_preferences({"marionette.defaultPrefs.enabled": True,
                                 "marionette.defaultPrefs.port": self.marionette_port})

        self.runner = FirefoxRunner(profile,
                                    self.binary,
                                    cmdargs=["--marionette", "about:blank"],
                                    env=env,
                                    kp_kwargs={"processOutputLine": [self.on_output]},
                                    process_class=ProcessHandler)

        self.logger.debug("Starting Firefox")
        self.runner.start()
        self.logger.debug("Firefox Started")

    def load_prefs(self):
        prefs_path = os.path.join(self.prefs_root, "prefs_general.js")
        if os.path.exists(prefs_path):
            preferences = Preferences.read_prefs(prefs_path)
        else:
            self.logger.warning("Failed to find base prefs file in %s" % prefs_path)
            preferences = []

        return preferences

    def stop(self):
        self.logger.debug("Stopping browser")
        if self.runner is not None:
            self.runner.stop()

    def pid(self):
        if self.runner.process_handler is not None:
            try:
                pid = self.runner.process_handler.pid
            except AttributeError:
                pid = None
        else:
            pid = None

    def on_output(self, line):
        """Write a line of output from the firefox process to the log"""
        self.logger.process_output(self.pid(),
                                   line.decode("utf8"),
                                   command=" ".join(self.runner.command))

    def is_alive(self):
        return self.runner.is_running()

    def cleanup(self):
        self.stop()

class B2GBrowser(Browser):
    used_ports = set()
    init_timeout = 180

    def __init__(self, logger, prefs_root):
        Browser.__init__(self, logger)
        logger.info("Waiting for device")
        subprocess.call(["adb", "wait-for-device"])
        self.device = mozdevice.DeviceManagerADB()
        self.marionette_port = get_free_port(2828, exclude=self.used_ports)
        self.used_ports.add(self.marionette_port)
        self.cert_test_app = None
        self.runner = None
        self.prefs_root = prefs_root

        self.backup_path = None
        self.backup_dirs = []

    def setup(self):
        self.backup_path = tempfile.mkdtemp()

        self.backup_dirs = [("/data/local", os.path.join(self.backup_path, "local")),
                            ("/data/b2g/mozilla", os.path.join(self.backup_path, "profile"))]

        for remote, local in self.backup_dirs:
            self.device.getDirectory(remote, local)

    def start(self):
        locations = ServerLocations(filename=os.path.join(here, "server-locations.txt"))

#        preferences = self.load_prefs()
        profile = FirefoxProfile(locations=locations, proxy={"remote": moznetwork.get_ip()})#,
                                 #preferences=preferences)

        profile.set_preferences({"dom.disable_open_during_load": False,
                                 # "dom.mozBrowserFramesEnabled": True,
                                 # "dom.ipc.tabs.disabled": False,
                                 # "dom.ipc.browser_frames.oop_by_default": False,
                                 # "marionette.force-local": True,
                                 # "dom.testing.datastore_enabled_for_hosted_apps": True
        })

        self.runner = B2GRunner(profile, self.device, marionette_port=self.marionette_port)
        self.runner.start()

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
        if hasattr(self.logger, "logcat"):
            self.logger.logcat(self.device.getLogcat())

    def cleanup(self):
        self.logger.debug("Running browser cleanup steps")
        if self.runner is not None:
            self.runner.cleanup()

        for remote, local in self.backup_dirs:
            self.device.removeDir(remote)
            self.device.pushDir(local, remote)
        shutil.rmtree(self.backup_path)
        self.device.reboot(wait=True)

    def pid(self):
        return "Remote"

    def is_alive(self):
        return True

    # The following methods are called from a different process

    def after_connect(self, executor):
        executor.logger.debug("Running browser.after_connect steps")
        self.install_cert_app(executor)
        self.use_cert_app(executor)
        self.wait_for_net()

    def install_cert_app(self, executor):
        marionette = executor.marionette
        if self.device.dirExists("/data/local/webapps/certtest-app"):
            executor.logger.info("certtest_app is already installed")
            return
        executor.logger.info("Copying certtest_app")
        self.device.pushFile(os.path.join(here, "device_setup", "certtest_app.zip"),
                             "/data/local/certtest_app.zip")

        executor.logger.info("Installing certtest_app")
        with open(os.path.join(here, "device_setup", "app_install.js"), "r") as f:
            script = f.read()

        marionette.set_context("chrome")
        marionette.set_script_timeout(5000)
        marionette.execute_async_script(script)

    def use_cert_app(self, executor):
        marionette = executor.marionette

        self.wait_for_homescreen(marionette)

        marionette.set_context("content")

        # app management is done in the system app
        marionette.switch_to_frame()

        # TODO: replace this with pkg_resources if we know that we'll be installing this as a package
        marionette.import_script(os.path.join(here, "device_setup", "app_management.js"))
        script = "GaiaApps.launchWithName('CertTest App');"

        # NOTE: if the app is already launched, this doesn't launch a new app, it will return
        # a reference to the existing app
        self.cert_test_app = marionette.execute_async_script(script, script_timeout=5000)
        if not self.cert_test_app:
            raise Exception("Launching CertTest App failed")
        marionette.switch_to_frame(self.cert_test_app["frame"])

    def wait_for_homescreen(self, marionette):
        marionette.set_context(marionette.CONTEXT_CONTENT)
        marionette.execute_async_script("""
let manager = window.wrappedJSObject.AppWindowManager || window.wrappedJSObject.WindowManager;
let app = ('getActiveApp' in manager) ? manager.getActiveApp() : manager.getCurrentDisplayedApp();
log(app);
if (app) {
  log('Already loaded home screen');
  marionetteScriptFinished();
} else {
  log('waiting for mozbrowserloadend');
  window.addEventListener('mozbrowserloadend', function loaded(aEvent) {
    log('received mozbrowserloadend for ' + aEvent.target.src);
    if (aEvent.target.src.indexOf('ftu') != -1 || aEvent.target.src.indexOf('homescreen') != -1) {
      window.removeEventListener('mozbrowserloadend', loaded);
      let app = ('getActiveApp' in manager) ? manager.getActiveApp() : manager.getCurrentDisplayedApp();
      log(app);
      marionetteScriptFinished();
    }
  });
}""", script_timeout=30000)
