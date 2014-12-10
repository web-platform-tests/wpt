# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import cPickle as pickle
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import traceback
import uuid

from mozlog.structured import structuredlog, commandline

import config
import vcs
from vcs import git, hg
import metadata
import testloader
import wptcommandline

manifest = None
logger = None

here = os.path.abspath(os.path.split(__file__)[0])

bsd_license = """W3C 3-clause BSD License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

* Redistributions of works must retain the original copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the original copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.

* Neither the name of the W3C nor the names of its contributors may be
  used to endorse or promote products derived from this work without
  specific prior written permission.


THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
"""


def do_delayed_imports(serve_root):
    global manifest
    sys.path.insert(0, os.path.join(serve_root, "tools", "scripts"))
    import manifest


def remove_logging_args(args):
    for name in args.keys():
        if name.startswith("log_"):
            args.pop(name)


def setup_logging(args, defaults):
    global logger
    logger = commandline.setup_logging("web-platform-tests-update", args, defaults)

    remove_logging_args(args)

    return logger


def copy_wpt_tree(tree, dest):
    if os.path.exists(dest):
        assert os.path.isdir(dest)

    for sub_path in os.listdir(dest):
        path = os.path.join(dest, sub_path)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)

    for tree_path in tree.paths():
        source_path = os.path.join(tree.root, tree_path)
        dest_path = os.path.join(dest, tree_path)

        dest_dir = os.path.split(dest_path)[0]
        if not os.path.isdir(source_path):
            if not os.path.exists(dest_dir):
                os.makedirs(dest_dir)
            shutil.copy2(source_path, dest_path)

    for source, destination in [("testharness_runner.html", ""),
                                ("testharnessreport.js", "resources/")]:
        source_path = os.path.join(here, source)
        dest_path = os.path.join(dest, destination, os.path.split(source)[1])
        shutil.copy2(source_path, dest_path)

    add_license(dest)


def add_license(dest):
    with open(os.path.join(dest, "LICENSE"), "w") as f:
        f.write(bsd_license)


def get_unique_name(existing, initial):
    logger.debug(existing)
    logger.debug(initial)
    if initial not in existing:
        return initial
    for i in xrange(len(existing) + 1):
        test = "%s_%s" % (initial, i + 1)
        if test not in existing:
            return test
    assert False

class NoVCSTree(object):
    name = "non-vcs"

    def __init__(self, root=None):
        if root is None:
            root = os.path.abspath(os.curdir)
        self.root = root

    @classmethod
    def is_type(cls, path=None):
        return True

    @property
    def is_clean(self):
        return True

    def add_new(self, prefix=None):
        pass

    def create_patch(self, patch_name, message):
        pass

    def update_patch(self, include=None):
        pass

    def commit_patch(self):
        pass


class HgTree(object):
    name = "mercurial"

    def __init__(self, root=None):
        if root is None:
            root = hg("root").strip()
        self.root = root
        self.hg = vcs.bind_to_repo(hg, self.root)

    def __getstate__(self):
        rv = self.__dict__.copy()
        del rv['hg']
        return rv

    def __setstate__(self, dict):
        self.__dict__.update(dict)
        self.hg = vcs.bind_to_repo(vcs.hg, self.root)

    @classmethod
    def is_type(cls, path=None):
        kwargs = {"log_error": False}
        if path is not None:
            kwargs["repo"] = path
        try:
            hg("root", **kwargs)
        except:
            return False
        return True

    @property
    def is_clean(self):
        return self.hg("status").strip() == ""

    def add_new(self, prefix=None):
        if prefix is not None:
            args = ("-I", prefix)
        else:
            args = ()
        self.hg("add", *args)

    def create_patch(self, patch_name, message):
        try:
            self.hg("qinit", log_error=False)
        except subprocess.CalledProcessError:
            pass

        patch_names = [item.strip() for item in self.hg("qseries").split("\n") if item.strip()]

        suffix = 0
        test_name = patch_name
        while test_name in patch_names:
            suffix += 1
            test_name = "%s-%i" % (patch_name, suffix)

        self.hg("qnew", test_name, "-X", self.root, "-m", message)

    def update_patch(self, include=None):
        if include is not None:
            args = []
            for item in include:
                args.extend(["-I", item])
        else:
            args = ()

        self.hg("qrefresh", *args)

    def commit_patch(self):
        self.hg("qfinish", repo=self.repo_root)


