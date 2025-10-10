import pytest

pytestmark = pytest.mark.asyncio


async def test_set_and_remove_headers(bidi_session, top_context,
        get_headers_methods_invariant):
    original_headers = await get_headers_methods_invariant(top_context)
    await bidi_session.network.set_extra_headers(
        headers=[{
            "name": "some_header_name",
            "value": {
                "type": "string",
                "value": "some_header_value"
            }}])
    new_headers = await get_headers_methods_invariant(top_context)
    assert new_headers["some_header_name"] == ["some_header_value"]

    await bidi_session.network.set_extra_headers(headers=[])
    assert original_headers == await get_headers_methods_invariant(top_context)


@pytest.mark.parametrize(
    "header_name, header_value",
    [
        # General purpose
        ("user-agent", "some nonsense value"),
        ("referer", "some nonsense value"),
        ("referer", "https://some_valid_url.com/"),
        ("accept", "application/json"),
        ("accept", "some nonsense value"),
        ("accept-language", "some nonsense value"),
        # Caching
        ("if-none-match", 'some nonsense value'),
        # Authentication
        ("authorization", "some nonsense value"),
        ("cookie", "some nonsense value="),
        # Custom
        ("x-request-id", "some nonsense value"),
        ("x-unicode-value", "你好世界"),
        # Protected headers.
        ("host", 'some nonsense value'),
        ("host", "example.com"),
        ("connection", "some nonsense value"),
        ("origin", "some nonsense value"),
        ("keep-alive", "some nonsense value"),
        ("keep-alive", "timeout=5, max=200"),
        # Protected prefixes
        ("sec-custom-header", "some nonsense value"),
        ("proxy-custom-header", "some nonsense value"),
    ],
)
async def test_set_special_headers(bidi_session, top_context, header_name,
        header_value, get_headers_methods_invariant):
    await bidi_session.network.set_extra_headers(
        headers=[{
            "name": header_name,
            "value": {
                "type": "string",
                "value": header_value
            }}])
    new_headers = await get_headers_methods_invariant(top_context)
    assert new_headers[header_name] == [header_value]
