# mypy: allow-untyped-defs

import fnmatch
import json
import os
import shlex
from copy import deepcopy
from datetime import datetime, timedelta
from unittest import mock

import pytest

from tools.ci.tc import decision, taskgraph


@pytest.mark.parametrize("run_jobs,tasks,expected", [
    ([], {"task-no-schedule-if": {}}, ["task-no-schedule-if"]),
    ([], {"task-schedule-if-no-run-job": {"schedule-if": {}}}, []),
    (["job"],
     {"job-present": {"schedule-if": {"run-job": ["other-job", "job"]}}},
     ["job-present"]),
    (["job"], {"job-missing": {"schedule-if": {"run-job": ["other-job"]}}}, []),
    (["all"], {"job-all": {"schedule-if": {"run-job": ["other-job"]}}}, ["job-all"]),
    (["job"],
     {"job-1": {"schedule-if": {"run-job": ["job"]}},
      "job-2": {"schedule-if": {"run-job": ["other-job"]}}},
     ["job-1"]),
])
def test_filter_schedule_if(run_jobs, tasks, expected):
    with mock.patch("tools.ci.tc.decision.get_run_jobs",
                    return_value=run_jobs) as get_run_jobs:
        assert (decision.filter_schedule_if({}, tasks) ==
                {name: tasks[name] for name in expected})
        get_run_jobs.call_count in (0, 1)


@pytest.mark.parametrize("msg,expected", [
    ("Some initial line\n\ntc-jobs:foo,bar", {"foo", "bar"}),
    ("Some initial line\n\ntc-jobs:foo, bar", {"foo", "bar"}),
    ("tc-jobs:foo, bar   \nbaz", {"foo", "bar"}),
    ("tc-jobs:all", {"all"}),
    ("", set()),
    ("tc-jobs:foo\ntc-jobs:bar", {"foo"})])
@pytest.mark.parametrize("event", [
    {"head_commit": {"message": "<message>"}},
    {"pull_request": {"body": "<message>"}}
])
def test_extra_jobs_pr(msg, expected, event):
    def sub(obj):
        """Copy obj, except if it's a string with the value <message>
        replace it with the value of the msg argument"""
        if isinstance(obj, dict):
            return {key: sub(value) for (key, value) in obj.items()}
        elif isinstance(obj, list):
            return [sub(value) for value in obj]
        elif obj == "<message>":
            return msg
        return obj

    event = sub(event)

    assert decision.get_extra_jobs(event) == expected


def test_artifact_expiration():
    tasks = taskgraph.load_tasks_from_path(os.path.join(decision.here, "tasks", "test.yml"))
    task = deepcopy(tasks["download-firefox-nightly"])
    task["artifacts"]["public/browser"] = {
        "path": "/home/test/browser",
        "type": "directory",
        "expires-after": "7 days",
    }
    original_task = deepcopy(task)
    event = {"ref": "refs/heads/master", "after": "a" * 40,
             "repository": {"clone_url": "https://github.com/web-platform-tests/wpt.git"}}

    for _ in range(2):
        _, generated_task = decision.create_tc_task(event, task, "taskgroup", [])
        artifacts = generated_task["payload"]["artifacts"]
        created = datetime.fromisoformat(generated_task["created"].replace("Z", "+00:00"))
        expires = datetime.fromisoformat(artifacts["public/browser"]["expires"].replace("Z", "+00:00"))
        assert abs((expires - created) - timedelta(days=7)) < timedelta(seconds=1)
        assert "expires-after" not in artifacts["public/browser"]
        assert artifacts["public/results"] == original_task["artifacts"]["public/results"]
        assert task == original_task


@pytest.mark.parametrize("product", ["webkitgtk_minibrowser", "wpewebkit_minibrowser"])
@pytest.mark.parametrize("channel", ["nightly", "beta", "stable"])
def test_minibrowser_shared_download(product, channel):
    event = {"ref": f"refs/heads/triggers/{product}_{channel}", "after": "a" * 40,
             "repository": {"clone_url": "https://github.com/web-platform-tests/wpt.git"}}
    tasks = decision.decide(event)
    download_name = f"download-{product}-{channel}"
    download_id, download_task = tasks[download_name]
    assert [name for name in tasks if name.startswith("download-")] == [download_name]

    artifacts = download_task["payload"]["artifacts"]
    assert artifacts["public/browser"]["path"] == "/home/test/browser"
    assert artifacts["public/results"]["path"] == "/home/test/artifacts"
    assert "expires" not in artifacts["public/results"]
    created = datetime.fromisoformat(download_task["created"].replace("Z", "+00:00"))
    expires = datetime.fromisoformat(artifacts["public/browser"]["expires"].replace("Z", "+00:00"))
    assert abs((expires - created) - timedelta(days=7)) < timedelta(seconds=1)
    assert "--download-only --destination /home/test/browser/" in download_task["payload"]["command"][-1]
    download_arguments = shlex.split(download_task["payload"]["command"][-1])
    bundle_name = next(argument.split("=", 1)[1] for argument in download_arguments
                       if argument.startswith("--rename="))

    chunks = [task for name, (_, task) in tasks.items() if name.startswith(f"wpt-{product}-{channel}-")]
    assert chunks
    for chunk in chunks:
        assert chunk["dependencies"] == [download_id]
        assert chunk["requires"] == "all-completed"
        chunk_artifacts = json.loads(chunk["payload"]["env"]["TASK_ARTIFACTS"])
        assert chunk_artifacts == [{
            "task": download_id,
            "glob": f"public/browser/{product}-{channel}.*",
            "dest": f"build/{product}/",
            "extract": True,
        }]
        assert fnmatch.fnmatch(f"public/browser/{bundle_name}.tar.xz", chunk_artifacts[0]["glob"])
