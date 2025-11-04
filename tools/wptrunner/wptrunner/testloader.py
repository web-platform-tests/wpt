from __future__ import annotations

import abc
import hashlib
import itertools
import json
import os
import queue
from abc import ABCMeta, abstractmethod
from collections import defaultdict, deque
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Collection,
    Container,
    Generic,
    Iterable,
    Iterator,
    Mapping,
    MutableMapping,
    NamedTuple,
    Protocol,
    Sequence,
    Tuple,
    TypedDict,
    TypeVar,
    cast,
)
from urllib.parse import urlsplit

from mozlog import structured
from mozlog.structuredlog import StructuredLogger

from . import manifestexpected, manifestinclude, manifestupdate, wpttest

if TYPE_CHECKING:
    import sys
    from collections.abc import MutableSet
    from collections.abc import Set as AbstractSet

    if sys.version_info >= (3, 10):
        from typing import TypeAlias
    else:
        from typing_extensions import TypeAlias

    from tools.manifest import item as manifest_item
    from tools.manifest import manifest
    from tools.manifest.download import download_from_github

    from .wptcommandline import TestPaths, TestRoot

    def do_delayed_imports() -> None:
        pass
else:
    def do_delayed_imports() -> None:
        # This relies on an already loaded module having set the sys.path correctly :(
        global manifest, manifest_update, download_from_github
        from manifest import manifest
        from manifest import update as manifest_update
        from manifest.download import download_from_github


# Mapping from (subsuite, test_type) to [Test]
TestsByType: TypeAlias = "Mapping[Tuple[str, str], Sequence[wpttest.Test]]"

# What manifest.Manifest.itertypes yields.
ManifestItertypesItem: TypeAlias = "Tuple[str, str, AbstractSet[manifest_item.URLManifestItem]]"

# A filter of manifest items.
ManifestFilter: TypeAlias = "Callable[[Iterable[ManifestItertypesItem]], Iterable[ManifestItertypesItem]]"

# A filter of wpttest tests.
WPTTestFilter: TypeAlias = "Callable[[wpttest.Test], bool]"

# All loaded manifests.
TestManifests: TypeAlias = "Mapping[manifest.Manifest, ManifestPathData]"


_T = TypeVar("_T")


class QueueProtocol(Protocol[_T]):
    def __init__(self) -> None:
        raise NotImplementedError

    def put(self, item: _T) -> None:
        raise NotImplementedError

    def get(self, block: bool) -> _T:
        raise NotImplementedError


class WriteQueue(Generic[_T]):
    def __init__(self, queue_cls: type[QueueProtocol[_T]] = queue.SimpleQueue) -> None:
        """Queue wrapper that is only used for writing items to a queue.

        Once all items are enqueued, call to_read() to get a reader for the queue.
        This will also prevent further writes using this writer."""
        self._raw_queue: QueueProtocol[_T] | None = queue_cls()

    def put(self, item: _T) -> None:
        if self._raw_queue is None:
            raise ValueError("Tried to write to closed queue")
        self._raw_queue.put(item)

    def to_read(self) -> ReadQueue[_T]:
        if self._raw_queue is None:
            raise ValueError("Tried to get readable copy of closed queue")
        reader = ReadQueue(self._raw_queue)
        self._raw_queue = None
        return reader


class ReadQueue(Generic[_T]):
    def __init__(self, raw_queue: QueueProtocol[_T]) -> None:
        self._raw_queue = raw_queue

    def get(self) -> _T:
        """Queue wrapper that is only used for reading items from a queue."""
        return self._raw_queue.get(False)


class TestGroups:
    def __init__(self, logger: StructuredLogger, path: str, subsuites: Container[str]) -> None:
        try:
            with open(path) as f:
                data = json.load(f)
        except ValueError:
            logger.critical("test groups file %s not valid json" % path)
            raise

        self.tests_by_group = defaultdict(set)
        self.group_by_test = {}
        for group, test_ids in data.items():
            id_parts = group.split(":", 1)
            if len(id_parts) == 1:
                group_name = id_parts[0]
                subsuite = ""
            else:
                subsuite, group_name = id_parts
                if subsuite not in subsuites:
                    raise ValueError(f"Unknown subsuite {subsuite} in group data {group}")
            for test_id in test_ids:
                self.group_by_test[(subsuite, test_id)] = group_name
                self.tests_by_group[group_name].add(test_id)


