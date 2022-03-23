import logging
import os
import shutil
import site
import sys
import venv
from distutils.spawn import find_executable

# The `pkg_resources` module is provided by `setuptools`, which is itself a
# dependency of `virtualenv`. Tolerate its absence so that this module may be
# evaluated when that module is not available. Because users may not recognize
# the `pkg_resources` module by name, raise a more descriptive error if it is
# referenced during execution.
try:
    import pkg_resources as _pkg_resources
    get_pkg_resources = lambda: _pkg_resources
except ImportError:
    def get_pkg_resources():
        raise ValueError("The Python module `virtualenv` is not installed.")

from tools.wpt.utils import call

logger = logging.getLogger(__name__)


class Virtualenv(object):
    def __init__(self, path, skip_virtualenv_setup):
        self.path = path
        self.skip_virtualenv_setup = skip_virtualenv_setup
        self._working_set = None

    @property
    def exists(self):
        # We need to check also for lib_path because different python versions
        # create different library paths.
        return os.path.isdir(self.path) and os.path.isdir(self.lib_path)

    @property
    def broken_link(self):
        python_link = os.path.join(self.path, ".Python")
        return os.path.lexists(python_link) and not os.path.exists(python_link)

    def create(self):
        if os.path.exists(self.path):
            shutil.rmtree(self.path)
            self._working_set = None
        venv.create(self.path, with_pip=True)
        if not os.path.exists(self.pip_path):
            raise ValueError(f"pip not installed into virtualenv at {self.pip_path}. "
                             "the ensurepip Python library may be missing")

    @property
    def bin_path(self):
        if sys.platform in ("win32", "cygwin"):
            return os.path.join(self.path, "Scripts")
        return os.path.join(self.path, "bin")

    @property
    def pip_path(self):
        return os.path.join(self.bin_path, "pip3")

    @property
    def lib_path(self):
        base = self.path

        # this block is literally taken from virtualenv 16.4.3
        IS_PYPY = hasattr(sys, "pypy_version_info")
        IS_JYTHON = sys.platform.startswith("java")
        if IS_JYTHON:
            site_packages = os.path.join(base, "Lib", "site-packages")
        elif IS_PYPY:
            site_packages = os.path.join(base, "site-packages")
        else:
            IS_WIN = sys.platform == "win32"
            if IS_WIN:
                site_packages = os.path.join(base, "Lib", "site-packages")
            else:
                site_packages = os.path.join(base, "lib", "python{}".format(sys.version[:3]), "site-packages")

        return site_packages

    @property
    def working_set(self):
        if not self.exists:
            raise ValueError("trying to read working_set when venv doesn't exist")

        if self._working_set is None:
            self._working_set = get_pkg_resources().WorkingSet((self.lib_path,))

        return self._working_set

    def activate(self):
        if sys.platform == 'darwin':
            # The default Python on macOS sets a __PYVENV_LAUNCHER__ environment
            # variable which affects invocation of python (e.g. via pip) in a
            # virtualenv. Unset it if present to avoid this. More background:
            # https://github.com/web-platform-tests/wpt/issues/27377
            # https://github.com/python/cpython/pull/9516
            os.environ.pop('__PYVENV_LAUNCHER__', None)
        # Update the Python environment to match the virtualenv settings
        # Adapted from https://github.com/pypa/virtualenv/blob/main/src/virtualenv/activation/python/activate_this.py
        os.environ["PATH"] = os.pathsep.join([self.bin_path] + os.environ.get("PATH", "").split(os.pathsep))
        os.environ["VIRTUAL_ENV"] = self.path
        prev_length = len(sys.path)
        site.addsitedir(self.lib_path)
        sys.path[:] = sys.path[prev_length:] + sys.path[0:prev_length]

        sys.real_prefix = sys.prefix
        sys.prefix = self.path

    def start(self):
        if not self.exists or self.broken_link:
            self.create()
        self.activate()

    def install(self, *requirements):
        try:
            self.working_set.require(*requirements)
        except Exception:
            pass
        else:
            return

        # `--prefer-binary` guards against race conditions when installation
        # occurs while packages are in the process of being published.
        call(self.pip_path, "install", "--prefer-binary", *requirements)

    def install_requirements(self, requirements_path):
        with open(requirements_path) as f:
            try:
                self.working_set.require(f.read())
            except Exception:
                pass
            else:
                return

        # `--prefer-binary` guards against race conditions when installation
        # occurs while packages are in the process of being published.
        call(
            self.pip_path, "install", "--prefer-binary", "-r", requirements_path
        )
