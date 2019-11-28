import argparse
import os
import sys
import logging

import requests

import github


logging.basicConfig()
logger = logging.getLogger("tc-download")

# The root URL of the Taskcluster deployment from which to download wpt reports
# (after https://bugzilla.mozilla.org/show_bug.cgi?id=1574668 lands, this will
# be https://community-tc.services.mozilla.com)
TASKCLUSTER_ROOT_URL = 'https://taskcluster.net'

def get_parser():
    parser = argparse.ArgumentParser()
    # Global options
    parser.add_argument("--ref", action="store", default="master",
                        help="Branch (in the GitHub repository) or commit to fetch logs for")
    parser.add_argument("--artifact-name", action="store", default="wpt_report.json.gz",
                        help="Log type to fetch")
    parser.add_argument("--filter-artifact", action="store",
                        help="Only get or upload artifacts that contain this string", default=None)
    parser.add_argument("--repo-name", action="store", default="web-platform-tests/wpt",
                        help="GitHub repo name in the format owner/repo. "
                        "This must be the repo from which the Taskcluster run was scheduled "
                        "(for PRs this is the repo into which the PR would merge)")
    parser.add_argument("--token-file", action="store",
                        help="File containing GitHub token")

    options_action = parser.add_mutually_exclusive_group(required=True)
    options_action.add_argument("--download", action="store_true")
    options_action.add_argument("--upload", action="store_true")
    # Options for --download
    download_options = parser.add_argument_group("download options")
    download_options.add_argument("--out-dir", action="store", default=".",
                        help="Path to save the logfiles")
    # Options for --upload
    upload_enabled = "--upload" in sys.argv
    upload_options = parser.add_argument_group("upload options")
    upload_options.add_argument("--user", action="store", required=upload_enabled,
                        help="User name for staging.wpt.fyi")
    upload_options.add_argument("--password", action="store", required=upload_enabled,
                        help="User password for staging.wpt.fyi")
    upload_options.add_argument("--server-url", action="store",
                        help="Base server url, defaults to https://staging.wpt.fyi", default="https://staging.wpt.fyi")
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

def upload_artifacts_wpt_fyi(upload_artifact_list, kwargs):
    total_wptresults = 0
    total_wptscreenshoots = 0
    for item in upload_artifact_list:
        if item[0] == "result_url":
            total_wptresults += 1
        elif item[0] == "screenshot_url":
            total_wptscreenshoots += 1

    if total_wptresults == 0:
        logger.error("Not sending data, collected artifacts/wptresults is zero")
        return 1
    else:
        logger.error("Sending a total of %s wptresults and %s screenshoots to %s" %
                    (total_wptresults, total_wptscreenshoots, kwargs["server_url"]))

        received = requests.post("%s/api/results/upload" % kwargs["server_url"], data=upload_artifact_list,
                  auth=(kwargs["user"], kwargs["password"]))
        if received.status_code != 200:
            logger.error("The server returned an unexpected code")
            logger.error("Status code is: %s" % received.status_code)
            logger.error("Content is: %s" % received.content)
            return 1
        if "added to queue" not in received.content:
            logger.error("The server returned an unexpected content")
            logger.error("Content is: %s" % received.content)
            return 1
        logger.info(received.content)
        logger.info("Check status in: %s/results/?run_id=%s" %
                   (kwargs["server_url"], received.content.split(" ")[1]))
        return 0

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
        if not status.context.startswith("Taskcluster "):
            continue
        if status.state == "pending":
            continue
        taskgroup_id = status.target_url.rsplit("/", 1)[1]
        taskgroups.add(taskgroup_id)

    if not taskgroups:
        logger.error("No complete Taskcluster runs found for ref %s" % kwargs["ref"])
        return 1

    upload_artifact_list = []
    for taskgroup in taskgroups:
        if TASKCLUSTER_ROOT_URL == 'https://taskcluster.net':
            # NOTE: this condition can be removed after November 9, 2019
            taskgroup_url = "https://queue.taskcluster.net/v1/task-group/%s/list"
            artifacts_list_url = "https://queue.taskcluster.net/v1/task/%s/artifacts"
        else:
            taskgroup_url = TASKCLUSTER_ROOT_URL + "/api/queue/v1/task-group/%s/list"
            artifacts_list_url = TASKCLUSTER_ROOT_URL + "/api/queue/v1/task/%s/artifacts"
        tasks = get_json(taskgroup_url % taskgroup, "tasks")
        for task in tasks:
            task_id = task["status"]["taskId"]
            url = artifacts_list_url % (task_id,)
            if kwargs["filter_artifact"] is not None:
                if kwargs["filter_artifact"] not in task["task"]["metadata"]["name"]:
                    logger.info("Skipping artifacts for %s" % task["task"]["metadata"]["name"])
                    continue
            for artifact in get_json(url, "artifacts"):
                if kwargs["download"]:
                    if artifact["name"].endswith(kwargs["artifact_name"]):
                        filename = "%s-%s-%s" % (task["task"]["metadata"]["name"],
                                                 task_id,
                                                 kwargs["artifact_name"])
                        path = get("%s/%s" % (url, artifact["name"]), kwargs["out_dir"], filename)
                        logger.info(path)
                elif kwargs["upload"]:
                    logger.info("Collecting artifacts for %s" % task["task"]["metadata"]["name"])
                    artifact_url = "%s/%s" % (url, artifact["name"])
                    if artifact["name"].endswith("wpt_report.json.gz"):
                        upload_artifact_list.append(("result_url", artifact_url))
                    if artifact["name"].endswith("wpt_screenshot.txt.gz"):
                        upload_artifact_list.append(("screenshot_url", artifact_url))

    if kwargs["upload"]:
        return upload_artifacts_wpt_fyi(upload_artifact_list, kwargs)


def main():
    kwargs = get_parser().parse_args()

    run(None, vars(kwargs))


if __name__ == "__main__":
    main()
