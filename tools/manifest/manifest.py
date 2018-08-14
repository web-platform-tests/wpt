import itertools
import json
import os
from collections import defaultdict
from six import iteritems, string_types

from .item import (ManualTest, WebdriverSpecTest, Stub, RefTestNode, RefTest,
                   TestharnessTest, SupportFile, ConformanceCheckerTest, VisualTest)
from .log import get_logger
from .utils import from_os_path, to_os_path

try:
    import ujson as json
except ImportError:
    pass

CURRENT_VERSION = 4


class ManifestError(Exception):
    pass


class ManifestVersionMismatch(ManifestError):
    pass


def iterfilter(filters, iter):
    for f in filters:
        iter = f(iter)
    for item in iter:
        yield item


item_classes = {"testharness": TestharnessTest,
                "reftest": RefTest,
                "reftest_node": RefTestNode,
                "manual": ManualTest,
                "stub": Stub,
                "wdspec": WebdriverSpecTest,
                "conformancechecker": ConformanceCheckerTest,
                "visual": VisualTest,
                "support": SupportFile}


class TypeData(object):
    def __init__(self, manifest, type_cls):
        self.manifest = manifest
        self.type_cls = type_cls
        self.data = {}
        self.json_data = None
        self.tests_root = None

    def __getitem__(self, key):
        if key not in self.data:
            self.load(key)
        return self.data[key]

    def __setitem__(self, key, value):
        self.data[key] = value

    def __iter__(self):
        self.load_all()
        for path, tests in iteritems(self.data):
            yield path, tests

    def load(self, key):
        if self.json_data is not None:
            data = set()
            path = from_os_path(key)
            for test in self.json_data.get(path, []):
                manifest_item = self.type_cls.from_json(self.manifest,
                                                        self.tests_root,
                                                        path,
                                                        test)
                data.add(manifest_item)
            self.data[key] = data
        else:
            raise ValueError

    def load_all(self):
        if self.json_data is not None:
            for path, value in iteritems(self.json_data):
                key = to_os_path(path)
                if key in self.data:
                    continue
                data = set()
                for test in self.json_data.get(path, []):
                    manifest_item = self.type_cls.from_json(self.manifest,
                                                            self.tests_root,
                                                            path,
                                                            test)
                    data.add(manifest_item)
                self.data[key] = data
            self.json_data = None

    def set_json(self, tests_root, data):
        self.tests_root = tests_root
        self.json_data = data


class ManifestData(object):
    def __init__(self, manifest):
        self.data = {key: TypeData(manifest, value) for key, value in item_classes.iteritems()}
        self.json_obj = None

    def __getitem__(self, key):
        return self.data[key]


