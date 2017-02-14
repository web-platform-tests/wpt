#!/usr/bin/env python

import difflib
import json
import os
import subprocess
import sys


def call(*args):
    return subprocess.check_output(args)


def get_manifest(rev):
    call("git", "checkout", rev)
    call("./manifest", "-r")
    with open("MANIFEST.json", "r") as fp:
        return fp.readlines()


def main():
    after = get_manifest("HEAD")

    call("git", "fetch", "origin", "master:master")
    commit_range = os.environ.get("TRAVIS_COMMIT_RANGE")
    if commit_range:
        merge_base = commit_range.split(".", 1)[0]
    else:
        merge_base = call("git", "merge-base", "master", "HEAD").strip()
    before = get_manifest(merge_base)

    diff = difflib.unified_diff(before, after,
                                fromfile='before.json', tofile='after.json')
    for line in diff:
        sys.stdout.write(line)


if __name__ == "__main__":
    main()
