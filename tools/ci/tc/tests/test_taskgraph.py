# mypy: allow-untyped-defs

import pytest
import yaml

from tools.ci.tc import taskgraph

@pytest.mark.parametrize("data, update_data, expected", [
    ({"a": 1}, {"b": 2}, {"a": 1, "b": 2}),
    ({"a": 1}, {"a": 2}, {"a": 2}),
    ({"a": [1]}, {"a": [2]}, {"a": [1, 2]}),
    ({"a": {"b": 1, "c": 2}}, {"a": {"b": 2, "d": 3}}, {"a": {"b": 2, "c": 2, "d": 3}}),
    ({"a": {"b": [1]}}, {"a": {"b": [2]}}, {"a": {"b": [1, 2]}}),
]
)
def test_update_recursive(data, update_data, expected):
    taskgraph.update_recursive(data, update_data)
    assert data == expected


def test_use():
    data = """
components:
  component1:
    a: 1
    b: [1]
    c: "c"
  component2:
    a: 2
    b: [2]
    d: "d"
tasks:
  - task1:
      use:
       - component1
       - component2
      b: [3]
      c: "e"
"""
    tasks_data = yaml.safe_load(data)
    assert taskgraph.load_tasks(tasks_data, {}) == {
        "task1": {
            "a": 2,
            "b": [1,2,3],
            "c": "e",
            "d": "d",
            "name": "task1"
        }
    }


def test_var():
    data = """
components:
  component1:
    a: ${vars.value}
tasks:
  - task1:
      use:
       - component1
      vars:
        value: 1
"""
    tasks_data = yaml.safe_load(data)
    assert taskgraph.load_tasks(tasks_data, {}) == {
        "task1": {
            "a": "1",
            "vars": {"value": 1},
            "name": "task1"
        }
    }


def test_map():
    data = """
components: {}
tasks:
 - $map:
     for:
       - vars:
           a: 1
         b: [1]
       - vars:
           a: 2
         b: [2]
     do:
       - task1-${vars.a}:
           a: ${vars.a}
           b: [3]
       - task2-${vars.a}:
           a: ${vars.a}
           b: [4]
"""
    tasks_data = yaml.safe_load(data)
    assert taskgraph.load_tasks(tasks_data, {}) == {
        "task1-1": {
            "a": "1",
            "b": [1, 3],
            "vars": {"a": 1},
            "name": "task1-1"
        },
        "task1-2": {
            "a": "2",
            "b": [2, 3],
            "vars": {"a": 2},
            "name": "task1-2"
        },
        "task2-1": {
            "a": "1",
            "b": [1, 4],
            "vars": {"a": 1},
            "name": "task2-1"
        },
        "task2-2": {
            "a": "2",
            "b": [2, 4],
            "vars": {"a": 2},
            "name": "task2-2"
        },

    }


@pytest.mark.parametrize("chunks", [0, 1, 2, 3])
def test_chunk_count_and_numbering(chunks):
    task_data = {"vars": {"suite": "testharness"}, "name": "test-task"}
    config = {
        "defaults": {"timeout": 120},
        "test_types": {"testharness": {"chunks": chunks}},
    }
    result = taskgraph.resolve_chunks(task_data, config)
    assert result == [
        {
            "vars": {"suite": "testharness"},
            "name": "test-task",
            "chunks": {"id": i, "total": chunks},
            "maxRunTime": 120 * 60,
        }
        for i in range(1, chunks + 1)
    ]


def test_resolve_chunks_no_suite():
    task_data = {"vars": {"browser": "firefox"}, "name": "stability-task"}
    config = {"defaults": {"timeout": 120}, "test_types": {}}
    result = taskgraph.resolve_chunks(task_data, config)
    assert result == [task_data]


@pytest.mark.parametrize(
    "per_type_timeout,default_timeout,expected_max_run_time",
    [
        (240, 120, 240 * 60),
        (None, 120, 120 * 60),
    ],
)
def test_timeout(per_type_timeout, default_timeout, expected_max_run_time):
    task_data = {"vars": {"suite": "testharness"}, "name": "test-task"}
    config = {
        "defaults": {"timeout": default_timeout},
        "test_types": {
            "testharness": {"chunks": 1},
        },
    }
    if per_type_timeout is not None:
        config["test_types"]["testharness"]["timeout"] = per_type_timeout
    result = taskgraph.resolve_chunks(task_data, config)
    assert result == [
        {
            "vars": {"suite": "testharness"},
            "name": "test-task",
            "chunks": {"id": 1, "total": 1},
            "maxRunTime": expected_max_run_time,
        }
    ]
