import pytest

from ..disjointset import DisjointSet

def test_init_noarg():
    s = DisjointSet()
    assert len(s) == 0
    assert list(s) == []

def test_basic_find():
    init = [1, 2, 3, 4]

    s = DisjointSet(init)
    assert len(s) == len(init)
    assert list(s) == init

    for x in init:
        assert s.find(x) == x

def test_unknown_find():
    s = DisjointSet()
    with pytest.raises(KeyError):
        s.find(10)

def test_basic_unionfind():
    s = DisjointSet([1, 2, 3])
    s.union(1, 2)
    assert s.find(1) == s.find(2)
    assert s.find(1) in (1, 2)
    assert s.find(3) == 3

@pytest.mark.parametrize("init", (
    [],
    [1],
    [2],
    [3],
))
def test_unknown_union(init):
    s = DisjointSet(init)
    with pytest.raises(KeyError):
        s.union(1, 2)

def test_multiple_unions():
    s = DisjointSet(range(10))
    s.union(1, 2)
    s.union(2, 3)
    s.union(3, 4)
    s.union(4, 5)
    assert s.find(4) == s.find(5)  # this appears first to trigger path compression from the deepest point
    assert s.find(1) == s.find(2)
    assert s.find(2) == s.find(3)
    assert s.find(3) == s.find(4)
    assert s.find(6) == 6

def test_get_disjoint_subsets():
    s = DisjointSet(range(10))
    s.union(1, 2)
    s.union(8, 9)
    assert s.get_disjoint_subsets() == {
        frozenset([0]),
        frozenset([1, 2]),
        frozenset([3]),
        frozenset([4]),
        frozenset([5]),
        frozenset([6]),
        frozenset([7]),
        frozenset([8, 9]),
    }