class Manifest(object):
    def __init__(self, url_base="/"):
        assert url_base is not None
        self._path_hash = {}
        self._data = ManifestData(self)
        self._reftest_nodes_by_url = None
        self.url_base = url_base

    def __iter__(self):
        return self.itertypes()

    def itertypes(self, *types):
        if not types:
            types = sorted(self._data.keys())
        for item_type in types:
            for path, tests in sorted(self._data[item_type]):
                yield item_type, path, tests

    def iterpath(self, path):
        for type_tests in self._data.values():
            for test in type_tests.get(path, set()):
                yield test

    def iterdir(self, dir_name):
        if not dir_name.endswith(os.path.sep):
            dir_name = dir_name + os.path.sep
        for type_tests in self._data.values():
            for path, tests in type_tests.iteritems():
                if path.startswith(dir_name):
                    for test in tests:
                        yield test

    @property
    def reftest_nodes_by_url(self):
        if self._reftest_nodes_by_url is None:
            by_url = {}
            for path, nodes in itertools.chain(iteritems(self._data.get("reftest", {})),
                                               iteritems(self._data.get("reftest_node", {}))):
                for node in nodes:
                    by_url[node.url] = node
            self._reftest_nodes_by_url = by_url
        return self._reftest_nodes_by_url

    def get_reference(self, url):
        return self.reftest_nodes_by_url.get(url)

    def update(self, tree):
        reftest_nodes = []
        old_files = {}

        changed = False
        reftest_changes = False

        for source_file in tree:
            rel_path = source_file.rel_path
            if not os.path.exists(source_file.path):
                old_hash, old_type = self._path_hash.get(rel_path)
                self._path_hash.pop(rel_path, None)
                self._data[old_type].pop(rel_path, None)
                old_files[old_type] = rel_path
            else:
                file_hash = source_file.hash

                is_new = rel_path not in self._path_hash
                hash_changed = False

                if not is_new:
                    old_hash, old_type = self._path_hash[rel_path]
                    if old_hash != file_hash:
                        new_type, manifest_items = source_file.manifest_items()
                        hash_changed = True
                    else:
                        new_type, manifest_items = old_type, self._data[old_type][rel_path]
                    if old_type in ("reftest", "reftest_node") and new_type != old_type:
                        reftest_changes = True
                else:
                    new_type, manifest_items = source_file.manifest_items()

                if new_type in ("reftest", "reftest_node"):
                    reftest_nodes.extend(manifest_items)
                    if is_new or hash_changed:
                        reftest_changes = True
                elif new_type:
                    self._data[new_type][rel_path] = set(manifest_items)

                self._path_hash[rel_path] = (file_hash, new_type)

                if is_new or hash_changed:
                    changed = True

        if reftest_changes or old_files.get("reftest") or old_files.get("reftest_node"):
            reftests, reftest_nodes, changed_hashes = self._compute_reftests(reftest_nodes)
            self._data["reftest"] = reftests
            self._data["reftest_node"] = reftest_nodes
            self._path_hash.update(changed_hashes)

        return changed

    def _compute_reftests(self, reftest_nodes):
        self._reftest_nodes_by_url = {}
        has_inbound = set()
        for item in reftest_nodes:
            for ref_url, ref_type in item.references:
                has_inbound.add(ref_url)

        reftests = defaultdict(set)
        references = defaultdict(set)
        changed_hashes = {}

        for item in reftest_nodes:
            if item.url in has_inbound:
                # This is a reference
                if isinstance(item, RefTest):
                    item = item.to_RefTestNode()
                    changed_hashes[item.source_file.rel_path] = (item.source_file.hash,
                                                                 item.item_type)
                references[item.source_file.rel_path].add(item)
            else:
                if isinstance(item, RefTestNode):
                    item = item.to_RefTest()
                    changed_hashes[item.source_file.rel_path] = (item.source_file.hash,
                                                                 item.item_type)
                reftests[item.source_file.rel_path].add(item)
            self._reftest_nodes_by_url[item.url] = item

        return reftests, references, changed_hashes

    def to_json(self):
        out_items = {
            test_type: {
                from_os_path(path):
                [t for t in sorted(test.to_json() for test in tests)]
                for path, tests in iteritems(type_paths)
            }
            for test_type, type_paths in iteritems(self._data)
        }
        rv = {"url_base": self.url_base,
              "paths": {from_os_path(k): v for k, v in iteritems(self._path_hash)},
              "items": out_items,
              "version": CURRENT_VERSION}
        return rv

    @classmethod
    def from_json(cls, tests_root, obj, types=None, meta_filters=None):
        version = obj.get("version")
        if version != CURRENT_VERSION:
            raise ManifestVersionMismatch

        self = cls(url_base=obj.get("url_base", "/"))
        if not hasattr(obj, "items") and hasattr(obj, "paths"):
            raise ManifestError

        self._path_hash = {to_os_path(k): v for k, v in iteritems(obj["paths"])}

        meta_filters = meta_filters or []

        for test_type, type_paths in iteritems(obj["items"]):
            if test_type not in item_classes:
                raise ManifestError

            if types and test_type not in types:
                continue

            self._data[test_type].set_json(tests_root, type_paths)

        return self


def load(tests_root, manifest, types=None, meta_filters=None):
    logger = get_logger()

    # "manifest" is a path or file-like object.
    if isinstance(manifest, string_types):
        if os.path.exists(manifest):
            logger.debug("Opening manifest at %s" % manifest)
        else:
            logger.debug("Creating new manifest at %s" % manifest)
        try:
            with open(manifest) as f:
                rv = Manifest.from_json(tests_root, json.load(f), types=types, meta_filters=meta_filters)
        except IOError:
            return None
        except ValueError:
            import pdb
            pdb.post_mortem()
            logger.warning("%r may be corrupted", manifest)
            return None
        return rv

    return Manifest.from_json(tests_root, json.load(manifest), types=types, meta_filters=meta_filters)


def write(manifest, manifest_path):
    dir_name = os.path.dirname(manifest_path)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)
    with open(manifest_path, "wb") as f:
        json.dump(manifest.to_json(), f, sort_keys=True, indent=1, separators=(',', ': '))
        f.write("\n")
