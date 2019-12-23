from .. import manifest, vcs

def test_vcs():
    m = manifest.Manifest()
    tree = vcs.get_tree(b"", m, b"", None)
    assert isinstance(tree, vcs.FileSystem) is True
