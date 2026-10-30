import pytest


pytestmark = pytest.mark.asyncio


async def test_result(bidi_only_session):
    assert isinstance(bidi_only_session.session_id, str)

    capabilities = bidi_only_session.capabilities
    assert isinstance(capabilities, dict)
    assert isinstance(capabilities["acceptInsecureCerts"], bool)
    assert isinstance(capabilities["browserName"], str)
    assert isinstance(capabilities["browserVersion"], str)
    assert isinstance(capabilities["platformName"], str)
    assert isinstance(capabilities["setWindowRect"], bool)
    assert isinstance(capabilities["userAgent"], str)


async def test_connection_is_associated_before_response(bidi_only_session):
    contexts = await bidi_only_session.browsing_context.get_tree()

    assert contexts