def load_subsuites(logger: StructuredLogger,
                   base_run_info: Mapping[str, Any],
                   path: str | None,
                   include_subsuites: MutableSet[str]) -> Mapping[str, Subsuite]:
    subsuites: dict[str, Subsuite] = {}
    run_all_subsuites = not include_subsuites
    include_subsuites.add("")

    def maybe_add_subsuite(name: str, data: Mapping[str, Any]) -> None:
        if run_all_subsuites or name in include_subsuites:
            subsuites[name] = Subsuite(name,
                                       data.get("config", {}),
                                       base_run_info,
                                       run_info_extras=data.get("run_info", {}),
                                       include=data.get("include"),
                                       tags=set(data["tags"]) if "tags" in data else None)
            if name in include_subsuites:
                include_subsuites.remove(name)

    maybe_add_subsuite("", {})

    if path is None:
        if include_subsuites:
            raise ValueError("Unrecognised subsuites {','.join(include_subsuites)}, missing --subsuite-file?")
        return subsuites

    try:
        with open(path) as f:
            data = json.load(f)
    except ValueError:
        logger.critical("subsuites file %s not valid json" % path)
        raise

    for key, subsuite in data.items():
        if key == "":
            raise ValueError("Subsuites must have a non-empty name")
        maybe_add_subsuite(key, subsuite)

    if include_subsuites:
        raise ValueError(f"Unrecognised subsuites {','.join(include_subsuites)}")

    return subsuites


class Subsuite:
    def __init__(self,
                 name: str,
                 config: Mapping[str, object],
                 base_run_info: Mapping[str, object] | None = None,
                 run_info_extras: MutableMapping[str, object] | None = None,
                 include: Sequence[str] | None = None,
                 tags: AbstractSet[str] | None = None) -> None:
        self.name = name
        self.config = config
        self.run_info_extras = run_info_extras or {}
        self.run_info_extras["subsuite"] = name
        self.include = include
        self.tags = tags

        run_info = dict(base_run_info) if base_run_info is not None else {}
        run_info.update(self.run_info_extras)
        self.run_info = run_info

    def manifest_filters(self, manifests: TestManifests) -> Sequence[ManifestFilter]:
        if self.name:
            manifest_filters = [TestFilter(manifests,
                                           include=self.include,
                                           explicit=True)]
            return manifest_filters

        # use base manifest_filters for default subsuite
        return []

    def __repr__(self) -> str:
        return "Subsuite('%s', config:%s, run_info:%s)" % (self.name or 'default',
                                                           str(self.config),
                                                           str(self.run_info))


def read_test_prefixes_from_file(file: str) -> Sequence[str]:
    new_include = []
    with open(file) as f:
        for line in f:
            line = line.strip()
            # Allow whole-line comments;
            # fragments mean we can't have partial line #-based comments
            if len(line) > 0 and not line.startswith("#"):
                new_include.append(line)
    return new_include


def update_include_for_groups(test_groups: TestGroups, include: str | None) -> Sequence[str]:
    new_include: list[str] = []
    if include is None:
        # We're just running everything
        for tests in test_groups.tests_by_group.values():
            new_include.extend(tests)
    else:
        for item in include:
            if item in test_groups.tests_by_group:
                new_include.extend(test_groups.tests_by_group[item])
            else:
                new_include.append(item)
    return new_include


class TestChunker(abc.ABC):
    def __init__(self, total_chunks: int, chunk_number: int) -> None:
        self.total_chunks = total_chunks
        self.chunk_number = chunk_number
        assert self.chunk_number <= self.total_chunks
        self.logger = structured.get_default_logger()
        assert self.logger

    @abstractmethod
    def __call__(self, manifest: Iterable[ManifestItertypesItem]) -> Iterator[ManifestItertypesItem]:
        ...


class Unchunked(TestChunker):
    def __init__(self, total_chunks: int, chunk_number: int) -> None:
        super().__init__(total_chunks, chunk_number)
        assert self.total_chunks == 1

    def __call__(self, manifest: Iterable[ManifestItertypesItem]) -> Iterator[ManifestItertypesItem]:
        yield from manifest


