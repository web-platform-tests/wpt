# mypy: allow-untyped-defs

"""Manifest structure used to store paths that should be included in a test run.

The manifest is represented by a tree of IncludeManifest objects, the root
representing the file and each subnode representing a subdirectory that should
be included or excluded.
"""
import glob
import os
from urllib.parse import urljoin, urlparse, urlsplit

from .wptmanifest.node import DataNode
from .wptmanifest.backends import conditional
from .wptmanifest.backends.conditional import ManifestItem


class IncludeManifest(ManifestItem):
    def __init__(self, node):
        """Node in a tree structure representing the paths
        that should be included or excluded from the test run.

        :param node: AST Node corresponding to this Node.
        """
        ManifestItem.__init__(self, node)
        self.child_map = {}

    @classmethod
    def create(cls):
        """Create an empty IncludeManifest tree"""
        node = DataNode(None)
        return cls(node)

    def set_defaults(self):
        if not self.has_key("skip"):
            self.set("skip", "False")

    def append(self, child):
        ManifestItem.append(self, child)
        self.child_map[child.name] = child
        assert len(self.child_map) == len(self.children)

    def include(self, test):
        """Return a boolean indicating whether a particular test should be
        included in a test run, based on the IncludeManifest tree rooted on
        this object.

        :param test: The test object"""
        path_components = self._get_components(test.url)
        return self._include(test, path_components)

    def _include(self, test, path_components):
        if path_components:
            next_path_part = path_components.pop()
            if next_path_part in self.child_map:
                return self.child_map[next_path_part]._include(test, path_components)

        node = self
        while node:
            try:
                skip_value = self.get("skip", {"test_type": test.item_type}).lower()
                assert skip_value in ("true", "false")
                return skip_value != "true"
            except KeyError:
                if node.parent is not None:
                    node = node.parent
                else:
                    # Include by default
                    return True

    def _get_components(self, url):
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


def resolve_pattern(test_manifests, pattern):
    maybe_path = os.path.join(os.path.abspath(os.curdir), pattern)
    rest, last = os.path.split(maybe_path)
    fragment = query = None
    if "#" in last:
        last, fragment = last.rsplit("#", 1)
    if "?" in last:
        last, query = last.rsplit("?", 1)

    maybe_path = os.path.join(rest, last)
    paths = glob.glob(maybe_path)

    urls = []
    if paths:
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
        # Make the path absolute. Note that we don't remove the fragment/query
        # so that the `pattern` can pick out an exact variant by not resolving
        # `Manifest.iter*` to anything.
        url_path = urljoin("/", pattern)
        for manifest in test_manifests:
            if url_path.startswith(manifest.url_base):
                rel_url_path = url_path[len(manifest.url_base):]
                if rel_url_path.startswith("/"):
                    rel_url_path = rel_url_path[len("/"):]
                # Turn the URL prefix into a relative path with system
                # separators, as `Manifest.iter*` expect.
                rel_sys_path = os.path.normpath(rel_url_path.replace("/", os.path.sep))
                urls.extend(item.id for item in manifest.iterdir(rel_sys_path))
                urls.extend(item.id for item in manifest.iterpath(rel_sys_path))
        if not urls:
            urls.append(pattern)
    # Normalize URL paths to start with `/`.
    return [urljoin("/", url) for url in sorted(set(urls))]


def get_manifest(manifest_path):
    with open(manifest_path, "rb") as f:
        return conditional.compile(f, data_cls_getter=lambda x, y: IncludeManifest)
