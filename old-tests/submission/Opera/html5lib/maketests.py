import sys
import os
import hashlib
import urllib
import itertools
import re
import json
import glob
import shutil

import genshi
from genshi.template import MarkupTemplate

from html5lib.tests import support

file_base = os.path.abspath(os.path.split(__file__)[0])
print file_base

def get_expected(data):
    data = "#document\n" + data
    return data

def get_hash(data, container=None):
    if container == None:
        container = ""
    return hashlib.sha1("#container%s#data%s"%(container.encode("utf8"),
                                               data.encode("utf8"))).hexdigest()

def make_tests(input_file_name, test_data, harness_prefix):
    tests = []
    innerHTML_tests = []
    ids_seen = {}
    print input_file_name
    for test in test_data:
        is_innerHTML = "document-fragment" in test
        data = test["data"]
        container = test["document-fragment"] if is_innerHTML else None
        assert test["document"], test
        expected = get_expected(test["document"])
        test_list = innerHTML_tests if is_innerHTML else tests
        test_id = get_hash(data, container);
        if test_id in ids_seen:
            print "WARNING: id %s seen multiple times in file %s this time for test (%s, %s) before for test %s, skipping"%(test_id, input_file_name, container, data, ids_seen[test_id])
            continue
        ids_seen[test_id] = (container, data)
        test_list.append({'string_uri_encoded_input':"\"%s\""%urllib.quote(data.encode("utf8")),
                          'input':data,
                          'expected':expected,
                          'string_escaped_expected':json.dumps(urllib.quote(expected.encode("utf8"))),
                          'id':test_id,
                          'container':container
                          })
    path_normal = None
    if tests:
        path_normal = write_test_file(tests, "test_%s"%input_file_name, 
                                      harness_prefix, "test.xml")
    path_innerHTML = None
    if innerHTML_tests:
        path_innerHTML = write_test_file(innerHTML_tests, "testInnerHTML_%s"%input_file_name,
                                         harness_prefix, "test_fragment.xml")

    return path_normal, path_innerHTML

def write_test_file(tests, file_name, harness_prefix, template_file_name):
    file_name = os.path.join("tests", file_name + ".html")
    template = MarkupTemplate(open(os.path.join(file_base, template_file_name)))
    
    out_f = open(file_name, "w")
    stream = template.generate(file_name=file_name, tests=tests,
                               file_timeout=1000*len(tests), test_timeout=1000,
                               harness_prefix=harness_prefix)

    out_f.write(stream.render('html', doctype='html5', 
                              encoding="utf8"))
    return file_name

def escape_js_string(in_data):
    return in_data.encode("utf8").encode("string-escape")

def serialize_filenames(test_filenames):
    return "[" + ",\n".join("\"%s\""%item for item in test_filenames) + "]"

def make_index(test_filenames, inner_html_files):
    template = MarkupTemplate(open(os.path.join(file_base, 'index.xml')))
    stream = template.generate(file_names=serialize_filenames(test_filenames),
                               inner_html_file_names=serialize_filenames(inner_html_files));

    out_f = open("index.html", "w")
    out_f.write(stream.render('html', doctype='html5', 
                              encoding="utf-8"))

def make_manifest(test_filenames, inner_html_file_names):
    manifest_items =  [{"type":"post", "url":"%s"%item} for
                        item in test_filenames + inner_html_file_names]
    
    manifest_items.extend({"type":"post", "url":"%s?run_type=write"%item} for
                          item in test_filenames)
    manifest_items.extend({"type":"post", "url":"%s?run_type=write_single"%item} for
                          item in test_filenames)
    out_f = open("parser.manifest", "w")
    json.dump(manifest_items, out_f, indent=0)

def main(harness_prefix):
    test_files = []
    inner_html_files = []

    if not os.path.exists("tests"):
        os.mkdir("tests")
    if not file_base == os.path.abspath(os.curdir):
        cur_dir = os.path.abspath(os.curdir)
        for fn in ["testharness.js", "harness.js", "testharnessreport.js", 
                   "common.js", "test.js", "testharness.css"]:
            shutil.copy(os.path.join(file_base, fn) , cur_dir)

    if len(sys.argv) > 2:
        test_iterator = itertools.izip(
            itertools.repeat(False), 
            sorted(os.path.abspath(item) for item in 
                   glob.glob(os.path.join(sys.argv[2], "*.dat"))))
    else:
        test_iterator = itertools.chain(
            itertools.izip(itertools.repeat(False), 
                           sorted(support.html5lib_test_files("tree-construction"))),
            itertools.izip(itertools.repeat(True), 
                           sorted(support.html5lib_test_files(
                        os.path.join("tree-construction", "scripted")))))

    for (scripted, test_file) in test_iterator:
        input_file_name = os.path.splitext(os.path.split(test_file)[1])[0]
        if scripted:
            input_file_name = "scripted_" + input_file_name
        test_data = support.TestData(test_file)
        test_filename, inner_html_file_name = make_tests(input_file_name, test_data, harness_prefix)
        if test_filename is not None:
            test_files.append(test_filename)
        if inner_html_file_name is not None:
            inner_html_files.append(inner_html_file_name)

    make_index(test_files, inner_html_files)
    make_manifest(test_files, inner_html_files)

if __name__ == "__main__":
    if len(sys.argv) == 1:
        harness_prefix = "../"
    else:
        harness_prefix = sys.argv[1]
    if harness_prefix[-1] != "/":
        harness_prefix += "/"
    main(harness_prefix)
