import copy
import json
from urllib.parse import urlsplit, urlunsplit

import pytest
import websockets

import webdriver


pytestmark = pytest.mark.asyncio


@pytest.fixture(scope="module")
def unassociated_websocket_url(configuration):
    capabilities = copy.deepcopy(configuration["capabilities"])
    capabilities["webSocketUrl"] = True
    session = webdriver.Session(
        configuration["host"],
        configuration["port"],
        capabilities={"alwaysMatch": capabilities},
    )

    session.start()
    try:
        websocket_url = session.capabilities["webSocketUrl"]
    finally:
        session.end()

    parsed_url = urlsplit(websocket_url)
    return urlunsplit((parsed_url.scheme, parsed_url.netloc, "/session", "", ""))


async def send_command(websocket, command_id, method):
    await websocket.send(json.dumps({
        "id": command_id,
        "method": method,
        "params": {},
    }))
    return json.loads(await websocket.recv())


def assert_status_response(response, command_id):
    assert response["id"] == command_id
    assert response["type"] == "success"
    assert isinstance(response["result"]["ready"], bool)
    assert isinstance(response["result"]["message"], str)


async def test_status_without_session(unassociated_websocket_url):
    async with websockets.connect(unassociated_websocket_url) as websocket:
        response = await send_command(websocket, 1, "session.status")

    assert_status_response(response, 1)


async def test_session_bound_command_without_session(unassociated_websocket_url):
    async with websockets.connect(unassociated_websocket_url) as websocket:
        response = await send_command(websocket, 1, "browsingContext.getTree")

    assert response["id"] == 1
    assert response["type"] == "error"
    assert response["error"] == "invalid session id"


async def test_unknown_command_without_session(unassociated_websocket_url):
    async with websockets.connect(unassociated_websocket_url) as websocket:
        response = await send_command(websocket, 1, "unknown.command")

    assert response["id"] == 1
    assert response["type"] == "error"
    assert response["error"] == "unknown command"


async def test_close_connection_without_session(unassociated_websocket_url):
    async with websockets.connect(unassociated_websocket_url):
        pass

    async with websockets.connect(unassociated_websocket_url) as websocket:
        response = await send_command(websocket, 1, "session.status")

    assert_status_response(response, 1)
