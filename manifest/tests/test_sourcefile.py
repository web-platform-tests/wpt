from ..sourcefile import SourceFile

def test_multi_global():
    s = SourceFile("/", "test.any.js", "/")
    assert s.name_is_multi_global
    assert not s.name_is_manual
    assert not s.name_is_reference
    assert not s.name_is_worker
