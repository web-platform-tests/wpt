from __future__ import print_function

import argparse
import itertools
import logging
import os
import re
import stat
import subprocess
import sys
import tarfile
import zipfile
from ConfigParser import RawConfigParser, SafeConfigParser
from abc import ABCMeta, abstractmethod
from cStringIO import StringIO as CStringIO
from collections import defaultdict, OrderedDict
from io import BytesIO, StringIO

from tools.wpt import testfiles
from testfiles import get_git_cmd
from tools.browserutils.virtualenv import Virtualenv
from tools.browserutils.utils import Kwargs
from tools.wpt.run import run

logger = None

wpt_root = os.path.dirname(__file__)

def setup_logging():
    """Set up basic debug logger."""
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(logging.BASIC_FORMAT, None)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)


class TravisFold(object):

    """Context for TravisCI folding mechanism. Subclasses object.

    See: https://blog.travis-ci.com/2013-05-22-improving-build-visibility-log-folds/
    """

    def __init__(self, name):
        """Register TravisCI folding section name."""
        self.name = name

    def __enter__(self):
        """Emit fold start syntax."""
        print("travis_fold:start:%s" % self.name, file=sys.stderr)

    def __exit__(self, type, value, traceback):
        """Emit fold end syntax."""
        print("travis_fold:end:%s" % self.name, file=sys.stderr)


class FilteredIO(object):
    """Wrap a file object, invoking the provided callback for every call to
    `write` and only proceeding with the operation when that callback returns
    True."""
    def __init__(self, original, on_write):
        self.original = original
        self.on_write = on_write

    def __getattr__(self, name):
        return getattr(self.original, name)

    def disable(self):
        self.write = lambda msg: None

    def write(self, msg):
        encoded = msg.encode("utf8", "backslashreplace").decode("utf8")
        if self.on_write(self.original, encoded) is True:
            self.original.write(encoded)


def replace_streams(capacity, warning_msg):
    # Value must be boxed to support modification from inner function scope
    count = [0]
    capacity -= 2 + len(warning_msg)
    stderr = sys.stderr

    def on_write(handle, msg):
        length = len(msg)
        count[0] += length

        if count[0] > capacity:
            wrapped_stdout.disable()
            wrapped_stderr.disable()
            handle.write(msg[0:capacity - count[0]])
            handle.flush()
            stderr.write("\n%s\n" % warning_msg)
            return False

        return True

    # Store local references to the replaced streams to guard against the case
    # where other code replace the global references.
    sys.stdout = wrapped_stdout = FilteredIO(sys.stdout, on_write)
    sys.stderr = wrapped_stderr = FilteredIO(sys.stderr, on_write)


def call(*args):
    """Log terminal command, invoke it as a subprocess.

    Returns a bytestring of the subprocess output if no error.
    """
    logger.debug("%s" % " ".join(args))
    try:
        return subprocess.check_output(args)
    except subprocess.CalledProcessError as e:
        logger.critical("%s exited with return code %i" %
                        (e.cmd, e.returncode))
        logger.critical(e.output)
        raise

def fetch_wpt(user, *args):
    git = get_git_cmd(wpt_root)
    git("fetch", "https://github.com/%s/web-platform-tests.git" % user, *args)


def get_sha1():
    """ Get and return sha1 of current git branch HEAD commit."""
    git = get_git_cmd(wpt_root)
    return git("rev-parse", "HEAD").strip()


def install_wptrunner():
    """Install wptrunner."""
    call("pip", "install", wptrunner_root)


def deepen_checkout(user):
    """Convert from a shallow checkout to a full one"""
    fetch_args = [user, "+refs/heads/*:refs/remotes/origin/*"]
    if os.path.exists(os.path.join(wpt_root, ".git", "shallow")):
        fetch_args.insert(1, "--unshallow")
    fetch_wpt(*fetch_args)


def get_parser():
    """Create and return script-specific argument parser."""
    description = """Detect instabilities in new tests by executing tests
    repeatedly and comparing results between executions."""
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--comment-pr",
                        action="store",
                        default=os.environ.get("TRAVIS_PULL_REQUEST"),
                        help="PR to comment on with stability results")
    parser.add_argument("--user",
                        action="store",
                        # Travis docs say do not depend on USER env variable.
                        # This is a workaround to get what should be the same value
                        default=os.environ.get("TRAVIS_REPO_SLUG", "w3c").split('/')[0],
                        help="Travis user name")
    parser.add_argument("--output-bytes",
                        action="store",
                        type=int,
                        help="Maximum number of bytes to write to standard output/error")
    parser.add_argument("--config-file",
                        action="store",
                        type=str,
                        help="Location of ini-formatted configuration file",
                        default="check_stability.ini")
    return parser


