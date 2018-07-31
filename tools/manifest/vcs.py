import os
import subprocess
import json
from copy import copy

from .sourcefile import SourceFile


class Git(object):
    def __init__(self, repo_root, url_base):
        self.root = os.path.abspath(repo_root)
        self.git = Git.get_func(repo_root)
        self.url_base = url_base

    @staticmethod
    def get_func(repo_path):
        def git(cmd, *args):
            full_cmd = ["git", cmd] + list(args)
            try:
                return subprocess.check_output(full_cmd, cwd=repo_path, stderr=subprocess.STDOUT)
            except WindowsError:
                full_cmd[0] = "git.bat"
                return subprocess.check_output(full_cmd, cwd=repo_path, stderr=subprocess.STDOUT)
        return git

    @classmethod
    def for_path(cls, path, url_base):
        git = Git.get_func(path)
        try:
            return cls(git("rev-parse", "--show-toplevel").rstrip(), url_base)
        except subprocess.CalledProcessError:
            return None

    def _local_changes(self):
        changes = {}
        cmd = ["status", "-z", "--ignore-submodules=all"]
        data = self.git(*cmd)

        if data == "":
            return changes

        rename_data = None
        for entry in data.split("\0")[:-1]:
            if rename_data is not None:
                status, rel_path = entry.split(" ")
                if status[0] == "R":
                    rename_data = (rel_path, status)
                else:
                    changes[rel_path] = (status, None)
            else:
                rel_path = entry
                changes[rel_path] = rename_data
                rename_data = None
        return changes

    def _show_file(self, path):
        path = os.path.relpath(os.path.abspath(path), self.root)
        return self.git("show", "HEAD:%s" % path)

    def __iter__(self):
        cmd = ["ls-tree", "-r", "-z", "HEAD"]
        local_changes = self._local_changes()
        for result in self.git(*cmd).split("\0")[:-1]:
            rel_path = result.split("\t")[-1]
            hash = result.split()[2]
            if not os.path.isdir(os.path.join(self.root, rel_path)):
                if rel_path in local_changes:
                    contents = self._show_file(rel_path)
                else:
                    contents = None
                yield SourceFile(self.root,
                                 rel_path,
                                 self.url_base,
                                 hash,
                                 contents=contents)


class FileSystem(object):
    def __init__(self, root, url_base):
        self.root = root
        self.url_base = url_base
        from gitignore import gitignore
        self.path_filter = gitignore.PathFilter(self.root, extras=[".git/"])
        self.cache = MtimeCache(self.root, self.path_filter)
        self.mtimes = self.cache.get_cache()

    def __iter__(self):
        paths = self.get_paths()
        for path in paths:
            yield SourceFile(self.root, path, self.url_base)

    def get_paths(self):
        changed = False
        m_copy = copy(self.mtimes)
        for dirpath, dirnames, filenames in os.walk(self.root):
            for filename in filenames:
                abs_path = os.path.join(dirpath, filename)
                path = os.path.relpath(abs_path, self.root)
                if self.path_filter(path):
                    if self.cache.has_changed(path, abs_path, self.mtimes.get(path)):
                        changed=True
                        m_copy[path] = os.path.getmtime(abs_path)
                        yield path
                    self.mtimes.pop(path, None)

            dirnames[:] = [item for item in dirnames if self.path_filter(
                           os.path.relpath(os.path.join(dirpath, item), self.root) + "/")]

        for path in self.mtimes:
            del m_copy[path]
            changed=True
            yield path

        if changed:
            self.cache.write_cache(m_copy)


class MtimeCache():
    def __init__(self, root, path_filter):
        self.path = os.path.join(root, "cache.json")
        self.root = root
        self.path_filter = path_filter

    def update_cache(self):
        mtimes = {}
        for k,v in self.get_mtimes():
            mtimes[k] = v
        self.write_cache(mtimes)

    def write_cache(self, mtimes):
        with open(self.path, 'w') as f:
            json.dump(mtimes, f, indent=1)

    def load_cache(self):
        with open(self.path, 'r') as f:
            return json.load(f)

    def get_cache(self):
        if not os.path.exists(self.path):
            mtimes = {}
            for k,v in self.get_mtimes():
                mtimes[k] = v
            self.write_cache(mtimes)
        else:
            mtimes = self.load_cache()
        return mtimes

    def has_changed(self, rel_path, abs_path, cached_mtime):
        try:
            new_mtime = os.path.getmtime(abs_path)
        except Exception as e:
            return True
        if new_mtime!=cached_mtime:
            return True
        return False

    def get_mtimes(self):
        for dirpath, dirnames, filenames in os.walk(self.root):
            for filename in filenames:
                abs_path = os.path.join(dirpath, filename)
                path = os.path.relpath(abs_path, self.root)
                if self.path_filter(path):
                    yield path, os.path.getmtime(abs_path)

            dirnames[:] = [item for item in dirnames if self.path_filter(
                           os.path.relpath(os.path.join(dirpath, item), self.root) + "/")]
