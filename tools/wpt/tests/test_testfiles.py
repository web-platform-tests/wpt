# mypy: allow-untyped-defs

import os.path
from unittest.mock import patch

from tools.manifest.manifest import Manifest
from tools.wpt import testfiles


def test_getrevish_kwarg():
    assert testfiles.get_revish(revish="abcdef") == "abcdef"
    assert testfiles.get_revish(revish="123456\n") == "123456"


def test_getrevish_implicit():
    with patch("tools.wpt.testfiles.branch_point", return_value="base"):
        assert testfiles.get_revish() == "base..HEAD"


def test_affected_testfiles():
    manifest_json = {
        "items": {
            "crashtest": {
                "a": {
                    "b": {
                        "c": {
                            "foo-crash.html": [
                                "acdefgh123456",
                                ["null", {}],
                            ]
                        }
                    }
                }
            }
        },
        "url_base": "/",
        "version": 8,
    }
    manifest = Manifest.from_json("/", manifest_json)
    with patch("tools.wpt.testfiles.load_manifest", return_value=manifest):
        # Dependent affected tests are determined by walking the filesystem,
        # which doesn't work in our test setup. We would need to refactor
        # testfiles.affected_testfiles or have a more complex test setup to
        # support testing those.
        full_test_path = os.path.join(
            testfiles.wpt_root, "a", "b", "c", "foo-crash.html")
        tests_changed, _ = testfiles.affected_testfiles([full_test_path])
        assert tests_changed == {full_test_path}
