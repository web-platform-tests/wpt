import argparse
import os
import re
from fnmatch import translate
from ..wpt.testfiles import branch_point, files_changed, affected_testfiles

wpt_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))

job_path_map = {
    "testharness_unittest": ["resources/*"],
    "stability": ["*", "^tools/", "^docs/", "^resources/", "^conformance_checkers/"],
    "lint": ["*"],
    "lint_unittest": ["tools/lint/*"],
    "manifest_unittest": ["tools/manifest/*"],
    "build_css": ["css/*"],
    "update_built": ["2dcontext/*", "assumptions/*", "html/*", "offscreen-canvas/*"],
    "flake8": ["tools/*"],
    "coverage": ["tools/*"],
}


class Ruleset(object):
    def __init__(self, rules):
        self.include = []
        self.exclude = []
        for rule in rules:
            self.add_rule(rule)

    def add_rule(self, rule):
        if rule.startswith("^"):
            target = self.exclude
            rule = rule[1:]
        else:
            target = self.include

        target.append(re.compile(translate(rule)))

    def __call__(self, path):
        path = os.path.normcase(path)
        for item in self.exclude:
            if item.match(path):
                return False
        for item in self.include:
            if item.match(path):
                return True
        return False

    def __repr__(self):
        subs = tuple(",".join(item.pattern for item in target)
                     for target in (self.include, self.exclude))
        return "Rules<include:[%s] exclude:[%s]>" % subs


def get_test_jobs(**kwargs):
    if kwargs["revish"] is None:
        revish = "%s..HEAD" % branch_point()
    else:
        revish = kwargs["revish"]

    rules = {}
    for key, value in job_path_map.iteritems():
        rules[key] = Ruleset(value)

    changed, _ = files_changed(revish)
    tests_changed, dependents = affected_testfiles(changed, set())
    all_changed = set(os.path.relpath(item, wpt_root)
                      for item in set(changed) | set(tests_changed) | set(dependents))

    jobs = set()

    for path in all_changed:
        for job in rules.keys():
            ruleset = rules[job]
            if ruleset(path):
                rules.pop(job)
                jobs.add(job)

    return jobs


def create_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("revish", default=None, help="Commits to consider. Defaults to the commits on the current branch", nargs="?")
    return parser


def run(**kwargs):
    jobs = get_test_jobs(**kwargs)
    for item in sorted(jobs):
        print item
                

    
