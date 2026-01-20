import pytest

pytestmark = pytest.mark.asyncio

SOME_CLIENT_HINTS = {
    "brands": [{"brand": "Brand", "version": "1.0"}],
    "fullVersionList": [{"brand": "Brand", "version": "1.0.0.0"}],
    "mobile": True,
    "model": "Model",
    "platform": "Platform",
    "platformVersion": "1.0.0",
    "architecture": "Arch",
    "bitness": "64",
    "wow64": False
}


async def test_set_override_and_reset(bidi_session, top_context,
        default_client_hints, assert_client_hints):
    await assert_client_hints(top_context, default_client_hints)

    await bidi_session.emulation.set_client_hints_override(
        client_hints=SOME_CLIENT_HINTS
    )
    await assert_client_hints(top_context, SOME_CLIENT_HINTS)

    await bidi_session.emulation.set_client_hints_override(
        client_hints=None
    )

    await assert_client_hints(top_context, default_client_hints)
