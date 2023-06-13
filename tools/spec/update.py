#!/usr/bin/env python3
import argparse
import os
from typing import Any, Optional, TYPE_CHECKING

from ..manifest.manifest import load_and_update


here = os.path.dirname(__file__)

wpt_root = os.path.join(os.path.abspath(os.path.join(here, os.pardir, os.pardir)), "accessibility")


def update_from_cli(**kwargs: Any) -> None:
    print("GIVE ME SPEC LABELLING NOWWWWW")
    print(wpt_root)
    tests_root = kwargs["tests_root"]
    path = kwargs["path"]
    assert tests_root is not None

    load_and_update(tests_root,
                    path,
                    kwargs["url_base"],
                    update=True,
                    rebuild=kwargs["rebuild"],
                    cache_root=kwargs["cache_root"],
                    parallel=kwargs["parallel"])


def abs_path(path: str) -> str:
    return os.path.abspath(os.path.expanduser(path))


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-v", "--verbose", dest="verbose", action="store_true", default=False,
        help="Turn on verbose logging")
    parser.add_argument(
        "-p", "--path", type=abs_path, help="Path to manifest file.")
    parser.add_argument(
        "--tests-root", type=abs_path, default=wpt_root, help="Path to root of tests.")
    parser.add_argument(
        "-r", "--rebuild", action="store_true", default=False,
        help="Force a full rebuild of the manifest.")
    parser.add_argument(
        "--url-base", action="store", default="/",
        help="Base url to use as the mount point for tests in this manifest.")
    parser.add_argument(
        "--no-download", dest="download", action="store_false", default=True,
        help="Never attempt to download the manifest.")
    parser.add_argument(
        "--cache-root", action="store", default=os.path.join(wpt_root, ".wptcache"),
        help="Path in which to store any caches (default <tests_root>/.wptcache/)")
    parser.add_argument(
        "--no-parallel", dest="parallel", action="store_false", default=True,
        help="Do not parallelize building the manifest")
    return parser


def run(*args: Any, **kwargs: Any) -> None:
    if kwargs["path"] is None:
        kwargs["path"] = os.path.join(kwargs["tests_root"], "SPEC_MANIFEST.json")
    update_from_cli(**kwargs)


if __name__ == "__main__":
    opts = create_parser().parse_args()

    run(**vars(opts))
