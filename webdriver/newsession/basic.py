# META: timeout=long

import uuid

import pytest

from webdriver import error
from util.newsession import new_session


def test_basic(_function_session):
    resp = new_session(_function_session, {"capabilities": {}})
    assert set(resp.keys()) == {"sessionId", "capabilities"}


def test_repeat_new_session(_function_session):
    resp = new_session(_function_session, {"capabilities": {}})
    with pytest.raises(error.SessionNotCreatedException):
        new_session(_function_session, {"capabilities": {}})


def test_no_capabilites(_function_session):
    with pytest.raises(error.InvalidArgumentException):
        new_session(_function_session, {})


def test_missing_first_match(_function_session):
    resp = new_session(_function_session, {"capabilities": {"alwaysMatch": {}}})


def test_missing_always_match(_function_session):
    resp = new_session(_function_session, {"capabilities": {"firstMatch": [{}]}})


def test_desired(_function_session):
    with pytest.raises(error.InvalidArgumentException):
        resp = new_session(_function_session, {"desiredCapbilities": {}})


def test_required(_function_session):
    with pytest.raises(error.InvalidArgumentException):
        resp = new_session(_function_session, {"requiredCapbilities": {}})


def test_required_desired(_function_session):
    with pytest.raises(error.InvalidArgumentException):
        resp = new_session(_function_session, {"requiredCapbilities": {},
                                               "desiredCapbilities": {}})


def test_ignore_required(_function_session):
    new_session(_function_session, {"capabilities": {"requiredCapbilities": {"browserName": "invalid"}}})


def test_ignore_desired(_function_session):
    resp = new_session(_function_session, {"capabilities": {"desiredCapbilities": {"pageLoadStrategy": "eager"}}})
    assert resp["capabilities"]["pageLoadStrategy"] == "normal"
