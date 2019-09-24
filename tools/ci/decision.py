import json
import os

import taskcluster
from six import iteritems
from six.moves.urllib import request

from . import taskgraph

QUEUE_BASE = "https://queue.taskcluster.net/v1/task"


here = os.path.abspath(os.path.dirname(__file__))


def get_triggers(event):
    # Set some variables that we use to get the commits on the current branch
    ref_prefix = "refs/heads/"
    pull_request = "pull_request" in event
    branch = None
    if not pull_request and "ref" in event:
        branch = event["ref"]
        if branch.startswith(ref_prefix):
            branch = branch[len(ref_prefix):]

    return pull_request, branch


def fetch_event_data():
    try:
        task_id = os.environ["TASK_ID"]
    except KeyError:
        print("WARNING: Missing TASK_ID environment variable")
        # For example under local testing
        return None

    resp = request("%s/%s" % (QUEUE_BASE, task_id))

    task_data = json.load(resp)
    event_data = task_data.get("extra", {}).get("github_event")
    if event_data is not None:
        return json.loads(event_data)


def filter_triggers(event, all_tasks):
    is_pr, branch = get_triggers(event)
    triggered = {}
    for name, task in iteritems(all_tasks):
        if "trigger" in task:
            if is_pr and "pull-request" in task["trigger"]:
                triggered[name] = task
            elif branch is not None and "branch" in task["trigger"]:
                for trigger_branch in task["trigger"]["branch"]:
                    if (trigger_branch == branch or
                        trigger_branch.endswith("*") and branch.startswith(trigger_branch[:-1])):
                        triggered[name] = task
    return triggered


def get_run_jobs():
    import jobs
    paths = jobs.get_paths()
    return jobs.get_jobs(paths)


def filter_schedule_if(tasks):
    scheduled = {}
    run_jobs = None
    for name, task in iteritems(tasks):
        if "schedule-if" in task:
            if "run-job" in task["schedule-if"]:
                if run_jobs is None:
                    run_jobs = get_run_jobs()
                if any(item in run_jobs for item in task["schedule-if"]):
                    scheduled[name] = task
        else:
            scheduled[name] = task
    return scheduled


def get_fetch_rev(event):
    is_pr, _ = get_triggers(event)
    if is_pr:
        return event["pull_request"]["merge_commit_sha"]
    else:
        return event["after"]


def build_full_command(event, task):
    cmd_args = {
        "task_name": task["name"],
        "repo_url": event["repository"]["url"],
        "fetch_rev": get_fetch_rev(event),
        "task_cmd": task["command"]
    }

    options = task.get("options", {})
    options_args = []
    if options.get("oom-killer"):
        options_args.append("--oom-killer")
    if options.get("xvfb"):
        options_args.append("--xvfb")
    if not options.get("hosts"):
        options_args.append("--no-hosts")
    if not options.get("hosts"):
        options_args.append("--no-hosts")
    if options.get("checkout"):
        options_args.append("--checkout=%s" % options["checkout"])

    cmd_args["options_str"] = "\n".join("  %s" % item for item in options_args)

    install_str = "";
    install_packages = task.get("install")
    if install_packages:
        install_items = ["apt update -qqy"]
        install_items.extend("apt install -qqy %s" % item
                             for item in install_packages)
        install_str = "\n".join("sudo %s;" % item for item in install_items)

    cmd_args["install_cmd"] = install_str

    return ["/bin/bash",
            "--login",
            "-c",
            """
~/start.sh
  %(repo_url)s
  %(fetch_rev)s;
%(install_str)s
cd web-platform-tests;
./tools/ci/run_tc.py
  %(options_str)s
  %(task_cmd)s;
""" % cmd_args]


def create_tc_task(event, task, required_task_ids):
    command = build_full_command(event, task)
    worker_type = ("wpt-docker-worker"
                   if event["repository"]["full_name"] == 'web-platform-tests/wpt'
                   else "github-worker")
    task_id = taskcluster.slugId()
    task_data = {
        "taskGroupId": "", # TODO
        "created": taskcluster.fromNowJSON(""),
        "deadline": taskcluster.fromNowJSON(task["deadline"]),
        "provisionerId": task["provisionerId"],
        "workerType": worker_type,
        "metadata": {
            "name": task["name"],
            "description": task.get("description", ""),
            "owner": "%s@users.noreply.github.com" % event["sender"]["login"],
            "source": event["repository"]["url"]
        },
        "payload": {
            "artifacts": task.get("artifacts"),
            "command": command,
            "image": task.get("image"),
            "maxRunTime": task.get("maxRunTime"),
            "env": task.get("env", []),
        },
        "extras": {
            "github_event": json.dumps(event)
        }
    }
    if required_task_ids:
        task_data["dependencies"] = required_task_ids
        task_data["requires"] = "all-completed"
    return task_id, task_data


def build_task_graph(event, all_tasks, tasks):
    task_id_map = {}

    def add_task(task_name, task):
        required_ids = []
        if "require" in task:
            for required_name in task["require"]:
                if required_name not in task_id_map:
                    add_task(required_name,
                             all_tasks[required_name])
                required_ids.append(task_id_map[required_name][0])
        task_id, task_data = create_tc_task(event, task, required_ids)
        task_id_map[task_name] = (task_id, task_data)

    for task_name, task in iteritems(tasks):
        add_task(task_name, task)

    return task_id_map

def run(venv, **kwargs):
    if "TASK_EVENT" in os.environ:
        event = json.loads(os.environ["TASK_EVENT"])
    else:
        event = fetch_event_data()

    all_tasks = taskgraph.load_tasks_from_path(os.path.join(here, "tasks/test.yml"))

    print(json.dumps(all_tasks, indent=2))

    triggered_tasks = filter_triggers(event, all_tasks)
    scheduled_tasks = filter_schedule_if(triggered_tasks)

    task_id_map = build_task_graph(event, all_tasks, triggered_tasks)

    print(json.dumps(task_id_map, indent=2))
