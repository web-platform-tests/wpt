import pytest
import asyncio
import websockets
import webdriver

# classic session to enable bidi capability manually
@pytest.mark.asyncio
@pytest.mark.capabilities({"webSocketUrl": True})
async def test_websocket_url_connect(session):
    assert not isinstance(session, webdriver.BidiSession)
    websocket_url = session.capabilities["webSocketUrl"]
    async with websockets.connect(websocket_url) as websocket:
        await websocket.send("Hello world!")
        await websocket.close()

# bidi session following classic session to test session
# recreation in session fixture
# also test send message via websocket and
# close websocket at the end.
@pytest.mark.asyncio
async def test_bidi_session_send_and_close(bidi_session):
    assert isinstance(bidi_session, webdriver.BidiSession)
    await bidi_session.websocket_transport.send("test_bidi_session: send and close")
    await bidi_session.websocket_transport.close()

# test send after close
@pytest.mark.asyncio
async def test_bidi_session_send_after_close(bidi_session):
    await bidi_session.websocket_transport.send("test_bidi_session: send after close")

# bidi session following a bidi session with a different capabilities
# to test session recreation
@pytest.mark.asyncio
@pytest.mark.capabilities({"acceptInsecureCerts": True})
async def test_bidi_session_with_different_capability(bidi_session):
    await bidi_session.websocket_transport.send("test_bidi_session: different capability")

# classic session following a bidi session to test session
# recreation
@pytest.mark.asyncio
def test_classic_after_bidi_session(session):
    assert not isinstance(session, webdriver.BidiSession)
