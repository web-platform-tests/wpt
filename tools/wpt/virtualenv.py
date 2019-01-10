import os
import shutil
import sys
import logging
from distutils.spawn import find_executable

from tools.wpt.utils import call

logger = logging.getLogger(__name__)


def add_site_package_path(root_path):
    """Update system path to include packages from existing virtualenv"""
    for root, dirs, files in os.walk(root_path + "/lib"):
        if "site-packages" in dirs:
            site_package_path = root + "/site-packages"
            logger.info("Using site packages from %s" % site_package_path)
            sys.path.append(site_package_path)
            return


class Virtualenv(object):
    def __init__(self, path, skip_virtualenv_setup):
        self.path = path
        self.skip_virtualenv_setup = skip_virtualenv_setup
        if skip_virtualenv_setup:
            # Adjust paths so we can locate things like installed packages and
            # downloaded webdrivers
            expanded_venv_path = os.path.abspath(path)
            add_site_package_path(expanded_venv_path)
            bin_path = expanded_venv_path + "/bin"
            os.environ["PATH"] += os.pathsep + bin_path
        else:
            self.virtualenv = find_executable("virtualenv")
            if not self.virtualenv:
                raise ValueError("virtualenv must be installed and on the PATH")

    @property
    def exists(self):
        return os.path.isdir(self.path)

    def create(self):
        if self.skip_virtualenv_setup:
            return
        if os.path.exists(self.path):
            shutil.rmtree(self.path)
        call(self.virtualenv, self.path, "-p", sys.executable)

    @property
    def bin_path(self):
        if sys.platform in ("win32", "cygwin"):
            return os.path.join(self.path, "Scripts")
        return os.path.join(self.path, "bin")

    @property
    def pip_path(self):
        path = find_executable("pip", self.bin_path)
        if path is None:
            raise ValueError("pip not found")
        return path

    def activate(self):
        if self.skip_virtualenv_setup:
            return
        path = os.path.join(self.bin_path, "activate_this.py")
        execfile(path, {"__file__": path})  # noqa: F821

    def start(self):
        if self.skip_virtualenv_setup:
            return
        if not self.exists:
            self.create()
        self.activate()

    def install(self, *requirements):
        if self.skip_virtualenv_setup:
            return
        call(self.pip_path, "install", *requirements)

    def install_requirements(self, requirements_path):
        if self.skip_virtualenv_setup:
            return
        call(self.pip_path, "install", "-r", requirements_path)
