import argparse
import logging
import os
import subprocess
import sys
from collections import defaultdict

from wptrunner import wptrunner
from wptrunner import wptcommandline
from mozlog import reader

logger = logging.getLogger(os.path.splitext(__file__)[0])


def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(logging.BASIC_FORMAT, None)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


setup_logging()


class Firefox(object):
    product = "firefox"

    def wptrunner_args(self, root):
        return {
            "product": "firefox",
            "binary": "%s/firefox/firefox" % root,
            "certutil_binary": "certutil",
            "webdriver_binary": "%s/geckodriver" % root,
            "prefs_root": "%s/profiles" % root,
        }


class Chrome(object):
    product = "chrome"

    def wptrunner_args(self, root):
        return {
            "product": "chrome",
            "binary": "%s/chrome-linux/chrome" % root,
            "webdriver_binary": "%s/chromedriver" % root,
            "test_types": ["testharness", "reftest"]
        }


def get_git_cmd(repo_path):
    def git(cmd, *args):
        full_cmd = ["git", cmd] + list(args)
        try:
            return subprocess.check_output(full_cmd, cwd=repo_path, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            logger.error("Git command exited with status %i" % e.returncode)
            logger.error(e.output)
            sys.exit(1)
    return git


def get_files_changed(root):
    git = get_git_cmd("%s/w3c/web-platform-tests" % root)
    branch_point = git("merge-base", "HEAD", "master").strip()
    files = git("diff", "--name-only", "-z", "%s.." % branch_point)
    assert files[-1] == "\0"
    return ["%s/w3c/web-platform-tests/%s" % (root, item)
            for item in files[:-1].split("\0")]


def wptrunner_args(root, files_changed, iterations, browser):
    parser = wptcommandline.create_parser([browser.product])
    args = vars(parser.parse_args([]))
    wpt_root = os.path.join(root, "w3c", "web-platform-tests")
    args.update(browser.wptrunner_args(root))
    args.update({
        "tests_root": wpt_root,
        "metadata_root": wpt_root,
        "repeat": iterations,
        "config": "%s/w3c/wptrunner/wptrunner.default.ini" % root,
        "test_list": files_changed,
        "restart_on_unexpected": False,
        "pause_after_test": False
    })
    wptcommandline.check_args(args)
    return args


class LogHandler(reader.LogHandler):
    def __init__(self):
        self.results = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

    def test_status(self, data):
        self.results[data["test"]][data.get("subtest")][data["status"]] += 1

    def test_end(self, data):
        self.results[data["test"]][None][data["status"]] += 1


def is_inconsistent(results_dict, iterations):
    return len(results_dict) > 1 or sum(results_dict.values()) != iterations


def err_string(results_dict):
    rv = []
    for key, value in sorted(results_dict.items()):
        rv.append("%s: %i" % (key, value))
    return " ".join(rv)


def check_consistent(log, iterations):
    inconsistent = []
    handler = LogHandler()
    reader.handle_log(reader.read(log), handler)
    results = handler.results
    for test, test_results in results.iteritems():
        parent = test_results.pop(None)
        if is_inconsistent(parent, iterations):
            inconsistent.append((test, None, parent))
            write = logger.error
        else:
            write = logger.info
        write("| %s => %s" % (test, err_string(parent)))
        for subtest, result in test_results.iteritems():
            if is_inconsistent(result, iterations):
                inconsistent.append((test, subtest, result))
                write = logger.error
            else:
                write = logger.info
            write("| - %s => %s" % (test, err_string(result)))
    return inconsistent


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root",
                        action="store",
                        default=os.path.join(os.path.expanduser("~"), "build"),
                        help="Root path")
    parser.add_argument("--iterations",
                        action="store",
                        default=10,
                        type=int,
                        help="Number of times to run tests")
    parser.add_argument("browser",
                        action="store",
                        help="Browser to run against")
    return parser


def main():
    parser = get_parser()
    args = parser.parse_args()

    browser_cls = {"firefox": Firefox,
                   "chrome": Chrome}.get(args.browser)
    if browser_cls is None:
        logger.critical("Unrecognised browser %s" % args.browser)
        sys.exit(2)

    # For now just pass the whole list of changed files to wptrunner and
    # assume that it will run everything that's actually a test
    files_changed = get_files_changed(args.root)

    logger.info("Files changed:\n  %s" % "\n  ".join(files_changed))

    browser = browser_cls()
    kwargs = wptrunner_args(args.root,
                            files_changed,
                            args.iterations,
                            browser)
    with open("raw.log", "wb") as log:
        wptrunner.setup_logging(kwargs,
                                {"mach": sys.stdout,
                                 "raw": log})
        wptrunner.run_tests(**kwargs)

    logger.info("Test runs done")

    with open("raw.log", "rb") as log:
        inconsistent = check_consistent(log, args.iterations)

    if inconsistent:
        logger.error("Got unstable results:")
        for test, subtest, results in inconsistent:
            logger.error("%s | %s | %s" % (test,
                                           subtest if subtest else "(parent)",
                                           err_string(results)))
        sys.exit(1)
    logger.info("All results were stable")


if __name__ == "__main__":
    main()