class HashChunker(TestChunker):
    def __call__(self, manifest: Iterable[ManifestItertypesItem]) -> Iterator[ManifestItertypesItem]:
        for test_type, test_path, tests in manifest:
            tests_for_chunk = {
                test for test in tests
                if self._key_in_chunk(self.chunk_key(test_type, test_path, test))
            }
            if tests_for_chunk:
                yield test_type, test_path, tests_for_chunk

    def _key_in_chunk(self, key: str) -> bool:
        chunk_index = self.chunk_number - 1
        digest = hashlib.md5(key.encode()).hexdigest()
        return int(digest, 16) % self.total_chunks == chunk_index

    @abstractmethod
    def chunk_key(self, test_type: str, test_path: str,
                  test: manifest_item.URLManifestItem) -> str:
        ...


class PathHashChunker(HashChunker):
    def chunk_key(self, test_type: str, test_path: str,
                  test: manifest_item.URLManifestItem) -> str:
        return test_path


class IDHashChunker(HashChunker):
    def chunk_key(self, test_type: str, test_path: str,
                  test: manifest_item.URLManifestItem) -> str:
        return test.id


class DirectoryHashChunker(HashChunker):
    """Like HashChunker except the directory is hashed.

    This ensures that all tests in the same directory end up in the same
    chunk.
    """
    def __init__(self, total_chunks: int, chunk_number: int, *, depth: int | None = None) -> None:
        super().__init__(total_chunks, chunk_number)
        self.depth = depth

    def chunk_key(self, test_type: str, test_path: str,
                  test: manifest_item.URLManifestItem) -> str:
        if self.depth:
            return os.path.sep.join(os.path.dirname(test_path).split(os.path.sep, self.depth)[:self.depth])
        else:
            return os.path.dirname(test_path)


class TestFilter:
    """Callable that restricts the set of tests in a given manifest according
    to initial criteria"""
    def __init__(
        self,
        test_manifests: TestManifests,
        include: Collection[str] | None = None,
        exclude: Collection[str] | None = None,
        manifest_path: str | None = None,
        explicit: bool = False,
    ) -> None:
        if manifest_path is None or include or explicit:
            self.manifest = manifestinclude.IncludeManifest.create()
            self.manifest.set_defaults()
        else:
            self.manifest = manifestinclude.get_manifest(manifest_path)

        if include or explicit:
            self.manifest.set("skip", "true")  # type: ignore[no-untyped-call]

        if include:
            for item in include:
                self.manifest.add_include(test_manifests, item)

        if exclude:
            for item in exclude:
                self.manifest.add_exclude(test_manifests, item)

    def __call__(self, manifest_iter: Iterable[ManifestItertypesItem]) -> Iterable[ManifestItertypesItem]:
        for test_type, test_path, tests in manifest_iter:
            include_tests = set()
            for test in tests:
                if self.manifest.include(test):
                    include_tests.add(test)

            if include_tests:
                yield test_type, test_path, include_tests


class TagFilter:
    def __init__(self, include_tags: Collection[str], exclude_tags: Collection[str]) -> None:
        self.include_tags = set(include_tags) if include_tags else None
        self.exclude_tags = set(exclude_tags) if exclude_tags else None

    def __call__(self, test: wpttest.Test) -> bool:
        does_match = True
        if self.include_tags:
            does_match &= bool(test.tags & self.include_tags)
        if self.exclude_tags:
            does_match &= not (test.tags & self.exclude_tags)
        return does_match


class ManifestPathData(TypedDict):
    url_base: str
    tests_path: str
    metadata_path: str
    manifest_path: str


class ManifestLoader:
    def __init__(
        self,
        test_paths: TestPaths,
        force_manifest_update: bool = False,
        manifest_download: bool = False,
        types: Sequence[str] | None = None,
    ) -> None:
        do_delayed_imports()
        self.test_paths = test_paths
        self.force_manifest_update = force_manifest_update
        self.manifest_download = manifest_download
        self.types = types
        self.logger = structured.get_default_logger()
        if self.logger is None:
            self.logger = StructuredLogger("ManifestLoader")

    def load(self) -> TestManifests:
        rv = {}
        for url_base, test_root in self.test_paths.items():
            manifest_file = self.load_manifest(url_base, test_root)
            path_data: ManifestPathData = {
                "url_base": url_base,
                "tests_path": test_root.tests_path,
                "metadata_path": test_root.metadata_path,
                "manifest_path": test_root.manifest_path,
            }
            rv[manifest_file] = path_data
        return rv

    def load_manifest(self, url_base: str, test_root: TestRoot) -> manifest.Manifest:
        cache_root = os.path.join(test_root.metadata_path, ".cache")
        if self.manifest_download:
            download_from_github(test_root.manifest_path, test_root.tests_path)
        return manifest.load_and_update(test_root.tests_path, test_root.manifest_path, url_base,
                                        cache_root=cache_root, update=self.force_manifest_update,
                                        types=self.types)


