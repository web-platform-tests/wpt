import base64
import json
import logging
import os
import sys
import urllib2

here = os.path.abspath(os.path.dirname(__file__))
wpt_root = os.path.abspath(os.path.join(here, os.pardir, os.pardir))

if not(wpt_root in sys.path):
    sys.path.append(wpt_root)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_pr(owner, repo, sha):
    url = ("https://api.github.com/search/issues?q=type:pr+is:merged+repo:%s/%s+sha:%s" %
           (owner, repo, sha))
    try:
        resp = urllib2.urlopen(url)
        body = resp.read()
    except Exception as e:
        logger.error(e)
        return None

    if resp.code != 200:
        logger.error("Got HTTP status %s. Response:" % resp.code)
        logger.error(body)
        return None

    try:
        data = json.loads(body)
    except ValueError:
        logger.error("Failed to read response as JSON:")
        logger.error(body)
        return None

    items = data["items"]
    if len(items) == 0:
        logger.error("No PR found for %s" % sha)
        return None
    if len(items) > 1:
        logger.warning("Found multiple PRs for %s" % sha)

    pr = items[0]

    return pr["number"]


def tag(owner, repo, sha, tag, auth, staging):
    ref = "refs/tags/%s" % tag
    if staging:
        ref = "refs/staging/tags/%s" % tag
    data = json.dumps({"ref": ref, "sha": sha})
    try:
        url = "https://api.github.com/repos/%s/%s/git/refs" % (owner, repo)
        req = urllib2.Request(url, data=data)

        req.add_header("Authorization", auth)

        opener = urllib2.build_opener(urllib2.HTTPSHandler())

        resp = opener.open(req)
    except Exception as e:
        logger.error("Tag creation failed:\n%s" % e)
        return False

    if resp.code != 201:
        logger.error("Got HTTP status %s. Response:" % resp.code)
        logger.error(resp.read())
        return False

    logger.info("Tagged %s as %s" % (sha, tag))
    return True


def main():
    # TODO(foolip): remove the staging flag and Travis job once GitHub Actions
    # has proven stable enough.
    staging = False
    if "GITHUB_ACTION" in os.environ:
        staging = True

        owner, repo = os.environ["GITHUB_REPOSITORY"].split("/", 1)

        if os.environ["GITHUB_REF"] != "refs/heads/master":
            logger.error("Not tagging for non-master branch")
            sys.exit(1)

        auth = "token %s" % os.environ["GITHUB_TOKEN"]

        sha = os.environ["GITHUB_SHA"]
    else:
        owner, repo = os.environ["TRAVIS_REPO_SLUG"].split("/", 1)

        if os.environ["TRAVIS_PULL_REQUEST"] != "false":
            logger.info("Not tagging for PR")
            return

        if os.environ["TRAVIS_BRANCH"] != "master":
            logger.info("Not tagging for non-master branch")
            return

        auth = "Basic %s" % base64.b64encode(os.environ["GH_TOKEN"])

        sha = os.environ["TRAVIS_COMMIT"]

    pr = get_pr(owner, repo, sha)
    if pr is None:
        sys.exit(1)
    tagged = tag(owner, repo, sha, "merge_pr_%s" % pr, auth, staging)
    if not tagged:
        sys.exit(1)


if __name__ == "__main__":
    main()
