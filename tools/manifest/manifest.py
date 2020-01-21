import json
import os
from six import iteritems, itervalues, string_types, binary_type, text_type

from . import vcs
from .item import (ConformanceCheckerTest, ManifestItem, ManualTest, RefTest, SupportFile,
                   TestharnessTest, VisualTest, WebDriverSpecTest, CrashTest)
from .log import get_logger
from .sourcefile import SourceFile
from .typedata import TypeData
from .utils import from_os_path, to_os_path

MYPY = False
if MYPY:
    # MYPY is set to True when run under Mypy.
    from logging import Logger
    from typing import Any
    from typing import Container
    from typing import Dict
    from typing import IO
    from typing import Iterator
    from typing import Iterable
    from typing import Optional
    from typing import Set
    from typing import Text
    from typing import Tuple
    from typing import Type
    from typing import Union

try:
    import ujson
    fast_json = ujson
except ImportError:
    fast_json = json  # type: ignore

CURRENT_VERSION = 8  # type: int


class ManifestError(Exception):
    pass


class ManifestVersionMismatch(ManifestError):
    pass


item_classes = {"testharness": TestharnessTest,
                "reftest": RefTest,
                "crashtest": CrashTest,
                "manual": ManualTest,
                "wdspec": WebDriverSpecTest,
                "conformancechecker": ConformanceCheckerTest,
                "visual": VisualTest,
                "support": SupportFile}  # type: Dict[str, Type[ManifestItem]]


if MYPY:
    ManifestDataType = Dict[Any, TypeData]
else:
    ManifestDataType = dict

class ManifestData(ManifestDataType):
    def __init__(self, manifest):
        # type: (Manifest) -> None
        """Dictionary subclass containing a TypeData instance for each test type,
        keyed by type name"""
        self.initialized = False  # type: bool
        for key, value in iteritems(item_classes):
            self[key] = TypeData(manifest, value)
        self.initialized = True
        self.json_obj = None  # type: None

    def __setitem__(self, key, value):
        # type: (str, TypeData) -> None
        if self.initialized:
            raise AttributeError
        dict.__setitem__(self, key, value)

    def paths(self):
        # type: () -> Set[Text]
        """Get a list of all paths containing test items
        without actually constructing all the items"""
        rv = set()  # type: Set[Text]
        for item_data in itervalues(self):
            for item in item_data:
                rv.add(os.path.sep.join(item))
        return rv

    def types(self):
        # type: () -> Dict[Tuple[Text, ...], str]
        rv = dict()
        for item_type, item_data in iteritems(self):
            for item in item_data:
                rv[item] = item_type
        return rv



class Manifest(object):
    def __init__(self, tests_root=None, url_base="/"):
        # type: (Optional[str], Text) -> None
        assert url_base is not None
        self._data = ManifestData(self)  # type: ManifestData
        self.tests_root = tests_root  # type: Optional[str]
        self.url_base = url_base  # type: Text

    def __iter__(self):
        # type: () -> Iterator[Tuple[str, Text, Set[ManifestItem]]]
        return self.itertypes()

    def itertypes(self, *types):
        # type: (*str) -> Iterator[Tuple[str, Text, Set[ManifestItem]]]
        for item_type in (types or sorted(self._data.keys())):
            for path in sorted(self._data[item_type]):
                str_path = os.sep.join(path)
                tests = self._data[item_type][path]
                yield item_type, str_path, tests

    def iterpath(self, path):
        # type: (Text) -> Iterable[ManifestItem]
        tpath = tuple(path.split(os.path.sep))

        for type_tests in self._data.values():
            i = type_tests.get(tpath, set())
            assert i is not None
            for test in i:
                yield test

    def iterdir(self, dir_name):
        # type: (Text) -> Iterable[ManifestItem]
        tpath = tuple(dir_name.split(os.path.sep))
        tpath_len = len(tpath)

        for type_tests in self._data.values():
            for path, tests in type_tests.iteritems():
                if path[:tpath_len] == tpath:
                    for test in tests:
                        yield test

    def update(self, tree):
        # type: (Iterable[Tuple[Union[SourceFile, bytes], bool]]) -> bool
        """Update the manifest given an iterable of items that make up the updated manifest.

        The iterable must either generate tuples of the form (SourceFile, True) for paths
        that are to be updated, or (path, False) for items that are not to be updated. This
        unusual API is designed as an optimistaion meaning that SourceFile items need not be
        constructed in the case we are not updating a path, but the absence of an item from
        the iterator may be used to remove defunct entries from the manifest."""

        changed = False

        # Create local variable references to these dicts so we avoid the
        # attribute access in the hot loop below
        data = self._data

        types = data.types()
        deleted = set(types)

        for source_file, update in tree:
            if not update:
                assert isinstance(source_file, (binary_type, text_type))
                deleted.remove(tuple(source_file.split(os.path.sep)))
            else:
                assert not isinstance(source_file, bytes)
                rel_path = source_file.rel_path  # type: Text
                rel_path_parts = source_file.rel_path_parts
                assert isinstance(rel_path_parts, tuple)

                file_hash = source_file.hash  # type: Text

                is_new = rel_path_parts not in deleted  # type: bool
                hash_changed = False  # type: bool

                if not is_new:
                    deleted.remove(rel_path_parts)
                    old_type = types[rel_path_parts]
                    old_hash = data[old_type].hashes[rel_path_parts]
                    if old_hash != file_hash:
                        hash_changed = True

                if is_new or hash_changed:
                    new_type, manifest_items = source_file.manifest_items()
                    data[new_type][rel_path_parts] = set(manifest_items)
                    data[new_type].hashes[rel_path_parts] = file_hash
                    if hash_changed and new_type != old_type:
                        del data[old_type][rel_path_parts]
                    changed = True

        if deleted:
            changed = True
            for rel_path_parts in deleted:
                for test_data in itervalues(data):
                    if rel_path_parts in test_data:
                        del test_data[rel_path_parts]

        return changed

    def to_json(self):
        # type: () -> Dict[Text, Any]
        out_items = {
            test_type: type_paths.to_json()
            for test_type, type_paths in iteritems(self._data) if type_paths
        }
        rv = {"url_base": self.url_base,
              "items": out_items,
              "version": CURRENT_VERSION}  # type: Dict[Text, Any]
        return rv

    @classmethod
    def from_json(cls, tests_root, obj, types=None):
        # type: (str, Dict[Text, Any], Optional[Container[Text]]) -> Manifest
        version = obj.get("version")
        if version != CURRENT_VERSION:
            raise ManifestVersionMismatch

        self = cls(tests_root, url_base=obj.get("url_base", "/"))
        if not hasattr(obj, "items"):
            raise ManifestError

        for test_type, type_paths in iteritems(obj["items"]):
            if test_type not in item_classes:
                raise ManifestError

            if types and test_type not in types:
                continue

            self._data[test_type].set_json(type_paths)

        return self


