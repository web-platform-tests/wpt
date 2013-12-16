import json
import argparse
import sys
from cgi import escape
from collections import defaultdict

import types

def html_escape(item, escape_quote=False):
    if isinstance(item, types.StringTypes):
        rv = escape(item)
        if escape_quote:
            rv = rv.replace('"', "&quot;")
        return rv
    else:
        return item

class Raw(object):
    def __init__(self, value):
        self.value = value

    def __unicode__(self):
        return unicode(self.value)

class Node(object):
    def __init__(self, name, attrs, children):
        #Need list of void elements
        self.name = name
        self.attrs = attrs
        self.children = children

    def __unicode__(self):
        if self.attrs:
            #Need to escape
            attrs_unicode = " " + " ".join("%s=\"%s\"" % (html_escape(key),
                                                          html_escape(value,
                                                                      escape_quote=True))
                                          for key,value in self.attrs.iteritems())
        else:
            attrs_unicode = ""
        return "<%s%s>%s</%s>\n" % (self.name,
                                  attrs_unicode,
                                  "".join(unicode(html_escape(item)) for item in self.children),
                                  self.name)

    def __str__(self):
        return unicode(self).encode("utf8")

class RootNode(object):
    def __init__(self, *children):
        self.children = ["<!DOCTYPE html>"] + list(children)

    def __unicode__(self):
        return "".join(unicode(item) for item in self.children)

    def __str__(self):
        return unicode(self).encode("utf8")

def flatten(iterable):
    rv = []
    for item in iterable:
        if hasattr(item, "__iter__") and not isinstance(item, types.StringTypes):
            rv.extend(item)
        else:
            rv.append(item)
    return rv

class HTML(object):
    def __getattr__(self, name):
        def make_html(self, *content, **attrs):
            for attr_name in attrs.keys():
                if "_" in attr_name:
                    new_name = attr_name.replace("_", "-")
                    if new_name.endswith("-"):
                        new_name = new_name[:-1]
                    attrs[new_name] = attrs.pop(attr_name)
            return Node(name, attrs, flatten(content))

        method = types.MethodType(make_html, self, HTML)
        setattr(self, name, method)
        return method

    def __call__(self, *children):
        return RootNode(*flatten(children))

h = HTML();

class TestResult(object):
    def __init__(self, test):
        self.test = test
        self.results = {}

    def __cmp__(self, other):
        return self.test == other.test

    def __hash__(self):
        return hash(self)

def load_data(args):
    pairs = []
    for i in xrange(0, len(args), 2):
        pairs.append(args[i:i+2])

    rv = {}
    for UA, filename in pairs:
        with open(filename) as f:
            rv[UA] = json.load(f)

    return rv

def test_id(id):
    if isinstance(id, list):
        return tuple(id)
    else:
        return id

def all_tests(data):
    tests = defaultdict(set)
    for UA, results in data.iteritems():
        for result in results["results"]:
            id = test_id(result["test"])
            tests[id] |= set(subtest["name"] for subtest in result["subtests"])
    return tests

def group_results(data):
    tests = all_tests(data)

    UAs = data.keys()
    def result():
        return {
            "harness":dict((UA, (None, None)) for UA in UAs),
            "subtests":None #init this later
        }

    results_by_test = defaultdict(result)

    for UA, results in data.iteritems():
        for test_data in results["results"]:
            id = test_id(test_data["test"])
            result = results_by_test[id]

            if result["subtests"] is None:
                result["subtests"]= dict(
                    (name, dict((UA, (None, None)) for UA in UAs)) for name in tests[id]
                )

            result["harness"][UA] = (test_data["status"], test_data["message"])
            for subtest in test_data["subtests"]:
                result["subtests"][subtest["name"]][UA] = (subtest["status"],
                                                           subtest["message"])

    return UAs, results_by_test

def status_cell(status, message=None):
    status = status if status is not None else "NONE"
    kwargs = {}
    if message:
        kwargs["title"] = message
    status_text = status.title()
    return h.td(status_text, class_="status " + status,
                **kwargs)

def test_link(test_id, subtest=None):
    if isinstance(test_id, types.StringTypes):
        rv = [h.a(test_id, href=test_id)]
    else:
        rv = [h.a(test_id[0], href=test_id[0]),
              " %s " % test_id[1],
              h.a(test_id[2], href=test_id[2])]
    if subtest is not None:
        rv.append(" [%s]" % subtest)
    return rv

def summary(UAs, results_by_test):
    not_passing = []
    for test, results in results_by_test.iteritems():
        if not any(item[0] in ("PASS", "OK") for item in results["harness"].values()):
            not_passing.append((test, None))
        for subtest_name, subtest_results in results["subtests"].iteritems():
            if not any(item[0] == "PASS" for item in subtest_results.values()):
                not_passing.append((test, subtest_name))
    if not_passing:
        rv = [
            h.p("The following tests failed to pass in all UAs:"),
            h.ul([h.li(test_link(test, subtest))
                  for test, subtest in not_passing
              ])
        ]
    else:
        rv = "All tests passed in at least one UA"
    return rv

def result_rows(UAs, test, result):
    yield h.tr(
        h.td(
            test_link(test),
            rowspan=(1 + len(result["subtests"]))
        ),
        h.td(),
        [status_cell(status, message)
         for UA, (status, message) in sorted(result["harness"].items())],
        class_="test"
    )

    for name, subtest_result in sorted(result["subtests"].iteritems()):
        yield h.tr(
            h.td(name),
            [status_cell(status, message)
             for UA, (status, message) in sorted(subtest_result.items())],
            class_="subtest"
        )

def result_bodies(UAs, results_by_test):
    return [h.tbody(result_rows(UAs, test, result))
            for test, result in sorted(results_by_test.iteritems())]

def generate_html(UAs, results_by_test):
    doc = h(h.html([
        h.head(
            h.meta(charset="utf8"),
            h.title("Implementation Report"),
            h.link(href="report.css", rel="stylesheet")
        ),
        h.body(
            h.h1("Implementation Report"),
            h.h2("Summary"),
            summary(UAs, results_by_test),
            h.h2("Full Results"),
            h.table(
                h.thead(
                    h.tr(
                        h.th("Test"),
                        h.th("Subtest"),
                        [h.th(UA) for UA in sorted(UAs)]
                    )
                ),
                result_bodies(UAs, results_by_test)
            )
        )
    ]
    ))

    return doc

def main():
    data = load_data(sys.argv[1:])
    UAs, results_by_test = group_results(data)
    print generate_html(UAs, results_by_test)


if __name__ == "__main__":
    main()
