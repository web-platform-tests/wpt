from __future__ import absolute_import
from ..data.session import Session, UNKNOWN

def deserialize_sessions(session_dicts):
    sessions = []
    for session_dict in session_dicts:
        session = deserialize_session(session_dict)
        sessions.append(session)
    return sessions

def deserialize_session(session_dict):
    token = u""
    if u"token" in session_dict: token = session_dict[u"token"]
    tests = { "include": [], "exclude": [] }
    if u"tests" in session_dict: tests = session_dict[u"tests"]
    if u"path" in session_dict:
        test_paths = session_dict[u"path"].split(", ")
        tests[u"include"] = tests[u"include"] + test_paths
    types = []
    if u"types" in session_dict: types = session_dict[u"types"]
    user_agent = u""
    if u"user_agent" in session_dict: user_agent = session_dict[u"user_agent"]
    labels = []
    if u"labels" in session_dict: labels = session_dict[u"labels"]
    timeouts = {}
    if u"timeouts" in session_dict: timeouts = session_dict[u"timeouts"]
    pending_tests = None
    if u"pending_tests" in session_dict: pending_tests = session_dict[u"pending_tests"]
    running_tests = None
    if u"running_tests" in session_dict: running_tests = session_dict[u"running_tests"]
    status = UNKNOWN
    if u"status" in session_dict: status = session_dict[u"status"]
    test_state = None
    if u"test_state" in session_dict: test_state = session_dict[u"test_state"]
    last_completed_test = None
    if u"last_completed_test" in session_dict: last_completed_test = session_dict[u"last_completed_test"]
    date_started = None
    if u"date_started" in session_dict: date_started = session_dict[u"date_started"]
    date_finished = None
    if u"date_finished" in session_dict: date_finished = session_dict[u"date_finished"]
    is_public = False
    if u"is_public" in session_dict: is_public = session_dict[u"is_public"]
    reference_tokens = []
    if u"reference_tokens" in session_dict: reference_tokens = session_dict[u"reference_tokens"]
    browser = None
    if u"browser" in session_dict: browser = session_dict[u"browser"]
    webhook_urls = []
    if u"webhook_urls" in session_dict: webhook_urls = session_dict[u"webhook_urls"]
    expiration_date = None
    if u"expiration_date" in session_dict: expiration_date = session_dict[u"expiration_date"]
    malfunctioning_tests = []
    if u"malfunctioning_tests" in session_dict: malfunctioning_tests = session_dict[u"malfunctioning_tests"]

    return Session(
        token=token,
        tests=tests,
        types=types,
        user_agent=user_agent,
        labels=labels,
        timeouts=timeouts,
        pending_tests=pending_tests,
        running_tests=running_tests,
        status=status,
        test_state=test_state,
        last_completed_test=last_completed_test,
        date_started=date_started,
        date_finished=date_finished,
        is_public=is_public,
        reference_tokens=reference_tokens,
        browser=browser,
        webhook_urls=webhook_urls,
        expiration_date=expiration_date,
        malfunctioning_tests=malfunctioning_tests
    )