class GitTree(object):
    name = "git"

    def __init__(self, root=None):
        if root is None:
            root = git("rev-parse", "--show-toplevel").strip()
        self.root = root
        self.git = vcs.bind_to_repo(git, self.root)
        self.message = None

    def __getstate__(self):
        rv = self.__dict__.copy()
        del rv['git']
        return rv

    def __setstate__(self, dict):
        self.__dict__.update(dict)
        self.git = vcs.bind_to_repo(vcs.git, self.root)

    @classmethod
    def is_type(cls, path=None):
        kwargs = {"log_error": False}
        if path is not None:
            kwargs["repo"] = path
        try:
            git("rev-parse", "--show-toplevel", **kwargs)
        except:
            return False
        return True

    @property
    def rev(self):
        """Current HEAD revision"""
        if vcs.is_git_root(self.root):
            return self.git("rev-parse", "HEAD").strip()
        else:
            return None

    @property
    def is_clean(self):
        return self.git("status").strip() == ""

    def add_new(self, prefix=None):
        """Add files to the staging area.

        :param prefix: None to include all files or a path prefix to
                       add all files under that path.
        """
        if prefix is None:
            args = ("-a",)
        else:
            args = ("--no-ignore-removal", prefix)
        self.git("add", *args)

    def create_patch(self, patch_name, message):
        # In git a patch is actually a commit
        self.message = message

    def update_patch(self, include=None):
        """Commit the staged changes, or changes to listed files.

        :param include: Either None, to commit staged changes, or a list
                        of filenames (which must already be in the repo)
                        to commit
        """
        assert self.message is not None

        if include is not None:
            args = tuple(include)
        else:
            args = ()

        self.git("commit", "-m", self.message, *args)

    def commit_patch(self):
        pass

    def init(self):
        self.git("init")
        assert vcs.is_git_root(self.root)

    def checkout(self, rev, branch=None, force=False):
        """Checkout a particular revision, optionally into a named branch.

        :param rev: Revision identifier (e.g. SHA1) to checkout
        :param branch: Branch name to use
        :param force: Force-checkout
        """
        args = []
        if branch:
            branches = [ref[len("refs/heads/"):] for sha1, ref in self.list_refs()
                        if ref.startswith("refs/heads/")]
            branch = get_unique_name(branches, branch)

            args += ["-b", branch]

        if force:
            args.append("-f")
        args.append(rev)
        self.git("checkout", *args)

    def update(self, remote, remote_branch, local_branch):
        """Fetch from the remote and checkout into a local branch.

        :param remote: URL to the remote repository
        :param remote_branch: Branch on the remote repository to check out
        :param local_branch: Local branch name to check out into
        """
        if not vcs.is_git_root(self.root):
            self.init()
        self.git("clean", "-xdf")
        self.git("fetch", remote, "%s:%s" % (remote_branch, local_branch))
        self.checkout(local_branch)
        self.git("submodule", "update", "--init", "--recursive")

    def clean(self):
        self.git("checkout", self.rev)
        self.git("branch", "-D", self.local_branch)

    def paths(self):
        """List paths in the tree"""
        repo_paths = [self.root] +  [os.path.join(self.root, path)
                                     for path in self.submodules()]

        rv = []

        for repo_path in repo_paths:
            paths = vcs.git("ls-tree", "-r", "--name-only", "HEAD", repo=repo_path).split("\n")
            rel_path = os.path.relpath(repo_path, self.root)
            rv.extend([os.path.join(rel_path, item.strip()) for item in paths if item.strip()])

        return rv

    def submodules(self):
        """List submodule directories"""
        output = self.git("submodule", "status", "--recursive")
        rv = []
        for line in output.split("\n"):
            line = line.strip()
            if not line:
                continue
            parts = line.split(" ")
            rv.append(parts[1])
        return rv

class CommitMessage(object):
    def __init__(self, text):
        self.text = text
        self._parse_message()

    def __str__(self):
        return self.text

    def _parse_message(self):
        lines = self.text.split("\n")
        self.full_summary = lines[0]
        self.body = "\n".join(lines[1:])


