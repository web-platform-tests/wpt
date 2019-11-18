import argparse
import os
import logging

import requests

import github


logging.basicConfig()
logger = logging.getLogger("tc-download")

# The root URL of the Taskcluster deployment from which to download wpt reports
# (after https://bugzilla.mozilla.org/show_bug.cgi?id=1574668 lands, this will
# be https://community-tc.services.mozilla.com)
TASKCLUSTER_ROOT_URL = 'https://community-tc.services.mozilla.com'

def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ref", action="store", default="master",
                        help="Branch (in the GitHub repository) or commit to fetch logs for")
    parser.add_argument("--artifact-name", action="store", default="wpt_report.json.gz",
                        help="Log type to fetch")
    parser.add_argument("--repo-name", action="store", default="web-platform-tests/wpt",
                        help="GitHub repo name in the format owner/repo. "
                        "This must be the repo from which the Taskcluster run was scheduled "
                        "(for PRs this is the repo into which the PR would merge)")
    parser.add_argument("--token-file", action="store",
                        help="File containing GitHub token")
    parser.add_argument("--out-dir", action="store", default=".",
                        help="Path to save the logfiles")
    return parser


def get_json(url, key=None):
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    if key:
        data = data[key]
    return data


def get(url, dest, name):
    resp = requests.get(url)
    resp.raise_for_status()
    path = os.path.join(dest, name)
    with open(path, "w") as f:
        f.write(resp.content)
    return path


# Task names may include the forward slash character ("/"), so any occurrences
# must be removed if the name is to be used as a file name.
def sanitize_task_name(task):
    return task["task"]["metadata"]["name"].replace('/', '_'),


def run(*args, **kwargs):
    if not os.path.exists(kwargs["out_dir"]):
        os.mkdir(kwargs["out_dir"])

    if kwargs["token_file"]:
        with open(kwargs["token_file"]) as f:
            gh = github.Github(f.read().strip())
    else:
        gh = github.Github()

    repo = gh.get_repo(kwargs["repo_name"])
    commit = repo.get_commit(kwargs["ref"])
    statuses = commit.get_statuses()
    taskgroups = set()

    for status in statuses:
        if not status.context.startswith("Community-TC "):
            continue
        if status.state == "pending":
            continue
        taskgroup_id = status.target_url.rsplit("/", 1)[1]
        taskgroups.add(taskgroup_id)

    if not taskgroups:
        logger.error("No complete Taskcluster runs found for ref %s" % kwargs["ref"])
        return 1

    for taskgroup in taskgroups:
        taskgroup_url = TASKCLUSTER_ROOT_URL + "/api/queue/v1/task-group/%s/list"
        artifacts_list_url = TASKCLUSTER_ROOT_URL + "/api/queue/v1/task/%s/artifacts"
        tasks = get_json(taskgroup_url % taskgroup, "tasks")
        for task in tasks:
            task_id = task["status"]["taskId"]
            url = artifacts_list_url % (task_id,)
            for artifact in get_json(url, "artifacts"):
                if artifact["name"].endswith(kwargs["artifact_name"]):
                    filename = "%s-%s-%s" % (sanitize_task_name(task),
                                             task_id,
                                             kwargs["artifact_name"])
                    path = get("%s/%s" % (url, artifact["name"]), kwargs["out_dir"], filename)
                    logger.info(path)


def main():
    kwargs = get_parser().parse_args()

    run(None, vars(kwargs))


if __name__ == "__main__":
    main()
