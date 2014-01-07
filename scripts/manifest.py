import sys
import os
from collections import defaultdict
import re
import urlparse
import argparse
import json
import subprocess
import logging

manifest_name = "MANIFEST.json"
exclude_php_hack = True
ref_suffixes = ["_ref", "-ref"]
blacklist = ["/", "/tools/", "/resources/", "/common/"]

logging.basicConfig()
logger = logging.getLogger("Web platform tests")
logger.setLevel(logging.DEBUG)

class ManifestItem(object):
    item_type = None

    def __init__(self, path, url):
        self.path = path
        self.url = url
        self.id = self.url

    def _key(self):
        return self.item_type, self.url

    def __eq__(self, other):
        if not hasattr(other, "_key"):
            return False
        return self._key() == other._key()

    def __hash__(self):
        return hash(self._key())

    def to_json(self):
        rv = {"path":self.path,
              "url":self.url}
        return rv

    @classmethod
    def from_json(self, obj):
        raise NotImplementedError


class TestharnessTest(ManifestItem):
    item_type = "testharness"

    def __init__(self, path, url, timeout=None):
        ManifestItem.__init__(self, path, url)
        self.timeout = timeout

    def to_json(self):
        rv = ManifestItem.to_json(self)
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
        ManifestItem.__init__(self, path, url)
        self.ref_url = ref_url
        self.ref_type = ref_type
        self.timeout = timeout
        self.id = (self.url, self.ref_type, self.ref_url)

    def _key(self):
        return self.item_type, self.url, self.ref_type, self.ref_url

    def to_json(self):
        rv = ManifestItem.to_json(self)
        rv.update({"ref_type": self.ref_type,
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

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"], obj["url"])


class Helper(ManifestItem):
    item_type = "helper"

    @classmethod
    def from_json(cls, obj):
        return cls(obj["path"], obj["url"])


class ManifestError(Exception):
    pass


class Manifest(object):
    def __init__(self, git_rev):
        self.item_types = ["testharness", "reftest",
                           "manual", "helper"]
        self._data = dict((item_type, defaultdict(set)) for item_type in self.item_types)
        self.rev = git_rev
        self.local_changes = LocalChanges()

    def contains_path(self, path):
        return any(path in item for item in self._data.itervalues())

    def add(self, item):
        self._data[item.item_type][item.path].add(item)

    def extend(self, items):
        for item in items:
            self.add(item)

    def remove_path(self, path):
        for item_type in self.item_types:
            if path in self._data[item_type]:
                del self._data[item_type][path]

    def itertype(self, item_type):
        values_by_type = reduce(lambda x,y:x|y, self._data[item_type].values(), set())
        for item in sorted(values_by_type, key=lambda x:x.url):
            yield item

    def __iter__(self):
        for item_type in self.item_types:
            for item in self._data[item_type].iteritems():
                yield item

    def __getitem__(self, key):
        for items in self._data.itervalues():
            if key in items:
                return items[key]
        raise KeyError

    def to_json(self):
        rv = {"rev":self.rev,
              "local_changes":self.local_changes.to_json(),
              "items":{},
              "items": {item_type:[item.to_json() for item in self.itertype(item_type)]
                        for item_type in self.item_types}}
        return rv

    @classmethod
    def from_json(cls, obj):
        self = cls(obj["rev"])
        if not hasattr(obj, "iteritems"):
            raise ManifestError

        item_classes = {"testharness":TestharnessTest,
                        "reftest":RefTest,
                        "manual":ManualTest,
                        "helper":Helper}

        for k, values in obj["items"].iteritems():
            if k not in self.item_types:
                raise ManifestError
            for v in values:
                manifest_item = item_classes[k].from_json(v)
                self.add(manifest_item)
        self.local_changes = LocalChanges.from_json(obj["local_changes"])
        return self


class LocalChanges(dict):
    def __setitem__(self, path, status):
        if status not in ["A", "M", "D"]:
            raise ValueError, "Unrecognised status %s for path %s" % (status, path)
        dict.__setitem__(self, path, status)

    def to_json(self):
        return [(self[item], item) for item in sorted(self.keys())]

    @classmethod
    def from_json(cls, obj):
        self = cls()
        for status, path in obj:
            self[path] = status
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


def get_manifest_items(rel_path):
    if rel_path.endswith(os.path.sep):
        return []

    url = "/" + rel_path.replace(os.sep, "/")

    path = os.path.join(get_repo_root(), rel_path)
    if not os.path.exists(path):
        return []

    base_path, filename = os.path.split(path)
    name, ext = os.path.splitext(filename)

    file_markup_type = markup_type(ext)

    if filename.startswith("MANIFEST") or filename.startswith("."):
        return []

    for item in blacklist:
        if item == "/":
            if "/" not in url[1:]:
                return []
        elif url.startswith(item):
            return []

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

    if file_markup_type:
        timeout = None

        if exclude_php_hack:
            php_re =re.compile("\.php")
            with open(path) as f:
                text = f.read()
                if php_re.findall(text):
                    return []

        parser = {"html":lambda x:html5lib.parse(x, treebuilder="etree"),
                  "xhtml":ElementTree.parse,
                  "svg":ElementTree.parse}[file_markup_type]
        try:
            with open(path) as f:
                tree = parser(f)
        except:
            return [Helper(rel_path, url)]

        if hasattr(tree, "getroot"):
            root = tree.getroot()
        else:
            root = tree

        timeout_nodes = root.findall(".//{http://www.w3.org/1999/xhtml}meta[@name='timeout']")
        if timeout_nodes:
            timeout_str = timeout_nodes[0].attrib.get("content", None)
            if timeout_str and timeout_str.lower() == "long":
                try:
                    timeout = timeout_str.lower()
                except:
                    pass

        if root.findall(".//{http://www.w3.org/1999/xhtml}script[@src='/resources/testharness.js']"):
            return [TestharnessTest(rel_path, url, timeout=timeout)]
        else:
            match_links = root.findall(".//{http://www.w3.org/1999/xhtml}link[rel='match']")
            mismatch_links = root.findall(".//{http://www.w3.org/1999/xhtml}link[rel='mismatch']")
            for item in match_links + mismatch_links:
                ref_url = item.attrib["href"]
                ref_type = "==" if item.attrib["rel"] == "match" else "!="
                ref_list.append(RefTest(rel_path, url, ref_url, ref_type, timeout=timeout))
            return ref_list

    return [Helper(rel_path, url)]


def abs_path(path):
    return os.path.abspath(path)


def get_git_func(repo_base):
    def git(cmd, *args):
        proc = subprocess.Popen(["git", cmd] + list(args), stdout=subprocess.PIPE, cwd=repo_base)
        stdout, stderr = proc.communicate()
        return stdout
    return git


def setup_git(repo_path):
    assert os.path.exists(os.path.join(repo_path, ".git"))
    global git
    git = get_git_func(repo_path)


def get_repo_paths():
    data = git("ls-tree", "--name-only", "--full-tree", "-r", "HEAD")
    return [item for item in data.split("\n") if not item.endswith(os.path.sep)]


def get_committed_changes(base_rev):
    if base_rev is None:
        logger.debug("Adding all changesets to the manifest")
        return [("A", item) for item in get_repo_paths()]
    else:
        logger.debug("Updating the manifest from %s to %s" % (base_rev, get_current_rev()))
        data  = git("diff", "--name-status", base_rev)
        return [line.split("\t", 1) for line in data.split("\n") if line]


def get_local_changes():
    #This doesn't account for whole directories that have been added
    data  = git("status", "--porcelain")
    rv = LocalChanges()
    for line in data.split("\n"):
        line = line.strip()
        if not line:
            continue
        status, path = line.split(" ", 1)
        if path.endswith(os.path.sep):
            logger.warning("Ignoring added directory %s" % path)
            continue
        if status == "??":
            status = "A"
        if status == "R":
            old_path, path = tuple(item.strip() for item in path.split("->"))
            rv[old_path] = "D"
            status = "A"
        rv[path] = status
    return rv


def sync_urls(manifest, updated_files):
    for status, path in updated_files:
        if status in ("D", "M"):
            manifest.remove_path(path)
        if status in ("A", "M"):
            manifest.extend(get_manifest_items(path))


def sync_local_changes(manifest, local_changes):
    #If we just refuse to write the manifest in the face of local changes
    #this can be simplified somewhat
    if local_changes:
        logger.info("Working directory not clean, adding local changes")
    prev_local_changes = manifest.local_changes
    all_paths = get_repo_paths()

    for path, status in prev_local_changes.iteritems():
        print status, path, path in local_changes
        if path not in local_changes:
            #If a path was previously marked as deleted but is now back
            #we need to readd it to the manifest
            if status == "D" and path in all_paths:
                local_changes[path] = "A"
            #If a path was previously marked as added but is now
            #not then we need to remove it from the manifest
            elif status == "A" and path not in all_paths:
                local_changes[path] = "D"

    sync_urls(manifest, ((status, path) for path, status in local_changes.iteritems()))


def get_repo_root():
    file_path = os.path.abspath(__file__)
    while file_path:
        if os.path.exists(os.path.join(file_path, ".git")):
            return file_path
        else:
            file_path = os.path.split(file_path)[0]
    return None


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


def update(manifest):
    global ElementTree
    global html5lib

    try:
        from xml.etree import cElementTree as ElementTree
    except ImportError:
        from xml.etree import ElementTree

    import html5lib

    committed_changes = get_committed_changes(manifest.rev)
    local_changes = get_local_changes()

    sync_urls(manifest, committed_changes)
    sync_local_changes(manifest, local_changes)

    manifest.rev = get_current_rev()
    manifest.local_changes = local_changes


def write(manifest, manifest_path):
    with open(manifest_path, "w") as f:
        json.dump(manifest.to_json(), f, indent=2)


def update_manifest(repo_path, out_path):
    setup_git(repo_path)
    manifest = load(out_path)
    update(manifest)
    if not manifest.local_changes:
        write(manifest, out_path)
    else:
        logging.info("Not writing updated manifest because of local changes")


if __name__ == "__main__":
    repo_root = get_repo_root()
    out_dir = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(repo_root, "MANIFEST.json"))
    update_manifest(repo_root, out_dir)
