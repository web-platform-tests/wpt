import pytest
from .. import assert_cookie_is_set, create_cookie

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "domain_key, subdomain_key",
    [
        ("", ""),
        ("", "www"),
        ("alt", ""),
        ("alt", "www"),
    ])
async def test_cookie_domain(bidi_session, top_context, test_page, server_config, domain_value, domain_key,
                             subdomain_key):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(context=top_context["context"], url=test_page, wait="complete")

    domain = domain_value(domain_key, subdomain_key)

    await bidi_session.storage.set_cookie(cookie=create_cookie(domain=domain))
    await assert_cookie_is_set(bidi_session, domain=domain)
