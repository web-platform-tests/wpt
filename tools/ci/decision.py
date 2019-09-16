import json
import os
import taskgraph
from six import iteritems
from six.moves.urllib import request


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


class TaskNode(object):
    def __init__(self, data):
        self.data = data
        self.children = []

    def append(self, other):
        self.children.append(other)

def build_task_graph(tasks, all_task):
    task_id_map = {}

    def add_task(task_name, task):
        required_ids = []
        if "require" in task:
            for required_name in task["require"]:
                if required_name not in task_id_map:
                    required_id = add_task(required_name,
                                           all_tasks.get(required_name))
                    

    for task_name in tasks:
        add_task(task)


def run(venv, **kwargs):
    if "TASK_EVENT" in os.environ:
        event = json.loads(os.environ["TASK_EVENT"])
    else:
        event = fetch_event_data()

    all_tasks = taskgraph.load_tasks_from_path(os.path.join(here, "tasks/test.yml"))

    print(all_tasks)

    triggered_tasks = filter_triggers(event, all_tasks)
    scheduled_tasks = filter_schedule_if(triggered_tasks)

    task_graph = build_task_graph(all_tasks, triggered_tasks)