class Commit(object):
    msg_cls = CommitMessage

    _sha1_re = re.compile("^[0-9a-f]{40}$")

    def __init__(self, tree, sha1):
        """Object representing a commit in a specific GitTree.

        :param tree: GitTree to which this commit belongs.
        :param sha1: Full sha1 string for the commit
        """
        assert self._sha1_re.match(sha1)

        self.tree = tree
        self.git = tree.git
        self.sha1 = sha1
        self.author, self.email, self.message = self._get_meta()

    def __getstate__(self):
        rv = self.__dict__.copy()
        del rv['git']
        return rv

    def __setstate__(self, dict):
        self.__dict__.update(dict)
        self.git = self.tree.git

    def _get_meta(self):
        author, email, message = self.git("show", "-s", "--format=format:%an\n%ae\n%B", self.sha1).split("\n", 2)
        return author, email, self.msg_cls(message)


class Step(object):
    provides = []

    def run(self, step_index, state):
        """Base class for state-creating steps.

        When a Step is run() the current state is checked to see
        if the state from this step has already been created. If it
        has the restore() method is invoked. Otherwise the create()
        method is invoked with the state object. This is expected to
        add items with all the keys in __class__.provides to the state
        object.
        """

        name = self.__class__.__name__

        try:
            stored_step = state.steps[step_index]
        except IndexError:
            stored_step = None

        if stored_step == name:
            self.restore(state)
        elif stored_step is None:
            self.create(state)
            assert set(self.provides).issubset(set(state.keys()))
            state.steps = state.steps + [name]
        else:
            raise ValueError("Expected a %s step, got a %s step" % (self.__class__.__name__, stored_step))

    def create(self, data):
        raise NotImplementedError

    def restore(self, state):
        logger.debug("Using stored state")
        for key in self.provides:
            assert key in state


exit_unclean = object()
exit_clean = object()

class StepRunner(object):
    steps = []

    def __init__(self, state):
        """Class that runs a specified series of Steps with a common State"""
        self.state = state
        if "steps" not in state:
            state.steps = []

    def run(self):
        rv = None
        for step_index, step in enumerate(self.steps):
            logger.debug("Starting step %s" % step.__name__)
            rv = step().run(step_index, self.state)
            if rv in (exit_clean, exit_unclean):
                break

        if rv in (exit_clean, None):
            self.state.clear()

        return rv

class State(object):
    fn = os.path.join(here, ".wpt-update.lock")

    def __new__(cls, parent=None):
        if parent is None:
            rv = cls.load()
            if rv is not None:
                logger.debug("Existing state found")
                return rv
            else:
                logger.debug("No existing state found")

        return object.__new__(cls, parent)

    def __init__(self, parent=None):
        """Object containing state variables created when running Steps.

        On write the state is serialized to disk, such that it can be restored in
        the event that the program is interrupted before all steps are complete.
        Note that this only works well if the values are immutable; mutating an
        existing value will not cause the data to be serialized.

        Variables are set and get as attributes i.e. state_obj.spam = "eggs".

        :param parent: Parent State object or None if this is the root object.
        """

        if hasattr(self, "_data"):
            return

        self._parent = parent
        self._children = {}
        self._data = {}

    @classmethod
    def load(cls):
        """Load saved state from a file"""
        try:
            with open(cls.fn) as f:
                try:
                    rv = pickle.load(f)
                    logger.debug("Loading data %r" % (rv._data,))
                    return rv
                except EOFError:
                    logger.warning("Found empty state file")
        except IOError:
            logger.debug("IOError")
            return

    def substate(self, name, init_values):
        """Create a new state object with this as the parent.

        :parm name: Name of the new state object
        :param init_values: List of variable names in the current state to copy
                            into the substate."""

        if name not in self._children:
            new_state = State(parent=self)
            for key in init_values:
                setattr(new_state, key, self._data[key])
            self._children[name] = new_state
        return self._children[name]

    def remove_substate(self, name):
        """Remove a named substate"""
        del self._children[name]

    def save(self):
        """Write the state to disk"""
        if self._parent:
            self._parent.save()
        else:
            with open(self.fn, "w") as f:
                pickle.dump(self, f)

    def is_empty(self):
        return self._data == {} and self._children == {}

    def clear(self):
        """Remove all state and delete the stored copy."""
        if self._parent is None:
            try:
                os.unlink(self.fn)
            except OSError:
                pass
        else:
            self._data = {}
            self._parent.save()

    def __setattr__(self, key, value):
        if key.startswith("_"):
            object.__setattr__(self, key, value)
        else:
            self._data[key] = value
            self.save()

    def __getattr__(self, key):
        if key.startswith("_"):
            raise AttributeError
        try:
            return self._data[key]
        except KeyError:
            raise AttributeError

    def __contains__(self, key):
        return key in self._data

    def update(self, items):
        """Add a dictionary of {name: value} pairs to the state"""
        self._data.update(items)
        self.save()

    def keys(self):
        return self._data.keys()