def iterfilter(
    filters: Iterable[Callable[[Iterable[_T]], Iterable[_T]]],
    iter: Iterable[_T],
) -> Iterable[_T]:
    for f in filters:
        iter = f(iter)
    yield from iter


class TestLoader:
    """Loads tests according to a WPT manifest and any associated expectation files"""
    def __init__(
        self,
        test_manifests: TestManifests,
        test_types: Iterable[str],
        base_run_info: Mapping[str, object],
        subsuites: Mapping[str, Subsuite] | None = None,
        manifest_filters: Sequence[ManifestFilter] | None = None,
        test_filters: Sequence[WPTTestFilter] | None = None,
        chunk_type: str = "none",
        total_chunks: int = 1,
        chunk_number: int = 1,
        include_https: bool = True,
        include_h2: bool = True,
        include_webtransport_h3: bool | None = False,
        skip_timeout: bool = False,
        skip_crash: bool = False,
        skip_implementation_status: Sequence[str] | None = None,
        chunker_kwargs: Mapping[str, object] | None = None,
    ) -> None:

        self.test_types = test_types
        self.base_run_info = base_run_info
        self.subsuites = subsuites or {}

        self.manifest_filters = manifest_filters if manifest_filters is not None else []
        self.test_filters = test_filters if test_filters is not None else []

        self.manifests = test_manifests
        self.tests: Mapping[str, Mapping[str, Sequence[wpttest.Test]]] = {}
        self.disabled_tests: Mapping[str, Mapping[str, Sequence[wpttest.Test]]] = {}
        self.include_https = include_https
        self.include_h2 = include_h2
        self.include_webtransport_h3 = include_webtransport_h3
        self.skip_timeout = skip_timeout
        self.skip_crash = skip_crash
        self.skip_implementation_status = skip_implementation_status

        self.chunk_type = chunk_type
        self.total_chunks = total_chunks
        self.chunk_number = chunk_number

        if chunker_kwargs is None:
            chunker_kwargs = {}
        self.chunker: TestChunker = {"none": Unchunked,
                                     "hash": PathHashChunker,
                                     "id_hash": IDHashChunker,
                                     "dir_hash": DirectoryHashChunker}[chunk_type](total_chunks,
                                                                      chunk_number,
                                                                      **chunker_kwargs)

        self._test_ids: Sequence[str] | None = None

        self.directory_manifests: MutableMapping[str, manifestexpected.DirectoryManifest | None] = {}
        self._load_tests()

    @property
    def test_ids(self) -> Sequence[str]:
        if self._test_ids is None:
            test_ids = []
            for test_dict in [self.disabled_tests, self.tests]:
                for subsuite in self.subsuites:
                    for test_type in self.test_types:
                        test_ids += [item.id for item in test_dict[subsuite][test_type]]
            self._test_ids = test_ids
        return self._test_ids

    def get_test(
        self,
        manifest_file: manifest.Manifest,
        manifest_test: manifest_item.URLManifestItem,
        inherit_metadata: Sequence[manifestexpected.DirectoryManifest],
        test_metadata: manifestexpected.ExpectedManifest | None,
    ) -> wpttest.Test:
        if test_metadata is not None:
            inherited_metadata: Sequence[
                manifestexpected.DirectoryManifest | manifestexpected.ExpectedManifest
            ] = [*inherit_metadata, test_metadata]
            test_metadata = test_metadata.get_test(manifestupdate.get_test_name(manifest_test.id))  # type: ignore[no-untyped-call]
        else:
            inherited_metadata = inherit_metadata

        return cast(
            "wpttest.Test",
            wpttest.from_manifest(  # type: ignore[no-untyped-call]
                manifest_file, manifest_test, inherited_metadata, test_metadata
            ),
        )

    def load_dir_metadata(
        self,
        run_info: Mapping[str, object],
        test_manifest: manifest.Manifest,
        metadata_path: str,
        test_path: str,
    ) -> Sequence[manifestexpected.DirectoryManifest]:
        rv = []
        path_parts = os.path.dirname(test_path).split(os.path.sep)
        for i in range(len(path_parts) + 1):
            path = os.path.join(metadata_path, os.path.sep.join(path_parts[:i]), "__dir__.ini")
            if path not in self.directory_manifests:
                self.directory_manifests[path] = manifestexpected.get_dir_manifest(path,
                                                                                   run_info)
            manifest = self.directory_manifests[path]
            if manifest is not None:
                rv.append(manifest)
        return rv

    def load_metadata(
        self,
        run_info: Mapping[str, object],
        test_manifest: manifest.Manifest,
        metadata_path: str,
        test_path: str,
    ) -> tuple[
        Sequence[manifestexpected.DirectoryManifest],
        manifestexpected.ExpectedManifest | None,
    ]:
        inherit_metadata = self.load_dir_metadata(run_info, test_manifest, metadata_path, test_path)
        test_metadata = manifestexpected.get_manifest(
            metadata_path, test_path, run_info)
        return inherit_metadata, test_metadata

    def iter_tests(
        self, run_info: Mapping[str, object], manifest_filters: Iterable[ManifestFilter]
    ) -> Iterator[tuple[str, str, wpttest.Test]]:
        manifest_items: list[ManifestItertypesItem] = []
        manifests_by_url_base = {}

        for m in sorted(self.manifests.keys(), key=lambda x: x.url_base):
            manifest_iter = iterfilter(manifest_filters,
                                       cast('Iterator[ManifestItertypesItem]', m.itertypes(*self.test_types)))
            manifest_items.extend(manifest_iter)
            manifests_by_url_base[m.url_base] = m

        chunked_items = self.chunker(manifest_items)

        for test_type, test_path, tests in chunked_items:
            manifest_file = manifests_by_url_base[next(iter(tests)).url_base]
            metadata_path = self.manifests[manifest_file]["metadata_path"]

            inherit_metadata, test_metadata = self.load_metadata(run_info, manifest_file, metadata_path, test_path)
            for test in tests:
                wpt_test = self.get_test(manifest_file, test, inherit_metadata, test_metadata)
                if all(f(wpt_test) for f in self.test_filters):
                    yield test_path, test_type, wpt_test

    def _load_tests(self) -> None:
        """Read in the tests from the manifest file"""
        tests_enabled: dict[str, dict[str, list[wpttest.Test]]] = {}
        tests_disabled: dict[str, dict[str, list[wpttest.Test]]] = {}

        for subsuite_name, subsuite in self.subsuites.items():
            tests_enabled[subsuite_name] = defaultdict(list)
            tests_disabled[subsuite_name] = defaultdict(list)
            run_info = subsuite.run_info
            if not subsuite_name:
                manifest_filters = self.manifest_filters
            else:
                manifest_filters = subsuite.manifest_filters(self.manifests)
            for test_path, test_type, test in self.iter_tests(run_info, manifest_filters):
                enabled = not test.disabled()  # type: ignore[no-untyped-call]
                if not self.include_https and test.environment["protocol"] == "https":
                    enabled = False
                if not self.include_h2 and test.environment["protocol"] == "h2":
                    enabled = False
                if self.skip_timeout and test.expected() == "TIMEOUT":  # type: ignore[no-untyped-call]
                    enabled = False
                if self.skip_crash and test.expected() == "CRASH":  # type: ignore[no-untyped-call]
                    enabled = False
                if (
                    self.skip_implementation_status and
                    test.implementation_status() in self.skip_implementation_status  # type: ignore[no-untyped-call]
                ):
                    # for backlog, we want to run timeout/crash:
                    if not (
                        test.implementation_status() == "implementing" and  # type: ignore[no-untyped-call]
                        test.expected() in ["TIMEOUT", "CRASH"]  # type: ignore[no-untyped-call]
                    ):
                        enabled = False
                target = tests_enabled if enabled else tests_disabled
                target[subsuite_name][test_type].append(test)

        self.tests = tests_enabled
        self.disabled_tests = tests_disabled