def load(tests_root, manifest, types=None):
    # type: (str, Union[IO[bytes], str], Optional[Container[Text]]) -> Optional[Manifest]
    logger = get_logger()

    logger.warning("Prefer load_and_update instead")
    return _load(logger, tests_root, manifest, types)


__load_cache = {}  # type: Dict[str, Manifest]


def _load(logger,  # type: Logger
          tests_root,  # type: str
          manifest,  # type: Union[IO[bytes], str]
          types=None,  # type: Optional[Container[Text]]
          allow_cached=True  # type: bool
          ):
    # type: (...) -> Optional[Manifest]
    manifest_path = (manifest if isinstance(manifest, string_types)
                     else manifest.name)
    if allow_cached and manifest_path in __load_cache:
        return __load_cache[manifest_path]

    if isinstance(manifest, string_types):
        if os.path.exists(manifest):
            logger.debug("Opening manifest at %s" % manifest)
        else:
            logger.debug("Creating new manifest at %s" % manifest)
        try:
            with open(manifest, "rb") as f:
                rv = Manifest.from_json(tests_root,
                                        fast_json.load(f),
                                        types=types)
        except IOError:
            return None
        except ValueError:
            logger.warning("%r may be corrupted", manifest)
            return None
    else:
        rv = Manifest.from_json(tests_root,
                                fast_json.load(manifest),
                                types=types)

    if allow_cached:
        __load_cache[manifest_path] = rv
    return rv


def load_and_update(tests_root,  # type: bytes
                    manifest_path,  # type: bytes
                    url_base,  # type: Text
                    update=True,  # type: bool
                    rebuild=False,  # type: bool
                    metadata_path=None,  # type: Optional[bytes]
                    cache_root=None,  # type: Optional[bytes]
                    working_copy=True,  # type: bool
                    types=None,  # type: Optional[Container[Text]]
                    write_manifest=True,  # type: bool
                    allow_cached=True  # type: bool
                    ):
    # type: (...) -> Manifest
    logger = get_logger()

    manifest = None
    if not rebuild:
        try:
            manifest = _load(logger,
                             tests_root,
                             manifest_path,
                             types=types,
                             allow_cached=allow_cached)
        except ManifestVersionMismatch:
            logger.info("Manifest version changed, rebuilding")

        if manifest is not None and manifest.url_base != url_base:
            logger.info("Manifest url base did not match, rebuilding")
            manifest = None

    if manifest is None:
        manifest = Manifest(tests_root, url_base)
        rebuild = True
        update = True

    if rebuild or update:
        tree = vcs.get_tree(tests_root, manifest, manifest_path, cache_root,
                            working_copy, rebuild)
        changed = manifest.update(tree)
        if write_manifest and changed:
            write(manifest, manifest_path)
        tree.dump_caches()

    return manifest


def write(manifest, manifest_path):
    # type: (Manifest, bytes) -> None
    dir_name = os.path.dirname(manifest_path)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)
    with open(manifest_path, "wb") as f:
        # Use ',' instead of the default ', ' separator to prevent trailing
        # spaces: https://docs.python.org/2/library/json.html#json.dump
        json.dump(manifest.to_json(), f,
                  sort_keys=True, indent=1, separators=(',', ': '))
        f.write("\n")
