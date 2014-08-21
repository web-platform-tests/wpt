#!/usr/bin/env python

import argparse
import json
import logging
import os
import re
import subprocess
import sys
import urlparse

from StringIO import StringIO
from collections import defaultdict
from fnmatch import fnmatch


def get_git_func(repo_path):
    def git(cmd, *args):
        full_cmd = ["git", cmd] + list(args)
        print full_cmd
        return subprocess.check_output(full_cmd, cwd=repo_path, stderr=subprocess.STDOUT)
    print git
    return git


def setup_git(repo_path):
    assert os.path.exists(os.path.join(repo_path, ".git"))
    global git
    git = get_git_func(repo_path)


_repo_root = None
def get_repo_root():
    global _repo_root
    if _repo_root is None:
        git = get_git_func(os.path.dirname(__file__))
        _repo_root = git("rev-parse", "--show-toplevel").rstrip()
    return _repo_root


manifest_name = "MANIFEST.json"
ref_suffixes = ["_ref", "-ref"]
wd_pattern = "*.py"
blacklist = ["/", "/tools/", "/resources/", "/common/", "/conformance-checkers/"]

logging.basicConfig()
logger = logging.getLogger("manifest")
logger.setLevel(logging.DEBUG)


class ManifestItem(object):
    item_type = None

    def __init__(self, path):
        self.path = path

    def _key(self):
        return self.item_type, self.path

    def __eq__(self, other):
        if not hasattr(other, "_key"):
            return False
        return self._key() == other._key()

    def __hash__(self):
        return hash(self._key())

    def to_json(self):
        return {"path": self.path}

    @classmethod
    def from_json(self, obj):
        raise NotImplementedError

    @property
    def id(self):
        raise NotImplementedError

class TestharnessTest(ManifestItem):
    item_type = "testharness"

    def __init__(self, path, url, timeout=None):
        ManifestItem.__init__(self, path)
        self.url = url
        self.timeout = timeout

    @property
    def id(self):
        return self.url

    def to_json(self):
        rv = ManifestItem.to_json(self)
        rv.update({"url": self.url})
        if self.timeout:
            rv["timeout"] = self.timeout
        return rv

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"],
                   obj["url"],
                   timeout=obj.get("timeout"))


class RefTest(ManifestItem):
    item_type = "reftest"

    def __init__(self, path, url, ref_url, ref_type,
                 timeout=None):
        if ref_type not in ["==", "!="]:
            raise ValueError, "Unrecognised ref_type %s" % ref_type
        ManifestItem.__init__(self, path)
        self.url = url
        self.ref_url = ref_url
        self.ref_type = ref_type
        self.timeout = timeout

    @property
    def id(self):
        return (self.url, self.ref_type, self.ref_url)

    def _key(self):
        return self.item_type, self.url, self.ref_type, self.ref_url

    def to_json(self):
        rv = ManifestItem.to_json(self)
        rv.update({"url": self.url,
                   "ref_type": self.ref_type,
                   "ref_url": self.ref_url})
        if self.timeout:
            rv["timeout"] = self.timeout
        return rv

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"], obj["url"], obj["ref_url"], obj["ref_type"],
                   timeout=obj.get("timeout"))


class ManualTest(ManifestItem):
    item_type = "manual"

    def __init__(self, path, url):
        ManifestItem.__init__(self, path)
        self.url = url

    @property
    def id(self):
        return self.url

    def to_json(self):
        rv = ManifestItem.to_json(self)
        rv.update({"url": self.url})
        return rv

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"], obj["url"])


class Stub(ManifestItem):
    item_type = "stub"

    def __init__(self, path, url):
        ManifestItem.__init__(self, path)
        self.url = url

    @property
    def id(self):
        return self.url

    def to_json(self):
        rv = ManifestItem.to_json(self)
        rv.update({"url": self.url})
        return rv

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"], obj["url"])


class Helper(ManifestItem):
    item_type = "helper"

    def __init__(self, path, url):
        ManifestItem.__init__(self, path)
        self.url = url

    @property
    def id(self):
        return self.url

    def to_json(self):
        rv = ManifestItem.to_json(self)
        rv.update({"url": self.url})
        return rv

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"], obj["url"])


class WebdriverSpecTest(ManifestItem):
    item_type = "wdspec"

    @property
    def id(self):
        return self.path

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"])


class ManifestError(Exception):
    pass

item_types = ["testharness", "reftest", "manual", "helper", "stub", "wdspec"]

