# mypy: allow-untyped-defs

import os
import runpy
from unittest import mock

import pytest


taskcluster_run = runpy.run_path(os.path.join(os.path.dirname(__file__), "..", "taskcluster-run.py"))


@pytest.mark.parametrize("product,webdriver", [
    ("webkitgtk_minibrowser", "WebKitWebDriver"),
    ("wpewebkit_minibrowser", "WPEWebDriver"),
])
@pytest.mark.parametrize("channel", ["nightly", "beta", "stable"])
def test_minibrowser_uses_shared_bundle(tmp_path, product, webdriver, channel):
    with mock.patch("subprocess.call", return_value=0) as run_command:
        taskcluster_run["main"](product, channel, None, str(tmp_path), [f"--channel={channel}"])

    command = run_command.call_args.args[0]
    bundle_directory = os.path.expanduser(os.path.join("~", "build", product))
    assert command[:3] == ["python3", "./wpt", "run"]
    assert command[-1] == product
    assert "--binary=" + os.path.join(bundle_directory, "MiniBrowser") in command
    assert "--webdriver-binary=" + os.path.join(bundle_directory, webdriver) in command
    assert "--processes=4" in command
    assert not any(argument.startswith("--install-browser") for argument in command)
    assert "--install-webdriver" not in command
