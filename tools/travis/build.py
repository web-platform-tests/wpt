import os
import shutil
import subprocess
import sys

import vcs

lockfile = None

here = os.path.abspath(os.path.dirname(__file__))

remote_hg = "https://hg.csswg.org/test/"
hg_dir = os.path.join(here, "hg")

remote_git = "git@github.com:jgraham/css-test-built.git"
out_dir = os.path.join(here, "css-test-built")

local_files = ["manifest", "serve", "serve.py", ".gitmodules", "tools", "resources",
               "config.default.json"]

lock_path = os.path.join(here, ".lock")

def update_source():
    if not os.path.exists(hg_dir) or not os.path.exists(os.path.join(hg_dir, ".hg")):
        hg = vcs.hg
        hg("clone", remote_hg, hg_dir)
    else:
        hg = vcs.bind_to_repo(vcs.hg, hg_dir)
        hg("pull")
        hg("update", "-r", "a2a3c34d4f34")

def update_dist():
    if not os.path.exists(out_dir) or not vcs.is_git_root(out_dir):
        git = vcs.git
        git("clone", remote_git, out_dir)
    else:
        git = vcs.bind_to_repo(vcs.git, out_dir)
        git("fetch")
        if "origin/master" in git("branch", "-a"):
            git("checkout", "master")
            git("merge", "--ff-only", "origin/master")

def setup_virtualenv():
    global lockfile
    virtualenv_path = os.path.join(here, "_virtualenv")

    if not os.path.exists(virtualenv_path):
        subprocess.check_call(["virtualenv", virtualenv_path])

    activate_path = os.path.join(virtualenv_path, "bin", "activate_this.py")

    execfile(activate_path, dict(__file__=activate_path))

    subprocess.check_call(["pip", "-q", "install", "mercurial"])
    subprocess.check_call(["pip", "-q", "install", "html5lib"])
    subprocess.check_call(["pip", "-q", "install", "lxml"])
    subprocess.check_call(["pip", "-q", "install", "lockfile"])
    import lockfile


def update_template():
    svn = vcs.vcs("svn")
    template_dir = os.path.join(here, "Template-Python")

    svn("co", "svn://svn.tt2.org/Template-Python/trunk", template_dir)
    subprocess.check_call(["python", "setup.py", "install"],
                          cwd=template_dir)

def update_to_changeset(changeset):
    hg = vcs.bind_to_repo(vcs.hg, hg_dir)
    hg("update", changeset)

def build_tests():
    subprocess.check_call(["python", os.path.join(hg_dir, "tools", "build.py")],
                           cwd=hg_dir)

def list_current_files():
    git = vcs.bind_to_repo(vcs.git, out_dir)
    paths = [item for item in git("ls-tree", "-r", "--full-name", "--name-only", "HEAD").split("\n")
             if item and item not in local_files]
    return set(paths)

def copy_files():
    dist_path = os.path.join(hg_dir, "dist")
    dest_paths = []
    for dir_name, dir_names, file_names in os.walk(dist_path):
        for file_name in file_names:
            src_path = os.path.join(dir_name, file_name)
            rel_path = os.path.relpath(src_path, dist_path)
            dest_path = os.path.join(out_dir, rel_path)
            dest_dir = os.path.dirname(dest_path)
            if not os.path.exists(dest_dir):
                os.makedirs(dest_dir)
            shutil.copy2(src_path, dest_path)
            dest_paths.append(os.path.relpath(dest_path, out_dir))

    return set(dest_paths)

def update_git(old_files, new_files):
    git = vcs.bind_to_repo(vcs.git, out_dir)

    print old_files - new_files
    for item in old_files - new_files:
        git("rm", item)

    for item in new_files - old_files:
        git("add", item)

    git("add", "-u")

def add_changeset(changeset):
    git = vcs.bind_to_repo(vcs.git, out_dir)

    dest_path = os.path.join(out_dir, "source_rev")
    with open(dest_path, "w") as f:
        f.write(changeset)
    git("add", os.path.relpath(dest_path, out_dir))

def commit(changeset):
    git = vcs.bind_to_repo(vcs.git, out_dir)
    hg = vcs.bind_to_repo(vcs.hg, hg_dir)
    msg = hg("log", "-r", changeset, "--template", "{desc}")
    msg = "%s\n\nBuild from revision %s" % (msg, changeset)
    git("commit", "-m", msg)

def get_new_commits():
    hg = vcs.bind_to_repo(vcs.hg, hg_dir)
    commit_path = os.path.join(out_dir, "source_rev")
    if os.path.exists(commit_path):
        with open(commit_path) as f:
            prev_commit = f.read().strip()
        changesets = hg("log", "--template", "{node}\n", "-r", "%s.." % prev_commit).strip().split("\n")[1:]
    else:
        changesets = [hg("log", "--template", "{node}\n", "-r", "tip")]

    return changesets

def push():
    git = vcs.bind_to_repo(vcs.git, out_dir)
    success = False
    for i in range(2):
        try:
            git("push", "origin", "HEAD:master")
        except subprocess.CalledProcessError:
            if i == 0:
                git("fetch", "origin")
                git("rebase", "origin/master")
        else:
            success = True
            break
    if not success:
        print "Push failed"


def main():
    setup_virtualenv()
    lock = lockfile.LockFile(lock_path)
    try:
        lock.acquire(timeout=30)
    except lockfile.LockTimeout:
        print "Update process is already running; returning"
        sys.exit(1)
    try:
        try:
            import template
        except ImportError:
            update_template()
        update_source()
        update_dist()
        for changeset in get_new_commits():
            update_to_changeset(changeset)
            old_files = list_current_files()
            build_tests()
            new_files = copy_files()
            update_git(old_files, new_files)
            add_changeset(changeset)
            commit(changeset)
        #push()
    finally:
        lock.release()

if __name__ == "__main__":
    main()