def get_test_queue_builder(**kwargs: Any) -> tuple[TestQueueBuilder, Mapping[str, object]]:
    builder_kwargs = {"processes": kwargs["processes"],
                      "logger": kwargs["logger"]}
    chunker_kwargs = {}
    builder_cls: type[TestQueueBuilder]
    if kwargs["fully_parallel"]:
        builder_cls = FullyParallelGroupedSource
    elif kwargs["run_by_dir"] is not False:
        # A value of None indicates infinite depth
        builder_cls = PathGroupedSource
        builder_kwargs["depth"] = kwargs["run_by_dir"]
        chunker_kwargs["depth"] = kwargs["run_by_dir"]
    elif kwargs["test_groups"]:
        builder_cls = GroupFileTestSource
        builder_kwargs["test_groups"] = kwargs["test_groups"]
    else:
        builder_cls = SingleTestSource
    return builder_cls(**builder_kwargs), chunker_kwargs


class GroupMetadata(TypedDict):
    scope: str


class TestGroup(NamedTuple):
    group: deque[wpttest.Test]
    subsuite: str
    test_type: str
    metadata: GroupMetadata


class TestQueueBuilder(metaclass=ABCMeta):
    def __init__(self, *, logger: StructuredLogger, processes: int) -> None:
        """Class for building a queue of groups of tests to run.

        Each item in the queue is a TestGroup, which consists of an iterable of
        tests to run, the name of the subsuite, the name of the test type, and
        a dictionary containing group-specific metadata.

        Tests in the same group are run in the same TestRunner in the
        provided order."""
        self.logger = logger
        self.processes = processes

    def make_queue(self, tests_by_type: TestsByType) -> tuple[ReadQueue[TestGroup], int]:
        test_queue: WriteQueue[TestGroup] = WriteQueue()
        groups = self.make_groups(tests_by_type)
        processes = self.process_count(self.processes, len(groups))
        if processes > 1:
            groups = sorted(
                groups,
                key=lambda group: (
                    # Place groups of the same subsuite, test type together to
                    # minimize browser restarts.
                    group.subsuite,
                    group.test_type,
                    # Next, run larger groups first to avoid straggler runners. Use
                    # timeout to give slow tests greater relative weight.
                    (
                        sum(test.timeout for test in group.group)
                        if group.group is not None
                        else 0
                    ),
                ),
                reverse=True,
            )
        for item in groups:
            test_queue.put(item)

        return test_queue.to_read(), processes

    @abstractmethod
    def make_groups(self, tests_by_type: TestsByType) -> Sequence[TestGroup]:
        """Divide a given set of tests into groups that will be run together."""
        pass

    @abstractmethod
    def tests_by_group(self, tests_by_type: TestsByType) -> Mapping[str, Sequence[str]]:
        pass

    def group_metadata(self, state: Mapping[str, Any]) -> GroupMetadata:
        return {"scope": "/"}

    def process_count(self, requested_processes: int, num_test_groups: int) -> int:
        """Get the number of processes to use.

        This must always be at least one, but otherwise not more than the number of test groups"""
        return max(1, min(requested_processes, num_test_groups))