class Manifest(object):
    def __init__(self, git_rev):
        # Dict of item_type: {path: set(manifest_items)}
        self._data = dict((item_type, defaultdict(set))
                          for item_type in item_types)
        self.rev = git_rev
        self.local_changes = LocalChanges()

    def _included_items(self, item_types=None):
        if item_types is None:
            item_types = item_types

        for item_type in item_types:
            paths = self._data[item_type].copy()
            for item_types, local_paths in self.local_changes.itertypes(item_type):
                for path, items in local_paths.iteritems():
                    paths[path] = items
                for path in self.local_changes.iterdeleted():
                    del paths[path]

            yield item_type, paths

    def contains_path(self, path):
        return any(path in item for item in self._included_items().itervalues())

    def add(self, item):
        self._data[item.item_type][item.path].add(item)

    def extend(self, items):
        for item in items:
            self.add(item)

    def remove_path(self, path):
        for item_type in item_types:
            if path in self._data[item_type]:
                del self._data[item_type][path]

    def itertypes(self, *types):
        for item_type, items in self._included_items(types):
            for item in sorted(items.items()):
                yield item

    def __iter__(self):
        for item_type, items in self._included_items(types):
            for item in sorted(items.items()):
                yield item

    def __getitem__(self, path):
        for items in self._data._included_items():
            if path in items:
                return items[path]
        raise KeyError

    def update(self, new_rev, committed_changes=None, local_changes=None):
        if local_changes is None:
            local_changes = {}

        if committed_changes is not None:
            for path, status in committed_changes:
                self.remove_path(path)
                if status == "modified":
                    use_committed = path in local_changes
                    if use_committed:
                        print path
                    self.extend(get_manifest_items(path, use_committed=use_committed))

        self.local_changes = LocalChanges()
        for path, status in local_changes.iteritems():
            if status == "modified":
                items = set(get_manifest_items(path, use_committed=False))
                self.local_changes.extend(items)
            else:
                self.local_changes.add_deleted(path)

        self.rev = new_rev

    def to_json(self):
        out_items = defaultdict(list)
        for item_type, items in self._data.iteritems():
            for path, tests in items.iteritems():
                for test in tests:
                    out_items[test.item_type].append(test.to_json())

        rv = {"rev":self.rev,
              "local_changes":self.local_changes.to_json(),
              "items":out_items}
        return rv

    @classmethod
    def from_json(cls, obj):
        self = cls(obj["rev"])
        if not hasattr(obj, "iteritems"):
            raise ManifestError

        item_classes = {"testharness":TestharnessTest,
                        "reftest":RefTest,
                        "manual":ManualTest,
                        "helper":Helper,
                        "stub": Stub,
                        "wdspec": WebdriverSpecTest}

        for k, values in obj["items"].iteritems():
            if k not in item_types:
                raise ManifestError
            for v in values:
                manifest_item = item_classes[k].from_json(v)
                self.add(manifest_item)
        self.local_changes = LocalChanges.from_json(obj["local_changes"])
        return self

class LocalChanges(object):
    def __init__(self):
        self._data = dict((item_type, defaultdict(set)) for item_type in item_types)
        self._deleted = set()

    def add(self, item):
        self._data[item.item_type][item.path].add(item)

    def extend(self, items):
        for item in items:
            self.add(item)

    def add_deleted(self, path):
        self._deleted.add(path)

    def is_deleted(self, path):
        return path in self._deleted

    def itertypes(self, *types):
        for item_type in types:
            yield item_type, self._data[item_type]

    def iterdeleted(self):
        for item in self._deleted:
            yield item

    def __getitem__(self, item_type):
        return self._data[item_type]

    def to_json(self):
        rv = {"items": defaultdict(dict),
              "deleted": []}

        rv["deleted"].extend(self._deleted)

        for test_type, paths in self._data.iteritems():
            for path, tests in paths.iteritems():
                rv["items"][test_type][path] = [test.to_json() for test in tests]

        return rv

    @classmethod
    def from_json(cls, obj):
        self = cls()
        if not hasattr(obj, "iteritems"):
            raise ManifestError

        item_classes = {"testharness":TestharnessTest,
                        "reftest":RefTest,
                        "manual":ManualTest,
                        "helper":Helper,
                        "stub": Stub,
                        "wdspec": WebdriverSpecTest}

        for test_type, paths in obj["items"].iteritems():
            for path, tests in paths.iteritems():
                for test in tests:
                    manifest_item = item_classes[test_type].from_json(test)
                    self.add(manifest_item)

        for item in obj["deleted"]:
            self.add_deleted(item)

        return self


def get_ref(path):
    base_path, filename = os.path.split(path)
    name, ext = os.path.splitext(filename)
    for suffix in ref_suffixes:
        possible_ref = os.path.join(base_path, name + suffix + ext)
        if os.path.exists(possible_ref):
            return possible_ref


