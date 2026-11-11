# mypy: allow-untyped-defs

# DEBUG(wpt#62901): pytest plugin that records the timing of the phases of
# wdspec and aamtest tests, to measure what enabling accessibility adds to
# them.  Records are appended as JSON lines to the file named by
# WPT_DEBUG_TIMING_LOG; without it, nothing is recorded.  It lives here rather
# than in the tests' support files so that changing it does not make every
# wdspec test "affected" in the stability job.

import json
import os
import sys
import time

import pytest

# Fixtures whose setup is timed: "session" launches the browser when there is
# no session yet, "atspi" makes the first AT-SPI query.
TIMED_FIXTURES = {"session", "atspi"}


def record(phase, test, start, **extra):
    path = os.environ.get("WPT_DEBUG_TIMING_LOG")
    if not path:
        return
    entry = {"phase": phase, "test": test, "start": start,
             "duration": time.time() - start}
    entry.update(extra)
    with open(path, "a") as f:
        f.write(json.dumps(entry) + "\n")


def has_session():
    fixtures = sys.modules.get("tests.support.fixtures")
    session = fixtures.get_current_session() if fixtures else None
    return session is not None and session.session_id is not None


class TimingRecorder:
    @pytest.hookimpl(hookwrapper=True)
    def pytest_fixture_setup(self, fixturedef, request):
        if fixturedef.argname not in TIMED_FIXTURES:
            yield
            return
        extra = {}
        if fixturedef.argname == "session":
            extra["new"] = not has_session()
        start = time.time()
        yield
        record("fixture_" + fixturedef.argname, request.node.nodeid, start, **extra)

    @pytest.hookimpl(hookwrapper=True)
    def pytest_runtest_setup(self, item):
        start = time.time()
        yield
        record("pytest_setup", item.nodeid, start)

    @pytest.hookimpl(hookwrapper=True)
    def pytest_runtest_call(self, item):
        api = getattr(item, "funcargs", {}).get("atspi")
        if api is not None:
            self.wrap_poll(api, item.nodeid)
        start = time.time()
        yield
        record("pytest_call", item.nodeid, start)

    @staticmethod
    def wrap_poll(api, test):
        # Time each poll of ApiWrapper.find_node() and count its attempts.
        poll_for = api._poll_for

        def timed_poll_for(find, error):
            phase = "find_tab" if error.startswith("Timeout looking for url") else "find_node_by_id"
            attempts = [0]

            def counted_find():
                attempts[0] += 1
                return find()

            start = time.time()
            try:
                return poll_for(counted_find, error)
            finally:
                record(phase, test, start, attempts=attempts[0])

        api._poll_for = timed_poll_for
