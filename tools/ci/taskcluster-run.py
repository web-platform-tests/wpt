#!/usr/bin/env python

import argparse
import logging
import os
import subprocess

browser_specific_args = {
    "firefox": ["--install-browser", "--reftest-internal"]
}

def tests_affected(commit_range):
    output = subprocess.check_output([
        "python", "./wpt", "tests-affected", "--null", commit_range
    ], stderr=open(os.devnull, "w"))

    tests = output.split("\0")

    # Account for trailing null byte
    if not tests[-1]:
        tests.pop()

    return tests


def main(browser, commit_range, wpt_args):
    """Invoke the `wpt run` command according to the needs of the TaskCluster
    continuous integration service."""

    logger = logging.getLogger("tc-run")
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(handler)

    if commit_range:
        logger.info(
            "Identifying tests affected in range '%s'..." % commit_range
        )
        tests = tests_affected(commit_range)
        logger.info("Identified %s affected tests" % len(tests))

        if not tests:
            logger.info("Quitting because no tests were affected.")
            return
    else:
        tests = []
        logger.info("Running all tests")

    wpt_args += browser_specific_args.get(browser, [])

    command = ["python", "./wpt", "run"] + wpt_args + [browser] + tests

    logger.info("Executing command: %s" % " ".join(command))

    subprocess.check_call(command)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=main.__doc__)
    parser.add_argument("--browser", action="store", required=True)
    parser.add_argument("--commit-range", action="store",
                        help="""Git commit range. If specified, this will be
                             supplied to the `wpt tests-affected` command to
                             determine the list of tests executed""")
    parser.add_argument("wpt_args", nargs="*")
    main(**vars(parser.parse_args()))
