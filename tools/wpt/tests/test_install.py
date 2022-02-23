import logging
import os
import sys

import pytest

from tools.wpt import browser, utils, wpt


@pytest.mark.slow
@pytest.mark.remote_network
def test_install_chrome():
    with pytest.raises(NotImplementedError):
        wpt.main(argv=["install", "chrome", "browser"])


@pytest.mark.slow
@pytest.mark.remote_network
def test_install_chromedriver_by_version():
    # This is not technically an integration test as we do not want to require Chrome Stable to run it.
    chrome = browser.Chrome(logging.getLogger("Chrome"))
    if sys.platform == "win32":
        dest = os.path.join(wpt.localpaths.repo_root, wpt.venv_dir(), "Scripts")
        chromedriver_path = os.path.join(dest, "chrome", "chromedriver.exe")
    else:
        dest = os.path.join(wpt.localpaths.repo_root, wpt.venv_dir(), "bin")
        chromedriver_path = os.path.join(dest, "chrome", "chromedriver")
    if os.path.exists(chromedriver_path):
        os.unlink(chromedriver_path)
    # This is a stable version.
    binary_path = chrome.install_webdriver_by_version(dest=dest, version="84.0.4147.89")
    assert binary_path == chromedriver_path
    assert os.path.exists(chromedriver_path)
    os.unlink(chromedriver_path)


@pytest.mark.slow
@pytest.mark.remote_network
def test_install_chromedriver_nightly():
    if sys.platform == "win32":
        chromedriver_path = os.path.join(wpt.localpaths.repo_root, wpt.venv_dir(), "Scripts", "chrome", "chromedriver.exe")
    else:
        chromedriver_path = os.path.join(wpt.localpaths.repo_root, wpt.venv_dir(), "bin", "chrome", "chromedriver")
    if os.path.exists(chromedriver_path):
        os.unlink(chromedriver_path)
    with pytest.raises(SystemExit) as excinfo:
        wpt.main(argv=["install", "chrome", "webdriver"])
    assert excinfo.value.code == 0
    assert os.path.exists(chromedriver_path)
    # FIXME: On Windows, this may sometimes fail (access denied), possibly
    # because the file handler is not released immediately.
    try:
        os.unlink(chromedriver_path)
    except OSError:
        if sys.platform != "win32":
            raise


@pytest.mark.slow
@pytest.mark.remote_network
@pytest.mark.xfail(sys.platform == "win32",
                   reason="https://github.com/web-platform-tests/wpt/issues/17074")
def test_install_firefox():
    if sys.platform == "darwin":
        fx_path = os.path.join(wpt.localpaths.repo_root, wpt.venv_dir(), "browsers", "nightly", "Firefox Nightly.app")
    else:
        fx_path = os.path.join(wpt.localpaths.repo_root, wpt.venv_dir(), "browsers", "nightly", "firefox")
    if os.path.exists(fx_path):
        utils.rmtree(fx_path)
    with pytest.raises(SystemExit) as excinfo:
        wpt.main(argv=["install", "firefox", "browser", "--channel=nightly"])
    assert excinfo.value.code == 0
    assert os.path.exists(fx_path)
    utils.rmtree(fx_path)
