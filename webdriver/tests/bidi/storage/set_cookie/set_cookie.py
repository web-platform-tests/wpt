import pytest
from webdriver.bidi.modules.storage import PartialCookie, BrowsingContextPartitionDescriptor
from webdriver.bidi.modules.network import StringValue

pytestmark = pytest.mark.asyncio


async def test_set_cookie_secure_context(bidi_session, top_context, inline, origin, domain_value, server_config):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=(inline("<div>foo</div>")), wait="complete"
    )

    set_cookie_result = await bidi_session.storage.set_cookie(
        cookie=PartialCookie(
            name='foo',
            value=StringValue('bar'),
            domain=domain_value(),
            secure=True
        ),
        partition=BrowsingContextPartitionDescriptor(top_context["context"]))

    assert set_cookie_result == {
        'partitionKey': {
            'sourceOrigin': origin()
        },
    }
