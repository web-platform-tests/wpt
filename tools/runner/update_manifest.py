# mypy: ignore-errors

import json
import os

from manifest import manifest
from localpaths import repo_root

def main(request, response):
    path = os.path.join(repo_root, "MANIFEST.json")

    # TODO make this download rather than rebuilding from scratch when possible
    manifest_file = manifest.load_and_update(repo_root, path, "/", parallel=False)

    supported_types = ["testharness", "reftest", "manual"]
    data = {"items": {},
            "url_base": "/"}
    for item_type in supported_types:
        data["items"][item_type] = {}
    for item_type, path, tests in manifest_file.itertypes(*supported_types):
        tests_data = []
        for item in tests:
            test_data = [item.url[1:]]
            if item_type == "reftest":
                test_data.append(item.references)
            test_data.append({})
            if item_type != "manual":
                test_data[-1]["timeout"] = item.timeout
            tests_data.append(test_data)
        assert path not in data["items"][item_type]
        data["items"][item_type][path] = tests_data

    return [("Content-Type", "application/json")], json.dumps(data)