class LoadConfig(Step):
    """Step for loading configuration from the ini file and kwargs."""

    provides = ["sync", "paths", "metadata_path", "tests_path"]

    def create(self, state):
        state.sync = {"remote_url": state.kwargs["remote_url"],
                      "branch": state.kwargs["branch"],
                      "path": state.kwargs["sync_path"]}

        state.paths = state.kwargs["test_paths"]
        state.tests_path = state.paths["/"]["tests_path"]
        state.metadata_path = state.paths["/"]["metadata_path"]

        assert state.tests_path.startswith("/")

class LoadTrees(Step):
    """Step for creating a Tree for the local copy and a GitTree for the
    upstream sync."""

    provides = ["local_tree", "sync_tree"]

    def create(self, state):
        if os.path.exists(state.sync["path"]):
            sync_tree = GitTree(root=state.sync["path"])
        else:
            sync_tree = None

        if GitTree.is_type():
            local_tree = GitTree()
        elif HgTree.is_type():
            local_tree = HgTree()
        else:
            local_tree = NoVCSTree()

        state.update({"local_tree": local_tree,
                      "sync_tree": sync_tree})


class SyncFromUpstream(Step):
    """Step that synchronises a local copy of the code with upstream."""

    def create(self, state):
        if not state.kwargs["sync"]:
            return

        if not state.sync_tree:
            os.mkdir(state.sync["path"])
            state.sync_tree = GitTree(root=state.sync["path"])

        substate = state.substate("from_upstream",
                                  ["sync", "paths", "metadata_path", "tests_path", "local_tree", "sync_tree"])
        substate.target_rev = state.kwargs["rev"]
        runner = SyncFromUpstreamRunner(substate)
        runner.run()
        state.remove_substate("from_upstream")


class UpdateCheckout(Step):
    """Pull changes from upstream into the local sync tree."""

    provides = ["local_branch"]

    def create(self, state):
        sync_tree = state.sync_tree
        state.local_branch = uuid.uuid4().hex
        sync_tree.update(state.sync["remote_url"],
                         state.sync["branch"],
                         state.local_branch)


class GetSyncTargetCommit(Step):
    """Find the commit that we will sync to."""

    provides = ["sync_commit"]

    def create(self, state):
        if state.target_rev is None:
            #Use upstream branch HEAD as the base commit
            state.sync_commit = state.sync_tree.get_remote_sha1(state.sync["remote_url"],
                                                                state.sync["branch"])
        else:
            state.sync_commit = Commit(sync_tree, state.rev)

        state.sync_tree.checkout(state.sync_commit.sha1, state.local_branch, force=True)
        logger.debug("New base commit is %s" % state.sync_commit.sha1)


class LoadManifest(Step):
    """Load the test manifest"""

    provides = ["test_manifest"]

    def create(self, state):
        state.test_manifest = testloader.ManifestLoader(state.tests_path).load_manifest(
            state.tests_path, state.metadata_path,
        )


class UpdateManifest(Step):
    """Update the manifest to match the tests in the sync tree checkout"""

    provides = ["initial_rev"]
    def create(self, state):
        test_manifest = state.test_manifest
        state.initial_rev = test_manifest.rev
        manifest.update(state.sync["path"], "/", test_manifest)
        manifest.write(test_manifest, os.path.join(state.metadata_path, "MANIFEST.json"))


class CopyWorkTree(Step):
    """Copy the sync tree over to the destination in the local tree"""

    def create(self, state):
        copy_wpt_tree(state.sync_tree,
                      state.tests_path)


