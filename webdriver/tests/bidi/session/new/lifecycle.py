import pytest

from webdriver.bidi.error import SessionNotCreatedException
from webdriver.transport import HTTPWireProtocol


pytestmark = pytest.mark.asyncio


async def test_on_associated_connection_does_not_replace_session(
    bidi_only_session,
):
    with pytest.raises(SessionNotCreatedException):
        await bidi_only_session.session.new(
            capabilities={"alwaysMatch": {"acceptInsecureCerts": "invalid"}}
        )

    contexts = await bidi_only_session.browsing_context.get_tree()
    assert contexts


async def test_bidi_only_session_is_not_accessible_over_http(
    bidi_only_session, configuration
):
    transport = HTTPWireProtocol(
        configuration["host"], configuration["port"], url_prefix="/"
    )
    try:
        response = transport.send(
            "GET", f"session/{bidi_only_session.session_id}/url"
        )
        assert response.status == 404
        assert response.body["value"]["error"] == "invalid session id"
        assert isinstance(response.body["value"]["message"], str)
        assert isinstance(response.body["value"]["stacktrace"], str)
    finally:
        transport.close()

    contexts = await bidi_only_session.browsing_context.get_tree()
    assert contexts


async def test_end_allows_new_session(bidi_only_session_factory):
    first_session = await bidi_only_session_factory()
    await first_session.session.end()

    replacement_session = await bidi_only_session_factory()
    contexts = await replacement_session.browsing_context.get_tree()

    assert contexts
