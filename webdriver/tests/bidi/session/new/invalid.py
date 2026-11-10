import pytest

from webdriver.bidi.error import InvalidArgumentException


pytestmark = pytest.mark.asyncio


async def test_invalid_capabilities_leave_connection_reusable(
    bidi_only_capabilities, bidi_only_session_factory
):
    bidi_session = await bidi_only_session_factory(start=False)
    await bidi_session.start_transport()

    with pytest.raises(InvalidArgumentException):
        await bidi_session.session.new(
            capabilities={"alwaysMatch": {"acceptInsecureCerts": "invalid"}}
        )

    session_id, capabilities = await bidi_session.session.new(
        capabilities=bidi_only_capabilities
    )
    bidi_session.session_id = session_id
    bidi_session.capabilities = capabilities

    contexts = await bidi_session.browsing_context.get_tree()
    assert contexts
