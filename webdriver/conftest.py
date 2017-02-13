import os

import pytest
import webdriver

from util.fixtures import session, create_window, create_frame
from util.http_request import HTTPRequest

default_host = "http://127.0.0.1"
default_port = "4444"

@pytest.fixture(scope="session")
def _session(request):
    host = os.environ.get("WD_HOST", default_host)
    port = int(os.environ.get("WD_PORT", default_port))

    session = webdriver.Session(host, port)

    def destroy():
        if session.session_id is not None:
            session.end()

    request.addfinalizer(destroy)

    return session

@pytest.fixture(scope="function")
def http(session):
    return HTTPRequest(session.transport.host, session.transport.port)

pytest.fixture(scope="function")(session)

pytest.fixture()(create_window)

pytest.fixture()(create_frame)