def markup_type(ext):
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


def get_timeout_meta(root):
    return root.findall(".//{http://www.w3.org/1999/xhtml}meta[@name='timeout']")


def get_testharness_scripts(root):
    return root.findall(".//{http://www.w3.org/1999/xhtml}script[@src='/resources/testharness.js']")


def get_reference_links(root):
    match_links = root.findall(".//{http://www.w3.org/1999/xhtml}link[@rel='match']")
    mismatch_links = root.findall(".//{http://www.w3.org/1999/xhtml}link[@rel='mismatch']")
    return match_links, mismatch_links


def get_file(rel_path, use_committed):
    if use_committed:
        blob = git("show", "HEAD:%s" % rel_path)
        file_obj = ContextManagerStringIO(blob)
    else:
        path = os.path.join(get_repo_root(), rel_path)
        file_obj = open(path)
    return file_obj

class ContextManagerStringIO(StringIO):
    def __enter__(self):
        return self

    def __exit__(self, *args, **kwargs):
        self.close()

def get_manifest_items(rel_path, use_committed=False):
    if rel_path.endswith(os.path.sep):
        return []

    url = "/" + rel_path.replace(os.sep, "/")
    path = os.path.join(get_repo_root(), rel_path)

    if not use_committed and not os.path.exists(path):
        return []

    base_path, filename = os.path.split(path)
    name, ext = os.path.splitext(filename)
    rel_dir_tree = rel_path.split(os.path.sep)

    file_markup_type = markup_type(ext)

    if filename.startswith("MANIFEST") or filename.startswith("."):
        return []

    for item in blacklist:
        if item == "/":
            if "/" not in url[1:]:
                return []
        elif url.startswith(item):
            return []

    if name.startswith("stub-"):
        return [Stub(rel_path, url)]

    if name.lower().endswith("-manual"):
        return [ManualTest(rel_path, url)]

    ref_list = []

    for suffix in ref_suffixes:
        if name.endswith(suffix):
            return [Helper(rel_path, rel_path)]
        elif os.path.exists(os.path.join(base_path, name + suffix + ext)):
            ref_url, ref_ext = url.rsplit(".", 1)
            ref_url = ref_url + suffix + ext
            #Need to check if this is the right reftype
            ref_list = [RefTest(rel_path, url, ref_url, "==")]

    # wdspec tests are in subdirectories of /webdriver excluding __init__.py
    # files.
    if (rel_dir_tree[0] == "webdriver" and
        len(rel_dir_tree) > 2 and
        filename != "__init__.py" and
        fnmatch(filename, wd_pattern)):
        return [WebdriverSpecTest(rel_path)]

    if file_markup_type:
        timeout = None

        parser = {"html":lambda x:html5lib.parse(x, treebuilder="etree"),
                  "xhtml":ElementTree.parse,
                  "svg":ElementTree.parse}[file_markup_type]

        with get_file(rel_path, use_committed) as f:
            try:
                tree = parser(f)
            except:
                return [Helper(rel_path, url)]

        if hasattr(tree, "getroot"):
            root = tree.getroot()
        else:
            root = tree

        timeout_nodes = get_timeout_meta(root)
        if timeout_nodes:
            timeout_str = timeout_nodes[0].attrib.get("content", None)
            if timeout_str and timeout_str.lower() == "long":
                try:
                    timeout = timeout_str.lower()
                except:
                    pass

        if get_testharness_scripts(root):
            return [TestharnessTest(rel_path, url, timeout=timeout)]
        else:
            match_links, mismatch_links = get_reference_links(root)
            for item in match_links + mismatch_links:
                ref_url = urlparse.urljoin(url, item.attrib["href"])
                ref_type = "==" if item.attrib["rel"] == "match" else "!="
                reftest = RefTest(rel_path, url, ref_url, ref_type, timeout=timeout)
                if reftest not in ref_list:
                    ref_list.append(reftest)
            return ref_list

    return [Helper(rel_path, url)]


def abs_path(path):
    return os.path.abspath(path)


def get_repo_paths():
    data = git("ls-tree", "--name-only", "--full-tree", "-r", "HEAD")
    return [item for item in data.split("\n") if not item.endswith(os.path.sep)]


def chunks(data, n):
    for i in range(0, len(data) - 1, n):
        yield data[i:i+n]


