import json
import os
import re
from copy import deepcopy

import six
import yaml
from six import iteritems

here = os.path.dirname(__file__)

def load_task_file(path):
    with open(path) as f:
        return yaml.safe_load(f)


def update_recursive(data, update_data):
    for key, value in iteritems(update_data):
        if key not in data:
            data[key] = value
        else:
            initial_value = data[key]
            if isinstance(value, dict):
                if not isinstance(initial_value, dict):
                    import pdb
                    pdb.set_trace()
                    raise ValueError
                update_recursive(initial_value, value)
            elif isinstance(value, list):
                if not isinstance(initial_value, list):
                    import pdb
                    pdb.set_trace()
                    raise ValueError
                initial_value.extend(value)
            else:
                data[key] = value


def resolve_use(task_data, templates):
    rv = {}
    if "use" in task_data:
        for template_name in task_data["use"]:
            update_recursive(rv, deepcopy(templates[template_name]))
    update_recursive(rv, task_data)
    rv.pop("use", None)
    return rv


def resolve_name(task_data, default_name):
    if "name" not in task_data:
        task_data["name"] = default_name
    return task_data


def resolve_chunks(task_data):
    if "chunks" not in task_data:
        return [task_data]
    rv = []
    total_chunks = task_data["chunks"]
    for i in range(1, total_chunks + 1):
        chunk_data = deepcopy(task_data)
        chunk_data["chunks"] = {"id": i,
                                "total": total_chunks}
        rv.append(chunk_data)
    return rv


def replace_vars(input_string, variables):
    variable_re = re.compile(r"(?<!\\)\${([^}]+)}")

    def replacer(m):
        var = m.group(1).split(".")
        repl = variables
        for part in var:
            try:
                repl = repl[part]
            except Exception:
                # Don't substitute
                return m.group(0)
        return str(repl)

    return variable_re.sub(replacer, input_string)


def sub_variables(data, variables):
    if isinstance(data, six.string_types):
        return replace_vars(data, variables)
    if isinstance(data, list):
        return [sub_variables(item, variables) for item in data]
    if isinstance(data, dict):
        return {key: sub_variables(value, variables)
                for key, value in iteritems(data)}
    return data


def substitute_variables(task):
    variables = {"vars": task.get("vars", {}),
                 "chunks": task.get("chunks", {})}

    return sub_variables(task, variables)


def expand_maps(task):
    name = task.keys()[0]
    if name != "$map":
        return [task]

    map_data = task["$map"]
    assert set(map_data.keys()) == set(["for", "do"])
    rv = []
    for for_data in map_data["for"]:
        do_values = expand_maps(map_data["do"])
        for do_data in do_values:
            task_data = deepcopy(for_data)
            assert len(do_data.keys()) == 1
            name = do_data.keys()[0]
            update_recursive(task_data, deepcopy(do_data[name]))
            rv.append({name: task_data})
    return rv


def load_tasks(tasks_data):
    map_resolved_tasks = {}
    tasks = []

    for task in tasks_data["tasks"]:
        assert len(task.keys()) == 1
        for task in expand_maps(task):
            assert len(task.keys()) == 1
            name = task.keys()[0]
            data = task[name]
            new_name = sub_variables(name, {"vars": data.get("vars", {})})
            if new_name in map_resolved_tasks:
                raise ValueError("Got duplicate task name %s" % new_name)
            map_resolved_tasks[new_name] = substitute_variables(data)

    for task_default_name, data in iteritems(map_resolved_tasks):
        task = resolve_use(data, tasks_data["components"])
        task = resolve_name(task, task_default_name)
        tasks.extend(resolve_chunks(task))

    tasks = [substitute_variables(task_data) for task_data in tasks]
    return {task["name"]: task for task in tasks}


def load_tasks_from_path(path):
    return load_tasks(load_task_file(path))


def run(venv, **kwargs):
    print(json.dumps(load_tasks_from_path(os.path.join(here, "tasks/test.yml")), indent=2))
