import argparse
import subprocess
import os
import sys

here = os.path.dirname(__file__)
wpt_root = os.path.abspath(os.path.join(here, ".."))

# Directories relative to the wpt root that we want to include in the docs
# Sphinx doesn't support including files outside of docs/ so we temporarily symlink
# these directories under docs/ whilst running the build.
link_dirs = [
    "tools/wptserve",
    "tools/certs",
    "tools/wptrunner",
    "tools/webtransport",
    "tools/third_party/pywebsocket3"
]


def link_source_dirs():
    created = set()
    failed = []
    for rel_path in link_dirs:
        rel_path = rel_path.replace("/", os.path.sep)
        src = os.path.join(wpt_root, rel_path)
        dest = os.path.join(here, rel_path)
        try:
            dest_dir = os.path.dirname(dest)
            if not os.path.exists(dest_dir):
                os.makedirs(dest_dir)
                created.add(dest_dir)
            if not os.path.exists(dest):
                os.symlink(src, dest, target_is_directory=True)
            else:
                if (not os.path.islink(dest) or
                    os.path.join(os.path.dirname(dest), os.readlink(dest)) != src):
                    # The file exists but it isn't a link or points at the wrong target
                    raise OSError("File exists")
        except Exception as e:
            failed.append((dest, e))
        else:
            created.add(dest)
    return created, failed


def unlink_source_dirs(created):
    # Sort backwards in length to remove all files before getting to directory
    for path in sorted(created, key=lambda x: -len(x)):
        # This will also remove empty parent directories
        if not os.path.islink(path) and os.path.isdir(path):
            os.removedirs(path)
        else:
            os.unlink(path)


def get_parser():
    p = argparse.ArgumentParser()
    p.add_argument("--type", default="html", help="Output type (default: html)")
    return p


def build(_venv, **kwargs):
    try:
        created, failed = link_source_dirs()
        if failed:
            failure_msg = "\n".join(f"{dest}: {err}" for (dest, err) in failed)
            print(f"Failed to create source symlinks:\n{failure_msg}")
            sys.exit(1)
        subprocess.check_call(["sphinx-build",
                               "-n", "-v",
                               "-b", kwargs["type"],
                               here,
                               os.path.join(here, "_build")])
    finally:
        unlink_source_dirs(created)
