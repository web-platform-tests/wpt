# mypy: ignore-errors

import json
import os

import pytest

from tools.wpt import update, wpt
from wptrunner import manifestexpected
from wptrunner.manifestupdate import get_test_name
from localpaths import repo_root


@pytest.fixture
def metadata_file(tmp_path):
    created_files = []

    def create_metadata(test_id, subtest_name, product, status="OK", subtest_status="PASS", channel="nightly"):
        run_info = {
            "os": "linux",
            "processor": "x86_64",
            "version": "Ubuntu 20.04",
            "os_version": "20.04",
            "bits": 64,
            "linux_distro": "Ubuntu",
            "product": product,
            "debug": False,
            "browser_version": "98.0.2",
            "browser_channel": channel,
            "verify": False,
            "headless": True,
        }

        result = {
            "test": test_id,
            "subtests": [
                {
                    "name": subtest_name,
                    "status": subtest_status,
                    "message": None,
                    "known_intermittent": []
                }
            ],
            "status": status,
            "message": None,
            "duration": 555,
            "known_intermittent": []
        }

        if status != "OK":
            result["expected"] = "OK"

        if subtest_status != "PASS":
            result["subtests"][0]["expected"] = "PASS"

        data = {
            "time_start": 1648629686379,
            "run_info": run_info,
            "results": [result],
            "time_end": 1648629698721
        }

        path = os.path.join(tmp_path, f"wptreport-{len(created_files)}.json")
        with open(path, "w") as f:
            json.dump(data, f)

        created_files.append(path)
        return run_info, path

    yield create_metadata

    for path in created_files:
        os.unlink(path)


def test_update(tmp_path, metadata_file):
    # This has to be a real test so it's in the manifest
    test_id = "/infrastructure/assumptions/cookie.html"
    subtest_name = "cookies work in default browse settings"
    test_path = os.path.join("infrastructure",
                             "assumptions",
                             "cookie.html")
    run_info_firefox, path_firefox = metadata_file(test_id,
                                                   subtest_name,
                                                   "firefox",
                                                   subtest_status="FAIL",
                                                   channel="nightly")
    run_info_chrome, path_chrome = metadata_file(test_id,
                                                 subtest_name,
                                                 "chrome",
                                                 status="ERROR",
                                                 subtest_status="NOTRUN",
                                                 channel="dev")

    metadata_path = str(os.path.join(tmp_path, "metadata"))
    os.makedirs(metadata_path)
    wptreport_paths = [path_firefox, path_chrome]

    update_properties = {"properties": ["product"]}
    with open(os.path.join(metadata_path, "update_properties.json"), "w") as f:
        json.dump(update_properties, f)

    args = ["update-expectations",
            "--manifest", os.path.join(repo_root, "MANIFEST.json"),
            "--metadata", metadata_path,
            "--log-mach-level", "debug"]
    args += wptreport_paths

    with pytest.raises(SystemExit) as excinfo:
        wpt.main(argv=args)

    assert excinfo.value.code == 0

    expectation_path = os.path.join(metadata_path, test_path + ".ini")

    assert os.path.exists(expectation_path)

    firefox_expected = manifestexpected.get_manifest(metadata_path,
                                                     test_path,
                                                     run_info_firefox)
    # Default expected isn't stored
    with pytest.raises(KeyError):
        assert firefox_expected.get_test(get_test_name(test_id)).get("expected")
    assert firefox_expected.get_test(get_test_name(test_id)).get_subtest(subtest_name).expected == "FAIL"

    chrome_expected = manifestexpected.get_manifest(metadata_path,
                                                    test_path,
                                                    run_info_chrome)
    assert chrome_expected.get_test(get_test_name(test_id)).expected == "ERROR"
    assert chrome_expected.get_test(get_test_name(test_id)).get_subtest(subtest_name).expected == "NOTRUN"


@pytest.mark.parametrize("option", ["include", "exclude"])
def test_update_prefix_option_and_file(tmp_path, metadata_file, option):
    # These have to be real tests so they're in the manifest
    named = "/infrastructure/assumptions/allowed-to-play.html"
    named_in_file = "/infrastructure/assumptions/cookie.html"
    not_named = "/infrastructure/assumptions/document-fonts-ready.html"
    test_ids = [named, named_in_file, not_named]
    subtest_name = "subtest"
    wptreport_paths = [metadata_file(test_id, subtest_name, "firefox", subtest_status="FAIL")[1]
                       for test_id in test_ids]

    metadata_path = str(os.path.join(tmp_path, "metadata"))
    os.makedirs(metadata_path)
    with open(os.path.join(metadata_path, "update_properties.json"), "w") as f:
        json.dump({"properties": ["product"]}, f)

    prefix_file = os.path.join(tmp_path, "prefixes.txt")
    with open(prefix_file, "w") as f:
        f.write(named_in_file + "\n")

    args = update.create_parser_update().parse_args(
        ["--manifest", os.path.join(repo_root, "MANIFEST.json"),
         "--metadata", metadata_path,
         "--log-mach-level", "debug",
         f"--{option}", named,
         f"--{option}-file", prefix_file] + wptreport_paths)

    update.update_expectations(None, **vars(args))

    # --include/--exclude and their -file variants are combined
    updated = {test_id for test_id in test_ids
               if os.path.exists(os.path.join(metadata_path, test_id.lstrip("/") + ".ini"))}
    if option == "include":
        assert updated == {named, named_in_file}
    else:
        assert updated == {not_named}

    # and the parsed arguments aren't modified in the process
    assert getattr(args, option) == [named]


def test_update_include_manifest(tmp_path, metadata_file):
    # These have to be real tests so they're in the manifest
    included = "/infrastructure/assumptions/cookie.html"
    not_included = "/infrastructure/assumptions/document-fonts-ready.html"
    test_ids = [included, not_included]
    wptreport_paths = [metadata_file(test_id, "subtest", "firefox", subtest_status="FAIL")[1]
                       for test_id in test_ids]

    metadata_path = str(os.path.join(tmp_path, "metadata"))
    os.makedirs(metadata_path)
    with open(os.path.join(metadata_path, "update_properties.json"), "w") as f:
        json.dump({"properties": ["product"]}, f)

    include_manifest = os.path.join(tmp_path, "include.ini")
    with open(include_manifest, "w") as f:
        f.write("skip: true\n"
                "[infrastructure]\n"
                "  [assumptions]\n"
                "    [cookie.html]\n"
                "      skip: false\n")

    args = update.create_parser_update().parse_args(
        ["--manifest", os.path.join(repo_root, "MANIFEST.json"),
         "--metadata", metadata_path,
         "--log-mach-level", "debug",
         "--include-manifest", include_manifest] + wptreport_paths)

    update.update_expectations(None, **vars(args))

    updated = {test_id for test_id in test_ids
               if os.path.exists(os.path.join(metadata_path, test_id.lstrip("/") + ".ini"))}
    assert updated == {included}
