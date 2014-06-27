# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import argparse
import os
import sys

def abs_path(path):
    return os.path.abspath(os.path.expanduser(path))


def slash_prefixed(url):
    if not url.startswith("/"):
        url = "/" + url
    return url


def require_arg(kwargs, name, value_func=None):
    if value_func is None:
        value_func = lambda x: x is not None

    if not name in kwargs or not value_func(kwargs[name]):
        print >> sys.stderr, "Missing required argument %s" % name
        sys.exit(1)


def create_parser(allow_mandatory=True):
    from mozlog.structured import commandline
    import browsers

    if not allow_mandatory:
        prefix = "--"
    else:
        prefix = ""
    parser = argparse.ArgumentParser("web-platform-tests",
                                     description="Runner for web-platform-tests tests.")
    parser.add_argument("--binary", action="store",
                        type=abs_path,
                        help="Binary to run tests against")
    parser.add_argument(prefix + "metadata_root",
                        action="store", type=abs_path,
                        help="Path to the folder containing test metadata"),
    parser.add_argument(prefix + "tests_root", action="store", type=abs_path,
                        help="Path to web-platform-tests"),
    parser.add_argument("--prefs-root", dest="prefs_root",
                        action="store", type=abs_path,
                        help="Path to the folder containing browser prefs"),
    parser.add_argument("--test-types", action="store",
                        nargs="*", default=["testharness", "reftest"],
                        choices=["testharness", "reftest"],
                        help="Test types to run")
    parser.add_argument("--processes", action="store", type=int, default=1,
                        help="Number of simultaneous processes to use")
    parser.add_argument("--include", action="append", type=slash_prefixed,
                        help="URL prefix to include")
    parser.add_argument("--exclude", action="append", type=slash_prefixed,
                        help="URL prefix to exclude")
    parser.add_argument("--include-manifest", type=abs_path,
                        help="Path to manifest listing tests to include")

    parser.add_argument("--total-chunks", action="store", type=int, default=1,
                        help="Total number of chunks to use")
    parser.add_argument("--this-chunk", action="store", type=int, default=1,
                        help="Chunk number to run")
    parser.add_argument("--chunk-type", action="store", choices=["none", "equal_time", "hash"],
                        default="none", help="Chunking type to use")

    parser.add_argument("--list-test-groups", action="store_true",
                        default=False,
                        help="List the top level directories containing tests that will run.")
    parser.add_argument("--list-disabled", action="store_true",
                        default=False,
                        help="List the tests that are disabled on the current platform")

    parser.add_argument("--timeout-multiplier", action="store", type=float, default=None,
                        help="Multiplier relative to standard test timeout to use")
    parser.add_argument("--repeat", action="store", type=int, default=1,
                        help="Number of times to run the tests")

    parser.add_argument("--no-capture-stdio", action="store_true", default=False,
                        help="Don't capture stdio and write to logging")

    parser.add_argument("--product", action="store", choices=browsers.product_list,
                        default="firefox")

    parser.add_argument('--debugger',
                        help="run under a debugger, e.g. gdb or valgrind")
    parser.add_argument('--debugger-args', help="arguments to the debugger")
    parser.add_argument('--pause-on-unexpected', action="store_true",
                        help="Halt the test runner when an unexpected result is encountered")

    parser.add_argument("--b2g-no-backup", action="store_true", default=False,
                        help="Don't backup device before testrun with --product=b2g")

    commandline.add_logging_group(parser)
    return parser


def check_args(kwargs):
    from mozrunner import cli

    if kwargs["this_chunk"] > 1:
        require_arg(kwargs, "total_chunks", lambda x: x >= kwargs["this_chunk"])

        if kwargs["chunk_type"] == "none":
            kwargs["chunk_type"] = "equal_time"

    if kwargs["debugger"] is not None:
        debug_args, interactive = cli.debugger_arguments(kwargs["debugger"],
                                                         kwargs["debugger_args"])
        if interactive:
            require_arg(kwargs, "processes", lambda x: x == 1)
            kwargs["no_capture_stdio"] = True
        kwargs["interactive"] = interactive
        kwargs["debug_args"] = debug_args
    else:
        kwargs["interactive"] = False
        kwargs["debug_args"] = None

    return kwargs


def create_parser_update(allow_mandatory=True):
    if not allow_mandatory:
        prefix = "--"
    else:
        prefix = ""

    parser = argparse.ArgumentParser("web-platform-tests-update",
                                     description="Update script for web-platform-tests tests.")
    parser.add_argument(prefix + "config", action="store", type=abs_path,
                        help="Path to config file")
    parser.add_argument(prefix + "data_root", action="store", type=abs_path,
                        help="Base path for data files")
    parser.add_argument("--rev", action="store", help="Revision to sync to")
    parser.add_argument("--no-check-clean", action="store_true", default=False,
                        help="Don't check the working directory is clean before updating")
    parser.add_argument("--no-sync", dest="sync", action="store_false", default=True,
                        help="Don't resync the tests, just update the expected results")
    parser.add_argument("--update-expected-type", action="store", dest="run_type",
                        choices=["none", "try", "logfile"],
                        default="none", help="Process to use for updating the expectation data")
    # Should make this required iff run=logfile
    parser.add_argument("run_log", nargs="*", type=abs_path,
                        help="Log file from run of tests")
    return parser


def create_parser_reduce(allow_mandatory=True):
    parser = create_parser(allow_mandatory)
    parser.add_argument("target", action="store", help="Test id that is unstable")
    return parser


def parse_args():
    parser = create_parser()
    rv = vars(parser.parse_args())
    check_args(rv)
    return rv
