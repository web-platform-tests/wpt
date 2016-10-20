import argparse
import json
import logging
import os
import subprocess
import sys
import traceback
from collections import defaultdict

import requests

from wptrunner import wptrunner
from wptrunner import wptcommandline
from mozlog import reader

logger = logging.getLogger(os.path.splitext(__file__)[0])


def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(logging.BASIC_FORMAT, None)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)

setup_logging()


def setup_github_logging(args):
    gh_handler = None
    if args.comment_pr:
        if args.gh_token:
            try:
                pr_number = int(args.comment_pr)
            except ValueError:
                pass
            else:
                gh_handler = GitHubCommentHandler(args.gh_token, pr_number)
                logger.debug("Setting up GitHub logging")
                logger.addHandler(gh_handler)
        else:
            logger.error("Must provide --comment-pr and --github-token together")
    return gh_handler


class GitHubCommentHandler(logging.Handler):
    def __init__(self, token, pull_number):
        logging.Handler.__init__(self)
        self.token = token
        self.pull_number = pull_number
        self.log_data = []

    def emit(self, record):
        try:
            msg = self.format(record)
            self.log_data.append(msg)
        except Exception:
            self.handleError(record)

    def send(self):
        headers = {"Accept": "application/vnd.github.v3+json"}
        auth = (self.token, "x-oauth-basic")
        url = "https://api.github.com/repos/w3c/web-platform-tests/issues/%s/comments" %(
            self.pull_number,)
        resp = requests.post(
            url,
            data=json.dumps({"body": "\n".join(self.log_data)}),
            headers=headers,
            auth=auth
        )
        resp.raise_for_status()
        self.log_data = []


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
    if not files:
        return []
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
    rv = " ".join(rv)
    if len(results_dict) > 1:
        rv = "**%s**" % rv
    return rv


def process_results(log, iterations):
    inconsistent = []
    handler = LogHandler()
    reader.handle_log(reader.read(log), handler)
    results = handler.results
    for test, test_results in results.iteritems():
        for subtest, result in test_results.iteritems():
            if is_inconsistent(result, iterations):
                inconsistent.append((test, subtest, result))
    return results, inconsistent


def write_inconsistent(inconsistent):
    logger.error("## Unstable results ##\n")
    logger.error("| Test | Subtest | Results |")
    logger.error("|------|---------|---------|")
    for test, subtest, results in inconsistent:
        logger.error("%s | %s | %s" % (test,
                                       subtest if subtest else "(parent)",
                                       err_string(results)))


def write_results(results, iterations):
    logger.info("## All results ##\n")
    logger.info("| Test | Subtest | Results |")
    logger.info("|------|---------|---------|")
    for test, test_results in results.iteritems():
        parent = test_results.pop(None)
        logger.info("| %s |  | %s |" % (test, err_string(parent)))
        for subtest, result in test_results.iteritems():
            logger.info("|  | %s | %s |" % (subtest, err_string(result)))


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
    parser.add_argument("--gh-token",
                        action="store",
                        help="OAuth token to use for accessing GitHub api")
    parser.add_argument("--comment-pr",
                        action="store",
                        help="PR to comment on with stability results")
    parser.add_argument("browser",
                        action="store",
                        help="Browser to run against")
    return parser


def main():
    retcode = 0
    parser = get_parser()
    args = parser.parse_args()

    gh_handler = setup_github_logging(args)

    logger.info("Testing in **%s**" % args.browser.title())

    browser_cls = {"firefox": Firefox,
                   "chrome": Chrome}.get(args.browser)
    if browser_cls is None:
        logger.critical("Unrecognised browser %s" % args.browser)
        return 2

    # For now just pass the whole list of changed files to wptrunner and
    # assume that it will run everything that's actually a test
    files_changed = get_files_changed(args.root)

    if not files_changed:
        return 0

    logger.info("Files changed:\n%s" % "".join(" * %s\n" % item for item in files_changed))

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

    with open("raw.log", "rb") as log:
        results, inconsistent = process_results(log, args.iterations)

    if results:
        if inconsistent:
            write_inconsistent(inconsistent)
            retcode = 1
        else:
            logger.info("All results were stable\n")
        write_results(results, args.iterations)
    else:
        logger.info("No tests run.")

    try:
        if gh_handler:
            gh_handler.send()
    except Exception:
        logger.error(traceback.format_exc())
    return retcode


if __name__ == "__main__":
    try:
        retcode = main()
    except:
        raise
    else:
        sys.exit(retcode)
