import pytest
from .. import assert_cookie_is_set, create_cookie

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "protocol",
    [
        "http",
        "https",
    ]
)
async def test_page_protocols(bidi_session, top_context, get_test_page, domain_value, protocol):
    # Navigate to a page with a required protocol.
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=get_test_page(protocol=protocol), wait="complete"
    )

    set_cookie_result = await bidi_session.storage.set_cookie(cookie=create_cookie(domain=domain_value()))

    assert set_cookie_result == {
        'partitionKey': {},
    }

    # Assert the cookie is actually set.
    await assert_cookie_is_set(bidi_session, domain=domain_value())
