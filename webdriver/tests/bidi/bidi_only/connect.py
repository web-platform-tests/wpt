import pytest
import asyncio
import websockets
import webdriver

@pytest.mark.asyncio
async def test_session_status(bidi_session):
    command = await bidi_session.send_command("session.status", {})
    result = await command
    assert result == {'message': 'ready', 'ready': True}
