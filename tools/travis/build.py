import os
import shutil
import subprocess

import vcs

here = os.path.abspath(os.path.dirname(__file__))

source_dir = os.path.join(here, "..", "..")

remote_built = "https://github.com/jgraham/css-test-built.git"
built_dir = os.path.join(here, "css-test-built")

local_files = ["manifest", "serve", "serve.py", ".gitmodules", "tools", "resources",
               "config.default.json"]

def fetch_submodules():
    hg = vcs.hg
    orig_dir = os.getcwd()
    for tool in ["apiclient", "w3ctestlib"]:
        dest_dir = os.path.join(source_dir, "tools", tool)
        if os.path.exists(os.path.join(dest_dir, ".hg")):
            try:
                os.chdir(dest_dir)
                hg("pull", "-u")
            finally:
                os.chdir(orig_dir)
        else:
            hg("clone", ("https://hg.csswg.org/dev/%s" % tool), dest_dir)

def update_dist():
    if not os.path.exists(built_dir) or not vcs.is_git_root(built_dir):
        git = vcs.git
        git("clone", remote_built, built_dir)
    else:
        git = vcs.bind_to_repo(vcs.git, built_dir)
        git("fetch")
        if "origin/master" in git("branch", "-a"):
            git("checkout", "master")
            git("merge", "--ff-only", "origin/master")

    git = vcs.bind_to_repo(vcs.git, built_dir)
    git("config", "user.email", "CssBuildBot@users.noreply.github.com")
    git("config", "user.name", "CSS Build Bot")

def setup_virtualenv():
    virtualenv_path = os.path.join(here, "_virtualenv")

    if not os.path.exists(virtualenv_path):
        subprocess.check_call(["virtualenv", virtualenv_path])

    activate_path = os.path.join(virtualenv_path, "bin", "activate_this.py")

    execfile(activate_path, dict(__file__=activate_path))

    subprocess.check_call(["pip", "-q", "install", "mercurial"])
    subprocess.check_call(["pip", "-q", "install", "html5lib"])
    subprocess.check_call(["pip", "-q", "install", "lxml"])


def update_template():
    svn = vcs.vcs("svn")
    template_dir = os.path.join(here, "Template-Python")

    svn("co", "svn://svn.tt2.org/Template-Python/trunk", template_dir)
    subprocess.check_call(["python", "setup.py", "install"],
                          cwd=template_dir)

def update_to_changeset(changeset):
    git = vcs.bind_to_repo(vcs.git, source_dir)
    git("checkout", changeset)

def build_tests():
    subprocess.check_call(["python", os.path.join(source_dir, "tools", "build.py")],
                           cwd=source_dir)

def list_current_files():
    git = vcs.bind_to_repo(vcs.git, built_dir)
    paths = [item for item in git("ls-tree", "-r", "--full-name", "--name-only", "HEAD").split("\n")
             if item and item not in local_files]
    return set(paths)

def copy_files():
    dist_path = os.path.join(source_dir, "dist")
    dest_paths = []
    for dir_name, dir_names, file_names in os.walk(dist_path):
        for file_name in file_names:
            src_path = os.path.join(dir_name, file_name)
            rel_path = os.path.relpath(src_path, dist_path)
            dest_path = os.path.join(built_dir, rel_path)
            dest_dir = os.path.dirname(dest_path)
            if not os.path.exists(dest_dir):
                os.makedirs(dest_dir)
            shutil.copy2(src_path, dest_path)
            dest_paths.append(os.path.relpath(dest_path, built_dir))

    return set(dest_paths)

def update_git(old_files, new_files):
    git = vcs.bind_to_repo(vcs.git, built_dir)

    print old_files - new_files
    for item in old_files - new_files:
        git("rm", item)

    for item in new_files - old_files:
        git("add", item)

    git("add", "-u")

def add_changeset(changeset):
    git = vcs.bind_to_repo(vcs.git, built_dir)

    dest_path = os.path.join(built_dir, "source_rev")
    with open(dest_path, "w") as f:
        f.write(changeset)
    git("add", os.path.relpath(dest_path, built_dir))

def commit(changeset):
    git = vcs.git

    msg = git("log", "-r", changeset, "-n", "1", "--pretty=%B", repo=source_dir)
    msg = "%s\n\nBuild from revision %s" % (msg, changeset)

    git("commit", "-m", msg, repo=built_dir)

def get_new_commits():
    git = vcs.bind_to_repo(vcs.git, source_dir)
    commit_path = os.path.join(built_dir, "source_rev")
    with open(commit_path) as f:
        prev_commit = f.read().strip()

    commit_range = "%s..%s" % (prev_commit, os.environ['TRAVIS_COMMIT'])
    commits = git("log", "--pretty=%H", "-r", commit_range).strip()
    if not commits:
        return []
    return reversed(commits.split("\n"))

def maybe_push():
    if os.environ["TRAVIS_PULL_REQUEST"] != "false":
        return

    if os.environ["TRAVIS_BRANCH"] != "master":
        return

    git = vcs.bind_to_repo(vcs.git, built_dir)

    out = "https://%s@github.com/jgraham/css-test-built.git" % os.environ["TOKEN"]
    git("remote", "add", "out", out, quiet=True)

    for i in range(2):
        try:
            git("push", "out", "HEAD:master")
        except subprocess.CalledProcessError:
            if i == 0:
                git("fetch", "origin")
                git("rebase", "origin/master")
        else:
            return

    raise Exception("Push failed")

def main():
    setup_virtualenv()
    try:
        import template
    except ImportError:
        update_template()
    fetch_submodules()
    update_dist()
    for changeset in get_new_commits():
        update_to_changeset(changeset)
        old_files = list_current_files()
        build_tests()
        new_files = copy_files()
        update_git(old_files, new_files)
        add_changeset(changeset)
        commit(changeset)
    maybe_push()

if __name__ == "__main__":
    main()