class SingleTestSource(TestQueueBuilder):
    def make_groups(self, tests_by_type: TestsByType) -> Sequence[TestGroup]:
        groups = []
        for (subsuite, test_type), tests in tests_by_type.items():
            processes = self.processes
            queues: list[deque[wpttest.Test]] = [deque([]) for _ in range(processes)]
            metadatas = [self.group_metadata({}) for _ in range(processes)]
            for test in tests:
                idx: int = hash(test.id) % processes
                group = queues[idx]
                metadata = metadatas[idx]
                group.append(test)
                test.update_metadata(metadata)  # type: ignore[no-untyped-call]

            for item in zip(queues,
                            itertools.repeat(subsuite),
                            itertools.repeat(test_type),
                            metadatas):
                if len(item[0]) > 0:
                    groups.append(TestGroup(*item))
        return groups

    def tests_by_group(self, tests_by_type: TestsByType) -> Mapping[str, Sequence[str]]:
        groups: MutableMapping[str, list[str]] = defaultdict(list)
        for (subsuite, test_type), tests in tests_by_type.items():
            group_name = f"{subsuite}:{self.group_metadata({})['scope']}"
            groups[group_name].extend(test.id for test in tests)
        return groups


class PathGroupedSource(TestQueueBuilder):
    def __init__(self, *, logger: StructuredLogger, processes: int, depth: bool | int | None = None, small_subsuite_size: int = 0) -> None:
        super().__init__(logger=logger, processes=processes)
        self.depth: int | None = None if depth is True or depth == 0 else depth
        self.small_subsuite_size = small_subsuite_size

    def new_group(self,
                  state: MutableMapping[str, object],
                  subsuite: str,
                  test_type: str,
                  test: wpttest.Test) -> bool:
        path = urlsplit(test.url).path.split("/")[1:-1][:self.depth]
        rv = (subsuite, test_type, path) != state.get("prev_group_key")
        state["prev_group_key"] = (subsuite, test_type, path)
        return rv

    def in_one_group(self,
                     subsuite: str,
                     tests: Sequence[wpttest.Test]) -> bool:
        return len(subsuite) > 0 and len(tests) <= self.small_subsuite_size

    def make_groups(self, tests_by_type: TestsByType) -> Sequence[TestGroup]:
        groups = []
        state: MutableMapping[str, Any] = {}
        for (subsuite, test_type), tests in tests_by_type.items():
            # For subsuites only have few tests, put them in one group so that
            # it will be picked up by one worker and only one restart will be
            # needed. Tests have a different test type will still be put into
            # different group though.
            in_one_group = self.in_one_group(subsuite, tests)
            if in_one_group:
                state["prev_group_key"] = (subsuite, test_type, [""])
                group_metadata = self.group_metadata(state)
                groups.append(TestGroup(deque(), subsuite, test_type, group_metadata))

            for test in tests:
                if not in_one_group and self.new_group(state, subsuite, test_type, test):
                    group_metadata = self.group_metadata(state)
                    groups.append(TestGroup(deque(), subsuite, test_type, group_metadata))
                group, _, _, metadata = groups[-1]
                assert group is not None
                group.append(test)
                test.update_metadata(metadata)  # type: ignore[no-untyped-call]
        return groups

    def tests_by_group(self, tests_by_type: TestsByType) -> Mapping[str, Sequence[str]]:
        groups = defaultdict(list)
        state: MutableMapping[str, Any] = {}
        for (subsuite, test_type), tests in tests_by_type.items():
            in_one_group = self.in_one_group(subsuite, tests)
            for test in tests:
                if not in_one_group and self.new_group(state, subsuite, test_type, test):
                    group = self.group_metadata(state)['scope']
                if in_one_group:
                    group_name = f"{subsuite}:/"
                elif subsuite:
                    group_name = f"{subsuite}:{group}"
                else:
                    group_name = group
                groups[group_name].append(test.id)
        return groups

    def group_metadata(self, state: Mapping[str, Any]) -> GroupMetadata:
        return {"scope": "/%s" % "/".join(state["prev_group_key"][2])}


