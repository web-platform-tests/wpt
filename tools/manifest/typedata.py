from collections import MutableMapping

from six import itervalues, iteritems

from . import manifest, item


MYPY = False
if MYPY:
    # MYPY is set to True when run under Mypy.
    from typing import Any, Optional, Dict, Text, Type, Tuple, Set, Iterable, Iterator, List, Union


class TypeData(MutableMapping):
    def __init__(self, manifest, type_cls):
        # type: (manifest.Manifest, Type[item.ManifestItem]) -> None
        """Dict-like object containing the TestItems for each test type.

        Loading an actual Item class for each test is unnecessarily
        slow, so this class allows lazy-loading of the test
        items. When the manifest is loaded we store the raw json
        corresponding to the test type, and only create an Item
        subclass when the test is accessed. In order to remain
        API-compatible with consumers that depend on getting an Item
        from iteration, we do egerly load all items when iterating
        over the class."""
        self._manifest = manifest
        self._type_cls = type_cls  # type: Type[item.ManifestItem]
        self._json_data = {}  # type: Dict[Text, Any]
        self._data = {}  # type: Dict[Text, Any]

    def _delete_node(self, data, key):
        # type: (Dict, Tuple[Text, ...]) -> None
        path = []
        node = data
        for pathseg in key[:-1]:
            path.append((node, pathseg))
            node = node[pathseg]

        del node[key[-1]]
        while path:
            node, pathseg = path.pop()
            if len(node[pathseg]) == 0:
                del node[pathseg]
            else:
                break

    def __getitem__(self, key):
        # type: (Tuple[Text, ...]) -> Set[item.ManifestItem]
        node = self._data  # type: Union[Dict[Text, Any], Set[item.ManifestItem], List[item.ManifestItem]]
        for pathseg in key:
            if isinstance(node, dict) and pathseg in node:
                node = node[pathseg]
            else:
                break
        else:
            if isinstance(node, set):
                return node
            else:
                raise KeyError, key

        node = self._json_data
        found = False
        for pathseg in key:
            if isinstance(node, dict) and pathseg in node:
                node = node[pathseg]
            else:
                break
        else:
            found = True

        if not found:
            raise KeyError, key

        if not isinstance(node, list):
            raise KeyError, key

        data = set()
        path = "/".join(key)
        for test in node:
            manifest_item = self._type_cls.from_json(self._manifest, path, test)
            data.add(manifest_item)

        node = self._data
        assert isinstance(node, dict)
        for pathseg in key[:-1]:
            node = node.setdefault(pathseg, {})
            assert isinstance(node, dict)
        assert key[-1] not in node
        node[key[-1]] = data

        self._delete_node(self._json_data, key)

        return data

    def __setitem__(self, key, value):
        # type: (Tuple[Text, ...], Set[item.ManifestItem]) -> None
        try:
            self._delete_node(self._json_data, key)
        except KeyError:
            pass

        node = self._data
        for pathseg in key[:-1]:
            node = node.setdefault(pathseg, {})
        node[key[-1]] = value

    def __delitem__(self, key):
        # type: (Tuple[Text, ...]) -> None
        raised = False

        try:
            self._delete_node(self._data, key)
        except KeyError:
            raised = True

        try:
            self._delete_node(self._json_data, key)
        except KeyError:
            raised = True

        if raised:
            raise KeyError(key)

    def __iter__(self):
        # type: () -> Iterator[Tuple[Text, ...]]
        stack = [(self._data, tuple())]  # type: List[Tuple[Union[Dict, Set, List], Tuple[Text, ...]]]
        while stack:
            node, path = stack.pop()
            if isinstance(node, set):
                yield path
            else:
                assert isinstance(node, dict)
                stack.extend((v, path + (k,)) for k, v in iteritems(node))

        stack = [(self._json_data, tuple())]
        while stack:
            node, path = stack.pop()
            if isinstance(node, list):
                yield path
            else:
                assert isinstance(node, dict)
                stack.extend((v, path + (k,)) for k, v in iteritems(node))

    def __len__(self):
        # type: () -> int
        count = 0

        stack = [self._data]
        while stack:
            v = stack.pop()
            if isinstance(v, set):
                count += 1
            else:
                stack.extend(itervalues(v))

        stack = [self._json_data]
        while stack:
            v = stack.pop()
            if isinstance(v, list):
                count += 1
            else:
                stack.extend(itervalues(v))

        return count

    def __nonzero__(self):
        # type: () -> bool
        return bool(self._data) or bool(self._json_data)

    __bool__ = __nonzero__

    def __contains__(self, key):
        # type: (Any) -> bool
        # we provide our own impl of this to avoid calling __getitem__ and generating items for
        # those in self._json_data
        node = self._data
        for pathseg in key:
            if pathseg in node:
                node = node[pathseg]
            else:
                break
        else:
            return bool(isinstance(node, set))

        node = self._json_data
        for pathseg in key:
            if pathseg in node:
                node = node[pathseg]
            else:
                break
        else:
            return bool(isinstance(node, list))

        return False

    def clear(self):
        # type: () -> None
        # much, much simpler/quicker than that defined in MutableMapping
        self._json_data = {}
        self._data = {}

    def to_json(self):
        # type: () -> Dict[Text, Any]
        json_rv = self._json_data

        stack = [(self._data, json_rv)]
        while stack:
            data_node, json_node = stack.pop()
            for k, v in iteritems(data_node):
                if isinstance(v, set):
                    json_node[k] = [t for t in sorted(test.to_json() for test in v)]
                else:
                    stack.append((v, json_node.setdefault(k, {})))

        return json_rv
