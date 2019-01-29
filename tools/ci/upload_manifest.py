import os
from github import Github


def main():
    manifest_file = sys.argv[1]

    g = Github(os.environ["GITHUB_TOKEN"])
    repo = g.get_repo(os.environ["GITHUB_REPOSITORY"])
    name = ""
    message = ""
    sha = os.environ["GITHUB_SHA"]

    release = repo.create_git_release("test_tag_name", name, message,
                                      target_commitish=sha, draft=True)
    release.upload_asset(manifest_file)
    release.update_release(name, message, draft=False)


if __name__ == "__main__":
    main()
