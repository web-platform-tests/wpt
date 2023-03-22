from __future__ import annotations

import os.path
from inspect import isabstract
from urllib.parse import urljoin, urlparse, parse_qs
from abc import ABCMeta, abstractproperty

from .utils import to_os_path

MYPY = False
if MYPY:
    # MYPY is set to True when run under Mypy.
    from typing import Any, Dict, Hashable, List, Optional, Sequence, Text, Tuple, Type, Union, cast
    from .manifest import Manifest
    Fuzzy = Dict[Optional[Tuple[str, str, str]], List[int]]
    PageRanges = Dict[str, List[int]]

item_types: dict[str, type[ManifestItem]] = {}


class ManifestItemMeta(ABCMeta):
    """Custom metaclass that registers all the subclasses in the
    item_types dictionary according to the value of their item_type
    attribute, and otherwise behaves like an ABCMeta."""

    def __new__(cls: type[ManifestItemMeta], name: str, bases: tuple[type], attrs: dict[str, Any]) -> ManifestItemMeta:
        inst = super().__new__(cls, name, bases, attrs)
        if isabstract(inst):
            return inst

        assert issubclass(inst, ManifestItem)
        if MYPY:
            item_type = cast(str, inst.item_type)
        else:
            assert isinstance(inst.item_type, str)
            item_type = inst.item_type

        item_types[item_type] = inst

        return inst


class ManifestItem(metaclass=ManifestItemMeta):
    __slots__ = ("_tests_root", "path")

    def __init__(self, tests_root: str, path: str) -> None:
        self._tests_root = tests_root
        self.path = path

    @abstractproperty
    def id(self) -> str:
        """The test's id (usually its url)"""
        pass

    @abstractproperty
    def item_type(self) -> str:
        """The item's type"""
        pass

    @property
    def path_parts(self) -> tuple[str, ...]:
        return tuple(self.path.split(os.path.sep))

    def key(self) -> Hashable:
        """A unique identifier for the test"""
        return (self.item_type, self.id)

    def __eq__(self, other: Any) -> bool:
        if not hasattr(other, "key"):
            return False
        return bool(self.key() == other.key())

    def __hash__(self) -> int:
        return hash(self.key())

    def __repr__(self) -> str:
        return f"<{self.__module__}.{self.__class__.__name__} id={self.id!r}, path={self.path!r}>"

    def to_json(self) -> tuple[Any, ...]:
        return ()

    @classmethod
    def from_json(cls,
                  manifest: Manifest,
                  path: str,
                  obj: Any
                  ) -> ManifestItem:
        path = to_os_path(path)
        tests_root = manifest.tests_root
        assert tests_root is not None
        return cls(tests_root, path)


class URLManifestItem(ManifestItem):
    __slots__ = ("url_base", "_url", "_extras", "_flags")

    def __init__(self,
                 tests_root: str,
                 path: str,
                 url_base: str,
                 url: str | None,
                 **extras: Any
                 ) -> None:
        super().__init__(tests_root, path)
        assert url_base[0] == "/"
        self.url_base = url_base
        assert url is None or url[0] != "/"
        self._url = url
        self._extras = extras
        parsed_url = urlparse(self.url)
        self._flags = (set(parsed_url.path.rsplit("/", 1)[1].split(".")[1:-1]) |
                       set(parse_qs(parsed_url.query).get("wpt_flags", [])))

    @property
    def id(self) -> str:
        return self.url

    @property
    def url(self) -> str:
        rel_url = self._url or self.path.replace(os.path.sep, "/")
        # we can outperform urljoin, because we know we just have path relative URLs
        if self.url_base == "/":
            return "/" + rel_url
        return urljoin(self.url_base, rel_url)

    @property
    def https(self) -> bool:
        return "https" in self._flags or "serviceworker" in self._flags or "serviceworker-module" in self._flags

    @property
    def h2(self) -> bool:
        return "h2" in self._flags

    @property
    def subdomain(self) -> bool:
        # Note: this is currently hard-coded to check for `www`, rather than
        # all possible valid subdomains. It can be extended if needed.
        return "www" in self._flags

    def to_json(self) -> tuple[str | None, dict[Any, Any]]:
        rel_url = None if self._url == self.path.replace(os.path.sep, "/") else self._url
        rv: tuple[str | None, dict[Any, Any]] = (rel_url, {})
        return rv

    @classmethod
    def from_json(cls,
                  manifest: Manifest,
                  path: str,
                  obj: tuple[str, dict[Any, Any]]
                  ) -> URLManifestItem:
        path = to_os_path(path)
        url, extras = obj
        tests_root = manifest.tests_root
        assert tests_root is not None
        return cls(tests_root,
                   path,
                   manifest.url_base,
                   url,
                   **extras)


