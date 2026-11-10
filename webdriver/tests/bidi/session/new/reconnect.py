from urllib.parse import urlsplit, urlunsplit

import pytest
from webdriver.bidi.client import BidiSession
from websockets.exceptions import InvalidHandshake


pytestmark = pytest.mark.asyncio


def reconnecting_session(websocket_url, session):
    parsed_url = urlsplit(websocket_url)
    server_url = urlunsplit((parsed_url.scheme, parsed_url.netloc, "", "", ""))
    return BidiSession(
        server_url,
        session_id=session.session_id,
        capabilities=session.capabilities,
    )


async def test_reconnect_after_transport_closed(
    bidi_only_session, unassociated_websocket_url
):
    contexts_before = await bidi_only_session.browsing_context.get_tree()
    reconnected_session = reconnecting_session(
        unassociated_websocket_url, bidi_only_session
    )

    await bidi_only_session.end()

    try:
        await reconnected_session.start()
        contexts_after = await reconnected_session.browsing_context.get_tree()

        assert contexts_after == contexts_before
        await reconnected_session.browser.close()
        await reconnected_session.transport.wait_closed()
    finally:
        await reconnected_session.end()


async def test_ended_session_cannot_reconnect(
    bidi_only_session, unassociated_websocket_url
):
    ended_session = reconnecting_session(
        unassociated_websocket_url, bidi_only_session
    )

    await bidi_only_session.browser.close()
    await bidi_only_session.transport.wait_closed()

    try:
        with pytest.raises(InvalidHandshake):
            await ended_session.start()
    finally:
        await ended_session.end()
