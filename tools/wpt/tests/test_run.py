import mock
import tempfile
import shutil
import sys

import pytest

from tools.wpt import run
from tools import localpaths  # noqa: F401
from wptrunner.browsers import product_list

from wptrunner import wptcommandline


@pytest.fixture(scope="module")
def venv():
    from tools.wpt import virtualenv

    class Virtualenv(virtualenv.Virtualenv):
        def __init__(self):
            self.path = tempfile.mkdtemp()
            self.skip_virtualenv_setup = False

        def create(self):
            return

        def activate(self):
            return

        def start(self):
            return

        def install(self, *requirements):
            return

        def install_requirements(self, requirements_path):
            return

    venv = Virtualenv()
    yield venv

    shutil.rmtree(venv.path)


@pytest.fixture(scope="module")
def logger():
    run.setup_logging({})


@pytest.mark.parametrize("platform", ["Windows", "Linux", "Darwin"])
def test_check_environ_fail(platform):
    m_open = mock.mock_open(read_data=b"")

    with mock.patch.object(run, "open", m_open):
        with mock.patch.object(run.platform, "uname",
                               return_value=(platform, "", "", "", "", "")):
            with pytest.raises(run.WptrunError) as excinfo:
                run.check_environ("foo")

    assert "wpt make-hosts-file" in str(excinfo.value)


@pytest.mark.parametrize("product", product_list)
def test_setup_wptrunner(venv, logger, product):
    if product == "firefox_android":
        pytest.skip("Android emulator doesn't work on docker")
    parser = run.create_parser()
    kwargs = vars(parser.parse_args(["--channel=nightly", product]))
    kwargs["prompt"] = False
    # Hack to get a real existing path
    kwargs["binary"] = sys.argv[0]
    kwargs["webdriver_binary"] = sys.argv[0]
    if kwargs["product"] == "sauce":
        kwargs["product"] = "sauce:firefox:63"
    run.setup_wptrunner(venv, **kwargs)

def run_cmdline_test(cmdline, key, value):
    parser = run.create_parser()
    kwargs = vars(parser.parse_args(cmdline.split()))
    wptcommandline.check_log_verbose(kwargs)
    assert kwargs.get(key) == value

def test_opt_mach_verbose():
    run_cmdline_test("--log-mach - --verbose chrome",
                     "log_mach_level", "debug")

def test_opt_verbose_log_mach_level_debug():
    run_cmdline_test("--log-mach - --verbose --log-mach-level debug chrome",
                     "log_mach_level", "debug")

def test_opt_verbose_log_mach_level_info():
    run_cmdline_test("--log-mach - --verbose --log-mach-level info chrome",
                     "log_mach_level", "info")

def test_opt_raw_verbose():
    run_cmdline_test("--log-raw - --verbose chrome",
                     "log_raw_level", "debug")

def test_opt_verbose_log_raw_level_debug():
    run_cmdline_test("--log-raw - --verbose --log-raw-level debug chrome",
                     "log_raw_level", "debug")

def test_opt_verbose_log_raw_level_info():
    run_cmdline_test("--log-raw - --verbose --log-raw-level info chrome",
                     "log_raw_level", "info")

def test_opt_tbpl_verbose():
    run_cmdline_test("--log-tbpl - --verbose chrome",
                     "log_tbpl_level", "debug")

def test_opt_verbose_log_tbpl_level_debug():
    run_cmdline_test("--log-tbpl - --verbose --log-tbpl-level debug chrome",
                     "log_tbpl_level", "debug")

def test_opt_verbose_log_tbpl_level_info():
    run_cmdline_test("--log-tbpl - --verbose --log-tbpl-level info chrome",
                     "log_tbpl_level", "info")