class TestharnessTest(URLManifestItem):
    __slots__ = ()

    item_type = "testharness"

    @property
    def timeout(self) -> str | None:
        return self._extras.get("timeout")

    @property
    def pac(self) -> str | None:
        return self._extras.get("pac")

    @property
    def testdriver(self) -> str | None:
        return self._extras.get("testdriver")

    @property
    def jsshell(self) -> str | None:
        return self._extras.get("jsshell")

    @property
    def script_metadata(self) -> list[tuple[str, str]] | None:
        return self._extras.get("script_metadata")

    def to_json(self) -> tuple[str | None, dict[str, Any]]:
        rv = super().to_json()
        if self.timeout is not None:
            rv[-1]["timeout"] = self.timeout
        if self.pac is not None:
            rv[-1]["pac"] = self.pac
        if self.testdriver:
            rv[-1]["testdriver"] = self.testdriver
        if self.jsshell:
            rv[-1]["jsshell"] = True
        if self.script_metadata:
            rv[-1]["script_metadata"] = [(k, v) for (k,v) in self.script_metadata]
        return rv


class RefTest(URLManifestItem):
    __slots__ = ("references",)

    item_type = "reftest"

    def __init__(self,
                 tests_root: str,
                 path: str,
                 url_base: str,
                 url: str | None,
                 references: list[tuple[str, str]] | None = None,
                 **extras: Any
                 ):
        super().__init__(tests_root, path, url_base, url, **extras)
        if references is None:
            self.references: list[tuple[str, str]] = []
        else:
            self.references = references

    @property
    def timeout(self) -> str | None:
        return self._extras.get("timeout")

    @property
    def viewport_size(self) -> str | None:
        return self._extras.get("viewport_size")

    @property
    def dpi(self) -> str | None:
        return self._extras.get("dpi")

    @property
    def fuzzy(self) -> Fuzzy:
        fuzzy: Fuzzy | list[tuple[Sequence[str] | None, list[int]]] = self._extras.get("fuzzy", {})
        if not isinstance(fuzzy, list):
            return fuzzy

        rv: Fuzzy = {}
        k: Sequence[str] | None
        v: list[int]
        for k, v in fuzzy:
            if k is None:
                key: tuple[str, str, str] | None = None
            else:
                # mypy types this as Tuple[Text, ...]
                assert len(k) == 3
                key = tuple(k)  # type: ignore
            rv[key] = v
        return rv

    def to_json(self) -> tuple[str | None, list[tuple[str, str]], dict[str, Any]]:  # type: ignore
        rel_url = None if self._url == self.path else self._url
        rv: tuple[str | None, list[tuple[str, str]], dict[str, Any]] = (rel_url, self.references, {})
        extras = rv[-1]
        if self.timeout is not None:
            extras["timeout"] = self.timeout
        if self.viewport_size is not None:
            extras["viewport_size"] = self.viewport_size
        if self.dpi is not None:
            extras["dpi"] = self.dpi
        if self.fuzzy:
            extras["fuzzy"] = list(self.fuzzy.items())
        return rv

    @classmethod
    def from_json(cls,  # type: ignore
                  manifest: Manifest,
                  path: str,
                  obj: tuple[str, list[tuple[str, str]], dict[Any, Any]]
                  ) -> RefTest:
        tests_root = manifest.tests_root
        assert tests_root is not None
        path = to_os_path(path)
        url, references, extras = obj
        return cls(tests_root,
                   path,
                   manifest.url_base,
                   url,
                   references,
                   **extras)


class PrintRefTest(RefTest):
    __slots__ = ("references",)

    item_type = "print-reftest"

    @property
    def page_ranges(self) -> PageRanges:
        return self._extras.get("page_ranges", {})

    def to_json(self):  # type: ignore
        rv = super().to_json()
        if self.page_ranges:
            rv[-1]["page_ranges"] = self.page_ranges
        return rv


class ManualTest(URLManifestItem):
    __slots__ = ()

    item_type = "manual"


class ConformanceCheckerTest(URLManifestItem):
    __slots__ = ()

    item_type = "conformancechecker"


class VisualTest(URLManifestItem):
    __slots__ = ()

    item_type = "visual"


class CrashTest(URLManifestItem):
    __slots__ = ()

    item_type = "crashtest"

    @property
    def timeout(self) -> str | None:
        return None


class WebDriverSpecTest(URLManifestItem):
    __slots__ = ()

    item_type = "wdspec"

    @property
    def timeout(self) -> str | None:
        return self._extras.get("timeout")

    def to_json(self) -> tuple[str | None, dict[str, Any]]:
        rv = super().to_json()
        if self.timeout is not None:
            rv[-1]["timeout"] = self.timeout
        return rv


class SupportFile(ManifestItem):
    __slots__ = ()

    item_type = "support"

    @property
    def id(self) -> str:
        return self.path
