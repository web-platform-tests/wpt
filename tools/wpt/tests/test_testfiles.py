import mock
import pytest

from tools.wpt import testfiles

def get_get_git_cmd(rv_dict):
    def get_git_cmd(root):
        def git(*args):
            return rv_dict[args]
        return git
    return get_git_cmd


@pytest.mark.parametrize("environ,git_rv_dict,expected_rv", [
    ({"TRAVIS_PULL_REQUEST": "false", "TRAVIS_BRANCH": "master"},
     {("rev-parse", "HEAD"): "1a" * 20},
     "1a" * 20),
    ({"TRAVIS_PULL_REQUEST": "true", "TRAVIS_BRANCH": "foobar"},
     {("merge-base", "HEAD", "foobar"): "1a" * 20},
     "1a" * 20),
    ({},
     {("rev-parse", "HEAD"): "78978db3956ad3137784600bba20c8dcee6b638b",
      ("rev-parse", "--not", "--branches", "--remotes"): "^78978db3956ad3137784600bba20c8dcee6b638b",
      ("rev-list", "--topo-order", "--parents", "HEAD"):
      "78978db3956ad3137784600bba20c8dcee6b638b "
      "a4d5a787c59ca4176e70d665b5e335380077a29c\na4d5a787c59ca4176e70d665b5e335380077a29c"},
     "78978db3956ad3137784600bba20c8dcee6b638b"),
])
def test_branch_point(environ, git_rv_dict, expected_rv):
    with mock.patch.object(testfiles, "get_git_cmd", get_get_git_cmd(git_rv_dict)):
        with mock.patch.object(testfiles.os, "environ", environ):
            rv = testfiles.branch_point()
    assert expected_rv == rv
