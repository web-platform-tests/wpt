import urlparse
from abc import ABCMeta, abstractmethod, abstractproperty

item_types = ["testharness", "reftest", "manual", "stub", "wdspec"]

class ManifestItem(object):
    __metaclass__ = ABCMeta

    item_type = None

    def __init__(self, path, manifest=None):
        self.manifest = manifest
        self.path = path

    @abstractmethod
    def key(self):
        pass

    def __eq__(self, other):
        if not hasattr(other, "key"):
            return False
        return self.key() == other.key()

    def __hash__(self):
        return hash(self.key())

    def to_json(self):
        return {"path": self.path}

    @classmethod
    def from_json(self, manifest, obj):
        raise NotImplementedError

    @abstractproperty
    def id(self):
        pass


class URLManifestItem(ManifestItem):
    def __init__(self, path, url, url_base="/", manifest=None):
        ManifestItem.__init__(self, path, manifest=manifest)
        self._url = url
        self.url_base = url_base

    @property
    def id(self):
        return self.url

    @property
    def url(self):
        return urlparse.urljoin(self.url_base, self._url)

    def key(self):
        return self.item_type, self.url

    def to_json(self):
        rv = ManifestItem.to_json(self)
        rv["url"] = self._url
        return rv

    @classmethod
    def from_json(cls, manifest, obj):
        return cls(obj["path"],
                   obj["url"],
                   url_base=manifest.url_base,
                   manifest=manifest)


class TestharnessTest(URLManifestItem):
    item_type = "testharness"

    def __init__(self, path, url, url_base="/", timeout=None, manifest=None):
        URLManifestItem.__init__(self, path, url, url_base=url_base, manifest=manifest)
        self.timeout = timeout

    def to_json(self):
        rv = URLManifestItem.to_json(self)
        if self.timeout is not None:
            rv["timeout"] = self.timeout
        return rv

    @classmethod
    def from_json(cls, manifest, obj):
        return cls(obj["path"],
                   obj["url"],
                   url_base=manifest.url_base,
                   timeout=obj.get("timeout"),
                   manifest = manifest)


class RefTest(URLManifestItem):
    item_type = "reftest"

    def __init__(self, path, url, references, url_base="/", timeout=None, is_reference=False,
                 manifest=None):
        URLManifestItem.__init__(self, path, url, url_base=url_base, manifest=manifest)
        for _, ref_type in references:
            if ref_type not in ["==", "!="]:
                raise ValueError, "Unrecognised ref_type %s" % ref_type
        self.references = tuple(references)
        self.timeout = timeout
        self.is_reference = is_reference

    @property
    def id(self):
        return self.url

    def key(self):
        return self.item_type, self.url

    def to_json(self):
        rv = URLManifestItem.to_json(self)
        rv["references"] = self.references
        if self.timeout is not None:
            rv["timeout"] = self.timeout
        return rv

    @classmethod
    def from_json(cls, manifest, obj):
        return cls(obj["path"],
                   obj["url"],
                   obj["references"],
                   url_base=manifest.url_base,
                   timeout=obj.get("timeout"),
                   manifest=manifest)


class ManualTest(URLManifestItem):
    item_type = "manual"

class Stub(URLManifestItem):
    item_type = "stub"

class WebdriverSpecTest(ManifestItem):
    item_type = "wdspec"

    @property
    def id(self):
        return self.path

    def key(self):
        return self.path

    @classmethod
    def from_json(cls, manifest, obj):
        return cls(obj["path"],
                   manifest=manifest)