class FullyParallelGroupedSource(PathGroupedSource):
    def in_one_group(self,
                     subsuite: str,
                     tests: Sequence[wpttest.Test]) -> bool:
        return False

    # Chuck every test into a different group, so that they can run
    # fully parallel with each other. Useful to run a lot of tests
    # clustered in a few directories.
    def new_group(self,
                  state: MutableMapping[str, object],
                  subsuite: str,
                  test_type: str,
                  test: wpttest.Test) -> bool:
        path = urlsplit(test.url).path.split("/")[1:-1]
        state["prev_group_key"] = (subsuite, test_type, path)
        return True


class GroupFileTestSource(TestQueueBuilder):
    def __init__(self, *, logger: StructuredLogger, processes: int, test_groups: TestGroups) -> None:
        super().__init__(logger=logger, processes=processes)
        self.test_groups = test_groups

    def make_groups(self, tests_by_type: TestsByType) -> Sequence[TestGroup]:
        groups = []
        for (subsuite, test_type), tests in tests_by_type.items():
            tests_by_group = self.tests_by_group({(subsuite, test_type): tests})
            ids_to_tests = {test.id: test for test in tests}
            for group_name, test_ids in tests_by_group.items():
                group_metadata: GroupMetadata = {"scope": group_name}
                group: deque[wpttest.Test] = deque()
                for test_id in test_ids:
                    test = ids_to_tests[test_id]
                    group.append(test)
                    test.update_metadata(group_metadata)  # type: ignore[no-untyped-call]
                groups.append(TestGroup(group, subsuite, test_type, group_metadata))
        return groups

    def tests_by_group(self, tests_by_type: TestsByType) -> Mapping[str, Sequence[str]]:
        tests_by_group = defaultdict(list)
        for (subsuite, test_type), tests in tests_by_type.items():
            for test in tests:
                try:
                    group = self.test_groups.group_by_test[(subsuite, test.id)]
                except KeyError:
                    print(f"{test.id} is missing from test groups file")
                    raise
                if subsuite:
                    group_name = f"{subsuite}:{group}"
                else:
                    group_name = group
                tests_by_group[group_name].append(test.id)

        return tests_by_group
