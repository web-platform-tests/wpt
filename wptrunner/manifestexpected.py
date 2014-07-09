from wptmanifest.backends import static
from wptmanifest.backends.static import ManifestItem

import expected


def data_cls_getter(output_node, visited_node):
    # visited_node is intentionally unused
    if output_node is None:
        return ExpectedManifest
    elif isinstance(output_node, ExpectedManifest):
        return TestNode
    elif isinstance(output_node, TestNode):
        return SubtestNode
    else:
        raise ValueError


class ExpectedManifest(ManifestItem):
    def __init__(self, name, test_path):
        if name is not None:
            raise ValueError("ExpectedManifest should represent the root node")
        if test_path is None:
            raise ValueError("ExpectedManifest requires a test path")
        ManifestItem.__init__(self, name)
        self.child_map = {}
        self.test_path = test_path

    def append(self, child):
        ManifestItem.append(self, child)
        self.child_map[child.id] = child
        assert len(self.child_map) == len(self.children)

    def _remove_child(self, child):
        del self.child_map[child.id]
        ManifestItem.remove_child(self, child)
        assert len(self.child_map) == len(self.children)

    def get_test(self, test_id):
        if test_id in self.child_map:
            return self.child_map[test_id]


class TestNode(ManifestItem):
    def __init__(self, name):
        assert name is not None
        ManifestItem.__init__(self, name)
        self.updated_expected = []
        self.new_expected = []
        self.subtests = {}
        self.default_status = None
        self._from_file = True

    @property
    def is_empty(self):
        required_keys = set(["type"])
        if self.test_type == "reftest":
            required_keys |= set(["reftype", "refurl"])
        if set(self._data.keys()) != required_keys:
            return False
        return all(child.is_empty for child in self.children)

    @property
    def test_type(self):
        return self.get("type")

    @property
    def id(self):
        components = self.parent.test_path.split("/")[:-1]
        components.append(self.name)
        url = "/" + "/".join(components)
        if self.test_type == "reftest":
            return (url, self.get("reftype"), self.get("refurl"))
        else:
            return url

    def disabled(self):
        try:
            return self.get("disabled")
        except KeyError:
            return False

    def append(self, node):
        child = ManifestItem.append(self, node)
        self.subtests[child.name] = child

    def get_subtest(self, name):
        if name in self.subtests:
            return self.subtests[name]
        return None


class SubtestNode(TestNode):
    def __init__(self, name):
        TestNode.__init__(self, name)

    @property
    def is_empty(self):
        if self._data:
            return False
        return True


def get_manifest(metadata_root, test_path, run_info):
    manifest_path = expected.expected_path(metadata_root, test_path)
    try:
        with open(manifest_path) as f:
            return static.compile(f, run_info,
                                  data_cls_getter=data_cls_getter,
                                  test_path=test_path)
    except IOError:
        return None
