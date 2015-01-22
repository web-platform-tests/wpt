import os
import urlparse
from fnmatch import fnmatch
try:
    from xml.etree import cElementTree as ElementTree
except ImportError:
    from xml.etree import ElementTree

import html5lib

import vcs
from item import Stub, ManualTest, WebdriverSpecTest, RefTest, TestharnessTest
from utils import rel_path_to_url, is_blacklisted, ContextManagerStringIO, cached_property

wd_pattern = "*.py"

class SourceFile(object):
    parsers = {"html":lambda x:html5lib.parse(x, treebuilder="etree"),
               "xhtml":ElementTree.parse,
               "svg":ElementTree.parse}

    def __init__(self, tests_root, rel_path, url_base, use_committed=False):
        self.tests_root = tests_root
        self.rel_path = rel_path
        self.url_base = url_base
        self.use_committed = use_committed

        self.url = rel_path_to_url(rel_path, url_base)
        self.path = os.path.join(tests_root, rel_path)

        self.dir_path, self.filename = os.path.split(self.path)
        self.name, self.ext = os.path.splitext(self.filename)

    def name_prefix(self, prefix):
        return self.name.startswith(prefix)

    def name_suffix(self, suffix):
        return self.name.endswith(suffix)

    def open(self):
        if self.use_committed:
            git = vcs.get_git_func(os.path.dirname(__file__))
            blob = git("show", "HEAD:%s" % self.rel_path)
            file_obj = ContextManagerStringIO(blob)
        else:
            file_obj = open(self.path)
        return file_obj

    @property
    def name_is_non_test(self):
        return (os.path.isdir(self.rel_path) or
                self.name_prefix("MANIFEST") or
                self.filename.startswith(".") or
                is_blacklisted(self.url))

    @property
    def name_is_stub(self):
        return self.name_prefix("stub-")

    @property
    def name_is_manual(self):
        return self.name_suffix("-manual")

    @property
    def name_is_worker(self):
        return self.filename.endswith(".worker.js")

    @property
    def name_is_webdriver(self):
        # wdspec tests are in subdirectories of /webdriver excluding __init__.py
        # files.
        rel_dir_tree = self.rel_path.split(os.path.sep)
        return (rel_dir_tree[0] == "webdriver" and
                len(rel_dir_tree) > 2 and
                self.filename != "__init__.py" and
                fnmatch(self.filename, wd_pattern))

    @property
    def name_is_reference(self):
        return self.name_suffix("-ref") or self.name_suffix("-notref")

    @property
    def markup_type(self):
        ext = self.ext

        if not ext:
            return None
        if ext[0] == ".":
            ext = ext[1:]
        if ext in ["html", "htm"]:
            return "html"
        elif ext in ["xhtml", "xht"]:
            return "xhtml"
        elif ext == "svg":
            return "svg"
        return None

    @cached_property
    def root(self):
        if self.markup_type:
            parser = self.parsers[self.markup_type]

            with self.open() as f:
                try:
                    tree = parser(f)
                except Exception:
                    return None

            if hasattr(tree, "getroot"):
                root = tree.getroot()
            else:
                root = tree

            return root

    @cached_property
    def timeout_nodes(self):
        return self.root.findall(".//{http://www.w3.org/1999/xhtml}meta[@name='timeout']")

    @cached_property
    def timeout(self):
        if not self.root:
            return

        if self.timeout_nodes:
            timeout_str = self.timeout_nodes[0].attrib.get("content", None)
            if timeout_str and timeout_str.lower() == "long":
                return timeout_str

    @cached_property
    def testharness_nodes(self):
        return self.root.findall(".//{http://www.w3.org/1999/xhtml}script[@src='/resources/testharness.js']")

    @cached_property
    def content_is_testharness(self):
        if not self.root:
            return None
        return bool(self.testharness_nodes)

    @cached_property
    def reftest_nodes(self):
        match_links = self.root.findall(".//{http://www.w3.org/1999/xhtml}link[@rel='match']")
        mismatch_links = self.root.findall(".//{http://www.w3.org/1999/xhtml}link[@rel='mismatch']")
        return match_links + mismatch_links

    @cached_property
    def references(self):
        if not self.root:
            return []

        rv = []
        rel_map = {"match": "==", "mismatch": "!="}
        for item in self.reftest_nodes:
            if "href" in item.attrib:
                ref_url = urlparse.urljoin(self.url, item.attrib["href"])
                ref_type = rel_map[item.attrib["rel"]]
                rv.append((ref_url, ref_type))
        return rv

    @cached_property
    def content_is_ref_node(self):
        if not self.root:
            return False

        return bool(self.references)

    def manifest_items(self):
        if self.name_is_non_test:
            rv = []

        elif self.name_is_stub:
            rv = [Stub(self.url)]

        elif self.name_is_manual:
            rv = [ManualTest(self.url)]

        elif self.name_is_worker:
            rv = [TestharnessTest(self.url[:-3])]

        elif self.name_is_webdriver:
            rv = [WebdriverSpecTest(self.rel_path)]

        elif self.content_is_testharness:
            rv = [TestharnessTest(self.url, timeout=self.timeout)]

        elif self.content_is_ref_node:
            rv = [RefTest(self.url, self.references,
                          timeout=self.timeout, is_reference=self.name_is_reference)]

        else:
            # If nothing else it's a helper file, which we don't have a specific type for
            rv = []

        return rv
