#!/usr/bin/env python

import sys, os, json
import spec_validator

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'common', 'security-features', 'tools'))
import util

def rmtree(top):
    top = os.path.abspath(top)
    assert top != os.path.expanduser("~")
    assert len(top) > len(os.path.expanduser("~"))
    assert "wpt" in top
    assert "referrer-policy" in top

    for root, dirs, files in os.walk(top, topdown=False):
        for name in files:
            os.remove(os.path.join(root, name))
        for name in dirs:
            os.rmdir(os.path.join(root, name))

    os.rmdir(top)

def main():
    generated_spec_json_filename = "spec_json.js"
    spec_json = util.load_spec_json("spec.src.json");
    spec_validator.assert_valid_spec_json(spec_json)

    for spec in spec_json['specification']:
        generated_dir = spec["name"]
        if (os.path.isdir(generated_dir)):
            rmtree(generated_dir)

    if (os.path.isfile(generated_spec_json_filename)):
        os.remove(generated_spec_json_filename)

if __name__ == '__main__':
    main()