def get_committed_changes(base_rev):
    if base_rev is None:
        logger.debug("Adding all changesets to the manifest")
        return [(item, "modified") for item in get_repo_paths()]

    logger.debug("Updating the manifest from %s to %s" % (base_rev, get_current_rev()))
    rv = []
    data  = git("diff", "-z", "--name-status", base_rev + "..HEAD")
    items = data.split("\0")
    for status, filename in chunks(items, 2):
        if status == "D":
            rv.append((filename, "deleted"))
        else:
            rv.append((filename, "modified"))
    return rv


def has_local_changes():
    return git("status", "--porcelain", "--ignore-submodules=untracked").strip() != ""


def get_local_changes(path=None):
    # -z is stable like --porcelain; see the git status documentation for details
    cmd = ["status", "-z", "--ignore-submodules=all"]
    if path is not None:
        cmd.extend(["--", path])

    rv = {}

    data = git(*cmd)
    assert data[-1] == "\0"
    f = StringIO(data)

    while f.tell() < len(data):
        # First two bytes are the status in the stage (index) and working tree, respectively
        staged = f.read(1)
        worktree = f.read(1)
        assert f.read(1) == " "

        if staged == "R":
            # When a file is renamed, there are two files, the source and the destination
            files = 2
        else:
            files = 1

        filenames = []

        for i in range(files):
            filenames.append("")
            char = f.read(1)
            while char != "\0":
                filenames[-1] += char
                char = f.read(1)

        rv.update(local_status(staged, worktree, filenames))

    return rv

def local_status(staged, worktree, filenames):
    # Convert the complex range of statuses that git can have to two values
    # we care about; "modified" and "deleted" and return a dictionary mapping
    # filenames to statuses

    rv = {}

    if (staged, worktree) in [("D", "D"), ("A", "U"), ("U", "D"), ("U", "A"),
                              ("D", "U"), ("A", "A"), ("U", "U")]:
        raise Exception("Can't operate on tree containing unmerged paths")

    if staged == "R":
        assert len(filenames) == 2
        dest, src = filenames
        rv[dest] = "modified"
        rv[src] = "deleted"
    else:
        assert len(filenames) == 1

        filename = filenames[0]

        if staged == "D" or worktree == "D":
            # Actually if something is deleted in the index but present in the worktree
            # it will get included by having a status of both "D " and "??".
            # It isn't clear whether that's a bug
            rv[filename] = "deleted"
        elif staged == "?" and worktree == "?":
            # A new file. If it's a directory, recurse into it
            if os.path.isdir(os.path.join(get_repo_root(),
                                          filename)):
                rv.update(get_local_changes(filename))
            else:
                rv[filename] = "modified"
        else:
            rv[filename] = "modified"

    return rv


def get_current_rev():
    return git("rev-parse", "HEAD").strip()


def load(manifest_path):
    if os.path.exists(manifest_path):
        logger.debug("Opening manifest at %s" % manifest_path)
    else:
        logger.debug("Creating new manifest at %s" % manifest_path)
    try:
        with open(manifest_path) as f:
            manifest = Manifest.from_json(json.load(f))
    except IOError as e:
        manifest = Manifest(None)

    return manifest


def update(manifest, ignore_local=False):
    global ElementTree
    global html5lib

    try:
        from xml.etree import cElementTree as ElementTree
    except ImportError:
        from xml.etree import ElementTree

    import html5lib

    if not ignore_local:
        local_changes = get_local_changes()
    else:
        local_changes = None

    manifest.update(get_current_rev(),
                    get_committed_changes(manifest.rev),
                    local_changes)


def write(manifest, manifest_path):
    with open(manifest_path, "w") as f:
        json.dump(manifest.to_json(), f, sort_keys=True, indent=2, separators=(',', ': '))


def update_from_cli(repo_path, **kwargs):
    setup_git(repo_path)
    path = kwargs["path"]
    if not kwargs.get("rebuild", False):
        manifest = load(path)
    else:
        manifest = Manifest(None)

    logger.info("Updating manifest")
    update(manifest, ignore_local=kwargs.get("ignore_local", False))
    write(manifest, path)


def create_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-p", "--path", default=os.path.join(get_repo_root(), "MANIFEST.json"),
        help="Path to manifest file.")
    parser.add_argument(
        "-r", "--rebuild", action="store_true", default=False,
        help="Force a full rebuild of the manifest.")
    parser.add_argument(
        "--ignore-local", action="store_true", default=False,
        help="Don't include uncommitted local changes in the manifest.")
    return parser

if __name__ == "__main__":
    try:
        get_repo_root()
    except subprocess.CalledProcessError:
        print "Script must be inside a web-platform-tests git clone."
        sys.exit(1)
    opts = create_parser().parse_args()
    update_from_cli(get_repo_root(), **vars(opts))