class CreateSyncPatch(Step):
    """Add the updated test files to a commit/patch in the local tree."""

    def create(self, state):
        local_tree = state.local_tree
        sync_tree = state.sync_tree

        local_tree.create_patch("web-platform-tests_update_%s" % sync_tree.rev,
                                "Update web-platform-tests to revision %s" % sync_tree.rev)
        local_tree.add_new(os.path.relpath(state.tests_path,
                                           local_tree.root))
        local_tree.update_patch(include=[state.tests_path,
                                         state.metadata_path])


class UpdateMetadata(Step):
    """Update the expectation metadata from a set of run logs"""

    def create(self, state):
        if not state.kwargs["run_log"]:
            return

        substate = state.substate("update_metadata",
                                  ["local_tree", "sync_tree", "paths"])
        substate.run_log = state.kwargs["run_log"]
        substate.serve_root = state.kwargs["serve_root"]
        substate.ignore_existing = state.kwargs["ignore_existing"]
        runner = MetadataUpdateRunner(substate )
        runner.run()
        state.remove_substate("update_metadata")


class UpdateExpected(Step):
    """Do the metadata update on the local checkout"""

    provides = ["needs_human"]

    def create(self, state):
        if state.sync_tree is not None:
            sync_root = state.sync_tree.root
        else:
            sync_root = None

        state.needs_human = metadata.update_expected(state.paths,
                                                        state.serve_root,
                                                        state.run_log,
                                                        rev_old=None,
                                                        ignore_existing=state.ignore_existing,
                                                        sync_root=sync_root)


class CreateMetadataPatch(Step):
    """Create a patch/commit for the metadata checkout"""

    def create(self, state):
        local_tree = state.local_tree
        sync_tree = state.sync_tree

        if sync_tree is not None:
            name = "web-platform-tests_update_%s_metadata" % sync_tree.rev
            message = "Update web-platform-tests expected data to revision %s" % sync_tree.rev
        else:
            name = "web-platform-tests_update_metadata"
            message = "Update web-platform-tests expected data"

        local_tree.create_patch(name, message)

        if not local_tree.is_clean:
            metadata_paths = [manifest_path["metadata_path"]
                              for manifest_path in state.paths.itervalues()]
            for path in metadata_paths:
                local_tree.add_new(os.path.relpath(path, local_tree.root))
            local_tree.update_patch(include=metadata_paths)


class UpdateRunner(StepRunner):
    """Runner for doing an overall update."""
    steps = [LoadConfig,
             LoadTrees,
             SyncFromUpstream,
             UpdateMetadata]


class SyncFromUpstreamRunner(StepRunner):
    """(Sub)Runner for doing an upstream sync"""
    steps = [UpdateCheckout,
             GetSyncTargetCommit,
             LoadManifest,
             UpdateManifest,
             CopyWorkTree,
             CreateSyncPatch]


class MetadataUpdateRunner(StepRunner):
    """(Sub)Runner for updating metadata"""
    steps = [
        UpdateExpected,
        CreateMetadataPatch
    ]


class WPTUpdate(object):
    def __init__(self, runner_cls=UpdateRunner, **kwargs):
        """Object that controls the running of a whole wptupdate.

        :param runner_cls: Runner subclass holding the overall list of
                           steps to run.
        :param kwargs: Command line arguments
        """
        self.runner_cls = runner_cls
        if kwargs["serve_root"] is None:
            kwargs["serve_root"] = kwargs["test_paths"]["/"]["tests_path"]

        #This must be before we try to reload state
        do_delayed_imports(kwargs["serve_root"])

        self.state = State()
        self.kwargs = kwargs

    def run(self, **kwargs):
        if self.kwargs["abort"]:
            self.abort()
            return exit_clean

        if not self.kwargs["continue"] and not self.state.is_empty():
            logger.error("Found existing state. Run with --continue to resume or --abort to clear state")
            return exit_unclean

        if self.kwargs["continue"]:
            if self.state.is_empty():
                logger.error("No sync in progress?")
                return exit_clean

            self.kwargs = self.state.kwargs
        else:
            self.state.kwargs = self.kwargs

        update_runner = self.runner_cls(self.state)
        return update_runner.run()

    def abort(self):
        self.state.clear()


def run_update(**kwargs):
    updater = WPTUpdate(**kwargs)
    return updater.run()


def main():
    global logger
    args = wptcommandline.parse_args_update()
    setup_logging(args, {})
    assert structuredlog.get_default_logger() is not None
    success = run_update(**args)
    sys.exit(0 if success else 1)
