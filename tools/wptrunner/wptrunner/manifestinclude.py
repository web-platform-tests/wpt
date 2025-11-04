"""Manifest structure used to store paths that should be included in a test run.

The manifest is represented by a tree of IncludeManifest objects, the root
representing the file and each subnode representing a subdirectory that should
be included or excluded.
"""

from __future__ import annotations

import glob
import os
from typing import TYPE_CHECKING, Literal, MutableMapping, cast
from urllib.parse import urlparse, urlsplit

from .wptmanifest.backends import conditional
from .wptmanifest.backends.conditional import ManifestItem
from .wptmanifest.node import DataNode

if TYPE_CHECKING:
    import sys

    from tools.manifest.item import URLManifestItem

    from .testloader import TestManifests

    if sys.version_info >= (3, 11):
        from typing import Self
    else:
        from typing_extensions import Self


class IncludeManifest(ManifestItem):
    def __init__(self, node: DataNode) -> None:
        """Node in a tree structure representing the paths
        that should be included or excluded from the test run.

        :param node: AST Node corresponding to this Node.
        """
        super().__init__(node)  # type: ignore[no-untyped-call]
        self.child_map: MutableMapping[str, Self] = {}

    @classmethod
    def create(cls) -> Self:
        """Create an empty IncludeManifest tree"""
        node = DataNode(None)  # type: ignore[no-untyped-call]
        return cls(node)

    def set_defaults(self) -> None:
        if not self.has_key("skip"):  # type: ignore[no-untyped-call]
            self.set("skip", "False")  # type: ignore[no-untyped-call]

    def append(self, child: Self) -> None:
        super().append(child)  # type: ignore[no-untyped-call]
        self.child_map[child.name] = child
        assert len(self.child_map) == len(self.children)

    def include(self, test: URLManifestItem) -> bool:
        """Return a boolean indicating whether a particular test should be
        included in a test run, based on the IncludeManifest tree rooted on
        this object.

        :param test: The test object"""
        path_components = self._get_components(test.url)
        return self._include(test, path_components)

    def _include(self, test: URLManifestItem, path_components: list[str]) -> bool:
        if path_components:
            next_path_part = path_components.pop()
            if next_path_part in self.child_map:
                return self.child_map[next_path_part]._include(test, path_components)

        node = self
        while node:
            try:
                skip_value = self.get("skip", {"test_type": test.item_type})  # type: ignore[no-untyped-call]
                assert isinstance(skip_value, str)
                skip_value = skip_value.lower()
                assert skip_value in ("true", "false")
                return skip_value != "true"
            except KeyError:
                if node.parent is not None:
                    node = node.parent
                else:
                    # Include by default
                    return True

        raise RuntimeError("Unreachable")

    def _get_components(self, url: str) -> list[str]:
        rv = []
        url_parts = urlsplit(url)
        variant = ""
        if url_parts.query:
            variant += "?" + url_parts.query
        if url_parts.fragment:
            variant += "#" + url_parts.fragment
        if variant:
            rv.append(variant)
        rv.extend([item for item in reversed(url_parts.path.split("/")) if item])
        return rv

    def _add_rule(self, test_manifests: TestManifests, url: str, direction: Literal["include", "exclude"]) -> None:
        maybe_path = os.path.join(os.path.abspath(os.curdir), url)
        rest, last = os.path.split(maybe_path)
        fragment = query = None
        if "#" in last:
            last, fragment = last.rsplit("#", 1)
        if "?" in last:
            last, query = last.rsplit("?", 1)

        maybe_path = os.path.join(rest, last)
        paths = glob.glob(maybe_path)

        if paths:
            urls = []
            for path in paths:
                for manifest, data in test_manifests.items():
                    found = False
                    rel_path = os.path.relpath(path, data["tests_path"])
                    iterator = manifest.iterpath if os.path.isfile(path) else manifest.iterdir
                    for test in iterator(rel_path):
                        if not hasattr(test, "url"):
                            continue
                        url = test.url
                        if query or fragment:
                            parsed = urlparse(url)
                            if ((query and query != parsed.query) or
                                (fragment and fragment != parsed.fragment)):
                                continue
                        urls.append(url)
                        found = True
                    if found:
                        break
        else:
            urls = [url]

        assert direction in ("include", "exclude")

        for url in urls:
            components = self._get_components(url)

            node = self
            while components:
                component = components.pop()
                if component not in node.child_map:
                    new_node = IncludeManifest(DataNode(component))  # type: ignore[no-untyped-call]
                    node.append(new_node)
                    new_node.set("skip", node.get("skip", {}))  # type: ignore[no-untyped-call]

                node = node.child_map[component]

            skip = False if direction == "include" else True
            node.set("skip", str(skip))  # type: ignore[no-untyped-call]

    def add_include(self, test_manifests: TestManifests, url_prefix: str) -> None:
        """Add a rule indicating that tests under a url path
        should be included in test runs

        :param url_prefix: The url prefix to include
        """
        return self._add_rule(test_manifests, url_prefix, "include")

    def add_exclude(self, test_manifests: TestManifests, url_prefix: str) -> None:
        """Add a rule indicating that tests under a url path
        should be excluded from test runs

        :param url_prefix: The url prefix to exclude
        """
        return self._add_rule(test_manifests, url_prefix, "exclude")


def get_manifest(manifest_path: str) -> IncludeManifest:
    with open(manifest_path, "rb") as f:
        return cast("IncludeManifest", conditional.compile(f, data_cls_getter=lambda x, y: IncludeManifest))  # type: ignore[no-untyped-call]
