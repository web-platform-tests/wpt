import argparse
import os
import logging

import requests

import github


logging.basicConfig()
logger = logging.getLogger("tc-download")


def get_parser():
    parser = argparse.ArgumentParser("""Download logs from taskcluster

Logs may be specified in one of two ways, either by providing some
taskcluster taskgroupIds to download from or by providing the repo name
and branch which scheduled the run. In the latter case the --status-prefix
argument can be used to control which status check is interpreted as the
taskcluster job""")
    parser.add_argument("--taskcluster-root",
                        action="store",
                        default="https://community-tc.services.mozilla.com",
                        help="Root URL for the taskcluster instance")
    parser.add_argument("--artifact-name", action="store", default="wpt_report.json.gz",
                        help="Log type to fetch")
    parser.add_argument("--ref", action="store", default="master",
                        help="Branch (in the GitHub repository) or commit to fetch logs for")
    parser.add_argument("--repo-name", action="store", default="web-platform-tests/wpt",
                        help="GitHub repo name in the format owner/repo. "
                        "This must be the repo from which the Taskcluster run was scheduled "
                        "(for PRs this is the repo into which the PR would merge)")
    parser.add_argument("--status-prefix",
                        action="store",
                        default="Community-TC ",
                        help="Prefix of status check name to use when looking up taskgroups")
    parser.add_argument("--taskgroups", action="store", nargs="*",
                        help="Taskgroup IDs to download")
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


def get_taskgroups(repo_name, ref, status_prefix, token_file=None):
    if token_file:
        with open(token_file) as f:
            gh = github.Github(f.read().strip())
    else:
        gh = github.Github()

    repo = gh.get_repo(repo_name)
    commit = repo.get_commit(ref)
    statuses = commit.get_statuses()
    taskgroups = set()

    for status in statuses:
        if not status.context.startswith(status_prefix):
            continue
        if status.state == "pending":
            continue
        taskgroup_id = status.target_url.rsplit("/", 1)[1]
        taskgroups.add(taskgroup_id)
    return taskgroups


# Task names may include the forward slash character ("/"), so any occurrences
# must be removed if the name is to be used as a file name.
def sanitize_task_name(name):
    return name.replace('/', '_')


def run(*args, **kwargs):
    if not os.path.exists(kwargs["out_dir"]):
        os.mkdir(kwargs["out_dir"])

    if kwargs["taskgroups"]:
        taskgroups = kwargs["taskgroups"]
    else:
        taskgroups = get_taskgroups(kwargs["repo_name"],
                                    kwargs["ref"],
                                    kwargs["status_prefix"],
                                    kwargs["token_file"])

    if not taskgroups:
        logger.error("No complete Taskcluster runs found for ref %s" % kwargs["ref"])
        return 1

    taskcluster_root_url = kwargs["taskcluster_root"]

    for taskgroup in taskgroups:
        if taskcluster_root_url == 'https://taskcluster.net':
            # NOTE: this condition can be removed after November 9, 2019
            taskgroup_url = "https://queue.taskcluster.net/v1/task-group/%s/list"
            artifacts_list_url = "https://queue.taskcluster.net/v1/task/%s/artifacts"
        else:
            taskgroup_url = taskcluster_root_url + "/api/queue/v1/task-group/%s/list"
            artifacts_list_url = taskcluster_root_url + "/api/queue/v1/task/%s/artifacts"
        tasks = get_json(taskgroup_url % taskgroup, "tasks")
        for task in tasks:
            task_id = task["status"]["taskId"]
            url = artifacts_list_url % (task_id,)
            for artifact in get_json(url, "artifacts"):
                if artifact["name"].endswith(kwargs["artifact_name"]):
                    filename = "%s-%s-%s" % (sanitize_task_name(task["task"]["metadata"]["name"]),
                                             task_id,
                                             kwargs["artifact_name"])
                    path = get("%s/%s" % (url, artifact["name"]), kwargs["out_dir"], filename)
                    logger.info(path)


def main():
    kwargs = get_parser().parse_args()

    run(None, vars(kwargs))


if __name__ == "__main__":
    main()