def set_default_args(kwargs):
    kwargs["product"] = kwargs["product"].split(":")[0]

    kwargs.set_if_none("sauce_platform",
                        default=os.environ.get("PLATFORM"))
    kwargs.set_if_none("sauce_build_number",
                        os.environ.get("TRAVIS_BUILD_NUMBER"))
    python_version = os.environ.get("TRAVIS_PYTHON_VERSION")
    kwargs.set_if_none("sauce_build_tags",
                        [python_version] if python_version else [])
    kwargs.set_if_none("sauce_tunnel_identifier",
                       os.environ.get("TRAVIS_JOB_NUMBER"))
    kwargs.set_if_none("sauce-user",
                       os.environ.get("SAUCE_USERNAME"))
    kwargs.set_if_none("sauce_key",
                        os.environ.get("SAUCE_ACCESS_KEY"))


def pr():
    pr = os.environ.get("TRAVIS_PULL_REQUEST", "false")
    return pr if pr != "false" else None


def main():
    """Perform check_stability functionality and return exit code."""
    global logger

    retcode = 0
    parser = get_parser()
    args, wpt_args = parser.parse_known_args()

    with open(args.config_file, 'r') as config_fp:
        config = SafeConfigParser()
        config.readfp(config_fp)
        skip_tests = config.get("file detection", "skip_tests").split()
        ignore_changes = set(config.get("file detection", "ignore_changes").split())

    if args.output_bytes is not None:
        replace_streams(args.output_bytes,
                        "Log reached capacity (%s bytes); output disabled." % args.output_bytes)

    logger = logging.getLogger(os.path.splitext(__file__)[0])

    setup_logging()

    venv = Virtualenv(os.environ.get("VIRTUAL_ENV"))

    browser_name = args.product.split(":")[0]

    if browser_name == "sauce" and not wpt_args.sauce_key:
        logger.warning("Cannot run tests on Sauce Labs. No access key.")
        return retcode

    pr_number = pr()

    with TravisFold("browser_setup"):
        logger.info(format_comment_title(wpt_args.product))

        if pr is not None:
            deepen_checkout(args.user)

        # Ensure we have a branch called "master"
        fetch_wpt(args.user, "master:master")

        head_sha1 = get_sha1()
        logger.info("Testing web-platform-tests at revision %s" % head_sha1)

        branch_point = testfiles.branch_point(args.user)

        files_changed, files_ignored = testfiles.files_changed("%s..HEAD" % branch_point, ignore_changes)

        if files_ignored:
            logger.info("Ignoring %s changed files:\n%s" % (len(files_ignored),
                                                            "".join(" * %s\n" % item for item in files_ignored)))

        tests_changed, files_affected = testfiles.affected_testfiles(files_changed, skip_tests)

        if not (tests_changed or files_affected):
            logger.info("No tests changed")
            return 0

        wpt_kwargs =  set_default_args(vars(wpt_kwargs))

        venv.install_requirements(os.path.join(wpt_root, "tools", "wptrunner", "requirements.txt"))
        venv.install("requests")

        run(venv, install=True, wpt_kwargs)

        try:
            version = browser.version(args.root)
        except Exception, e:
            version = "unknown (error: %s)" % e
        logger.info("Using browser at version %s", version)

        logger.debug("Files changed:\n%s" % "".join(" * %s\n" % item for item in files_changed))

        tests_changed, affected_testfiles = get_affected_testfiles(files_changed, skip_tests)

        logger.debug("Affected tests:\n%s" % "".join(" * %s\n" % item for item in affected_testfiles))

        wptrunner_files = list(itertools.chain(tests_changed, affected_testfiles))

        wptrunner_kwargs = Kwargs(wptrunner_kwargs)

        kwargs = wptrunner_args(args.root,
                                wptrunner_files,
                                args.iterations,
                                browser)

    with TravisFold("running_tests"):
        logger.info("Starting %i test iterations" % args.iterations)

        wptrunner.run_tests(**kwargs)

        with open("raw.log", "rb") as log:
            results, inconsistent = process_results(log, args.iterations)

    if results:
        if inconsistent:
            write_inconsistent(inconsistent, args.iterations)
            retcode = 2
        else:
            logger.info("All results were stable\n")
        with TravisFold("full_results"):
            write_results(results, args.iterations, args.comment_pr)
    else:
        logger.info("No tests run.")

    return retcode


if __name__ == "__main__":
    try:
        retcode = main()
    except:
        import traceback
        traceback.print_exc()
        sys.exit(1)
    else:
        sys.exit(retcode)
