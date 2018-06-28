"""
A disjoint set implementation
"""

import array
import ctypes

try:
    # needed for mypy
    from typing import List, Dict, Iterable, Iterator, Optional, Set  # noqa: F401
except ImportError:
    pass

# figure out what array size we're going to use
_size_t_size = ctypes.sizeof(ctypes.c_size_t)

for _type, _typecode in (
    (ctypes.c_ubyte, "B"),
    (ctypes.c_ushort, "H"),
    (ctypes.c_uint, "I"),
    (ctypes.c_ulong, "L"),
    (ctypes.c_ulonglong, "Q")
):
    if ctypes.sizeof(_type) == _size_t_size:
        _array_typecode = _typecode
        break
else:
    # unlikely, but default to Q
    assert False, "some weird platform"
    _array_typecode = "Q"

# Py < 3.3 don't support Q, despite it being what we want on most 64-bit systems
if _array_typecode == "Q":
    try:
        array.array("Q")
    except ValueError:
        _array_typecode = "L"


class DisjointSet(object):
    """A disjoint set implementation

    Requires members to be hashable objects.

    This implements a disjoint set forest with the union by rank and path
    compression heuristics.

    :param iterable: initialize disjoint set from iterable's items
    """

    def __init__(self, iterable=None):
        # type: (Optional[Iterable]) -> None

        # the elements
        self._elements = []  # type: List[object]

        # dict mapping element -> index in elements
        self._idx = {}  # type: Dict[object, int]

        # parent of _elements[i] is stored in _parent[i]
        self._parent = array.array(_array_typecode)

        # size of the component - correct only for roots
        self._rank = array.array(_array_typecode)

        if iterable is None:
            iterable = []

        for el in iterable:
            self.add(el)

    def __repr__(self):
        # type: () -> str
        return '<DisjointSet: %r>' % self.get_disjoint_subsets()

    def __len__(self):
        # type: () -> int
        return len(self._elements)

    def __contains__(self, x):
        # type: (object) -> bool
        return x in self._idx

    def __iter__(self):
        # type: () -> Iterator
        return iter(self._elements)

    def add(self, x):
        # type: (object) -> None
        """Add an item to the disjoint set in a new singleton subset

        This is commonly known as MakeSet in the literature. If the item
        already exists in the disjoint set, this is a no-op.
        """

        if x in self:
            return

        new_idx = len(self)
        self._elements.append(x)
        assert self._elements[new_idx] is x
        self._idx[x] = new_idx
        self._parent.append(new_idx)
        self._rank.append(0)

    def find(self, x):
        # type: (object) -> object
        """Find the representative member of the subset x is a member of

        Raises ValueError is x is not in the set.
        """

        if x not in self._idx:
            raise KeyError('%r is not a member' % x)

        # path compression
        root = self._idx[x]
        while root != self._parent[root]:
            root = self._parent[root]

        idx = p = self._idx[x]
        while p != self._parent[p]:
            q = self._parent[p]
            self._parent[p] = root
            p = q

        # check we are compressed
        assert (self._parent[idx] == idx or
                self._parent[idx] == self._parent[self._parent[idx]])

        return self._elements[p]

    def union(self, x, y):
        # type: (object, object) -> None
        """Merge two subsets into one larger subset

        :param x: a member of the set
        :param y: a member of the set
        """

        x_idx = self._idx[x]
        y_idx = self._idx[y]

        if x_idx == y_idx:
            return

        x_rank = self._rank[x_idx]
        y_rank = self._rank[y_idx]

        if x_rank < y_rank:
            self._parent[x_idx] = y_idx
        else:
            self._parent[y_idx] = x_idx
            if x_rank == y_rank:
                self._rank[x_idx] = x_rank + 1

    def get_disjoint_subsets(self):
        # type: () -> Set[Set[object]]
        """Return a set of the disjoint subsets as Python frozensets"""

        # dict of root idx -> set
        sets = {}  # type: Dict[int, Set[object]]
        for i, v in enumerate(self._parent):
            if i != v:
                continue
            sets[i] = set()

        for element in self._elements:
            root = self._idx[self.find(element)]
            sets[root].add(element)

        # these are returned as frozensets because the child sets need to be hashable
        return {frozenset(x) for x in sets.values()}
