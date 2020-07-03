import argparse
import logging
import os

import taskcluster


logging.basicConfig()
logger = logging.getLogger()


def check_task_statuses(task_ids):
    """Verifies whether a set of Taskcluster tasks completed successfully or not.

    Returns 0 if all tasks passed completed successfully, 1 otherwise."""

    queue = taskcluster.Queue({'rootUrl': os.environ['TASKCLUSTER_PROXY_URL']})
    ret = 0
    for task in task_ids:
        status = queue.status(task)
        state = status['status']['state']
        if state == 'failed' or state == 'exception':
            logger.error('Task {0} failed with state "{1}"'.format(task, state))
            ret = 1
        elif state != 'completed':
            logger.error('Task {0} had unexpected state "{1}"'.format(task, state))
            ret = 1
    if ret == 0:
        logger.info('All tasks completed successfully')
    return ret


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("tasks", nargs="+",
            help="A set of Taskcluster task ids to verify the state of.")
    return parser


def run(venv, **kwargs):
    return check_task_statuses(kwargs['tasks'])
