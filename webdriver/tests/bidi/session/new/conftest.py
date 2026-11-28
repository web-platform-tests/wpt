import copy
from urllib.parse import urlsplit, urlunsplit

import pytest
import pytest_asyncio
import webdriver

from webdriver.bidi.client import BidiSession
import tests.support.fixtures as global_fixtures


@pytest.fixture(scope="module")
def unassociated_websocket_url(configuration):
    current_session = global_fixtures.get_current_session()
    if current_session is not None:
        current_session.end()
        global_fixtures.set_current_session(None)

    capabilities = copy.deepcopy(configuration["capabilities"])
    capabilities["webSocketUrl"] = True
    discovery_session = webdriver.Session(
        configuration["host"],
        configuration["port"],
        capabilities={"alwaysMatch": capabilities},
    )

    discovery_session.start()
    try:
        websocket_url = discovery_session.capabilities["webSocketUrl"]
    finally:
        discovery_session.end()

    parsed_url = urlsplit(websocket_url)
    return urlunsplit((parsed_url.scheme, parsed_url.netloc, "/session", "", ""))


@pytest.fixture
def bidi_only_capabilities(configuration):
    return {"alwaysMatch": copy.deepcopy(configuration["capabilities"])}


@pytest_asyncio.fixture
async def bidi_only_session_factory(
    bidi_only_capabilities, unassociated_websocket_url
):
    sessions = []

    async def create(capabilities=None, start=True):
        if capabilities is None:
            capabilities = copy.deepcopy(bidi_only_capabilities)

        session = BidiSession.bidi_only(
            unassociated_websocket_url,
            requested_capabilities=capabilities,
        )
        sessions.append(session)

        if start:
            await session.start()

        return session

    yield create

    for session in reversed(sessions):
        if session.transport is None:
            continue

        try:
            connection = session.transport.connection
            if (
                session.session_id is not None
                and connection is not None
                and not connection.closed
            ):
                await session.session.end()
        finally:
            await session.end()


@pytest_asyncio.fixture
async def bidi_only_session(bidi_only_session_factory):
    return await bidi_only_session_factory()
