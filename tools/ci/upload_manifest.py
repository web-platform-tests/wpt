import logging
import os
import sys

from github import Github

g = Github(os.environ["GITHUB_TOKEN"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_pr(repo_name, sha):
    prs = list(g.search_issues("is:pr is:merged repo:%s sha:%s"
                               % (repo_name, sha)))

    if len(prs) == 0:
        logger.error("No PR found for %s" % sha)
        sys.exit(1)

    for pr in prs:
        logger.info("Found PR: %s" % pr.html_url)

    if len(prs) > 1:
        logger.warning("Found multiple PRs for %s" % sha)

    return prs[0]


def main():
    manifest_file = sys.argv[1]

    repo_name = os.environ["GITHUB_REPOSITORY"]
    sha = os.environ["GITHUB_SHA"]

    pr = get_pr(repo_name, sha)

    tag = "merge_pr_%s" % pr.number

    # PyGithub requires these arguments, but passing empty strings causes
    # GitHub to pick a name and message. It's not important what they are.
    name = ""
    message = ""

    repo = g.get_repo(repo_name)

    # First create a draft release, then upload the manifest and then
    # public the release. The tag will be created by the last step.
    release = repo.create_git_release(tag, name, message,
                                      target_commitish=sha, draft=True)
    release.upload_asset(manifest_file)
    release.update_release(name, message, draft=False)

    logger.info("Uploaded manifest as %s" % tag)

if __name__ == "__main__":
    main()
