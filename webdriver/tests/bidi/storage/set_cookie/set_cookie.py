import pytest
from webdriver.bidi.modules.network import NetworkStringValue
from webdriver.bidi.modules.script import ContextTarget
from webdriver.bidi.modules.storage import PartialCookie, BrowsingContextPartitionDescriptor

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "protocol",
    [
        "http",
        "https",
    ],
)
async def test_set_cookie_protocol(bidi_session, top_context, inline, origin, domain_value, protocol):
    # Navigate to a page with a required protocol.
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=(inline("<div>foo</div>", protocol=protocol)), wait="complete"
    )

    set_cookie_result = await bidi_session.storage.set_cookie(
        cookie=PartialCookie(
            name='foo',
            value=NetworkStringValue('bar'),
            domain=domain_value(),
            secure=True
        ),
        partition=BrowsingContextPartitionDescriptor(top_context["context"]))

    assert set_cookie_result == {
        'partitionKey': {
            'sourceOrigin': origin(protocol)
        },
    }

    # TODO: Assert the cookie is actually set after `Storage.getCookies` is implemented.
