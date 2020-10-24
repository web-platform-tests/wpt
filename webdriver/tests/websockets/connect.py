import pytest
import asyncio
import websockets

@pytest.mark.asyncio
@pytest.mark.capabilities({"webSocketUrl": True})
async def test_websocket_url_connect(session):
    websocket_url = session.capabilities["webSocketUrl"]
    async with websockets.connect(websocket_url) as websocket:
        await websocket.send("Hello world!")
        await websocket.close()

