import pytest
import sys

import webdriver

from util.newsession import new_session


def product(a, b):
    return [(a, item) for item in b]


def flatten(l):
    return [item for x in l for item in x]


@pytest.fixture(scope="session")
def browser_settings(configuration):
    # Start a session to try and get some self-reported values for capabilities
    session = webdriver.Session(configuration["host"],
                                configuration["port"],
                                desired_capabilities=configuration["capabilities"])
    try:
        resp = new_session(session, {"capabilities": {}})
        return {
            "browserName": resp["capabilities"]["browserName"],
            "browserVersion": resp["capabilities"]["browserVersion"],
            "platformName": resp["capabilities"]["platformName"]
        }
    except Exception as e:
        return None
    finally:
        if session.session_id is not None:
            session.end()


@pytest.fixture(scope="session")
def platform_name():
    return {
        "linux2": "linux",
        "win32": "windows",
        "cygwin": "windows",
        "darwin": "mac"
    }.get(sys.platform)
