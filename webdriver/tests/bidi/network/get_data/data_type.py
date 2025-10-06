import pytest

from .. import PAGE_EMPTY_TEXT

pytestmark = pytest.mark.asyncio


async def test_data_type_response(bidi_session, url, setup_collected_response):
    [request, collector] = await setup_collected_response(
        fetch_url=url(PAGE_EMPTY_TEXT))
    data = await bidi_session.network.get_data(
        request=request, data_type="response", collector=collector
    )

    assert data["type"] == "string"
    assert data["value"] == "empty\n"


async def test_data_type_request(
        bidi_session, url, add_data_collector, setup_collected_request
):
    [request, collector] = await setup_collected_request(
        fetch_url=url(PAGE_EMPTY_TEXT), post_data="SOME_POST_DATA"
    )

    data = await bidi_session.network.get_data(
        request=request, data_type="request", collector=collector
    )
    assert data["type"] == "string"
    assert data["value"] == "SOME_POST_DATA"

    data_from_other_collector = await bidi_session.network.get_data(
        request=request, data_type="request", collector=collector
    )
    assert data_from_other_collector == data
