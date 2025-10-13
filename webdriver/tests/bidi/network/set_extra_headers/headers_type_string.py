import pytest

pytestmark = pytest.mark.asyncio


async def test_set_and_remove_headers(bidi_session, top_context,
        prepare_context, get_headers_methods_invariant, url, set_extra_headers):
    await prepare_context(top_context)

    original_headers = await get_headers_methods_invariant(top_context)
    await set_extra_headers(
        headers=[{
            "name": "some_header_name",
            "value": {
                "type": "string",
                "value": "some_header_value"
            }}],
        contexts=[top_context["context"]])
    new_headers = await get_headers_methods_invariant(top_context)
    assert new_headers["some_header_name"] == ["some_header_value"]

    await set_extra_headers(headers=[], contexts=[top_context["context"]])
    assert original_headers == await get_headers_methods_invariant(top_context)
