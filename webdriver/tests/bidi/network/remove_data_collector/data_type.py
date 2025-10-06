import pytest

import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


async def test_data_type_response(
        bidi_session, url, add_data_collector, setup_collected_response
):
    request_collector = await add_data_collector(
        collector_type="blob", data_types=["request"],
        max_encoded_data_size=1_000
    )

    [request, response_collector] = await setup_collected_response()

    # Remove the request collector.
    await bidi_session.network.remove_data_collector(
        collector=request_collector)

    # Response data still available.
    await bidi_session.network.get_data(request=request, data_type="response")

    # Request data no longer available.
    with pytest.raises(error.NoSuchNetworkDataException):
        await bidi_session.network.get_data(request=request,
                                            data_type="request")

    # Remove the response collector.
    await bidi_session.network.remove_data_collector(
        collector=response_collector)

    # Response data no longer available.
    with pytest.raises(error.NoSuchNetworkDataException):
        await bidi_session.network.get_data(request=request,
                                            data_type="response")


async def test_data_type_request(
        bidi_session, url, add_data_collector, setup_collected_request
):
    response_collector = await add_data_collector(
        collector_type="blob", data_types=["response"],
        max_encoded_data_size=1_000
    )

    [request, request_collector] = await setup_collected_request()

    # Remove the response collector.
    await bidi_session.network.remove_data_collector(
        collector=response_collector)

    # Response data no longer available.
    with pytest.raises(error.NoSuchNetworkDataException):
        await bidi_session.network.get_data(request=request,
                                            data_type="response")

    # Request data still available.
    await bidi_session.network.get_data(request=request, data_type="request")

    # Remove the request collector.
    await bidi_session.network.remove_data_collector(
        collector=request_collector)

    # Request data no longer available.
    with pytest.raises(error.NoSuchNetworkDataException):
        await bidi_session.network.get_data(request=request,
                                            data_type="request")


async def test_data_type_request_and_response(
        bidi_session, url, add_data_collector, setup_collected_request
):
    collector = await add_data_collector(
        collector_type="blob", data_types=["response", "request"],
        max_encoded_data_size=1_000
    )

    [request, other_collector] = await setup_collected_request()
    # Remove the collector created by helper.
    await bidi_session.network.remove_data_collector(collector=other_collector)

    # Assert data is still available.
    await bidi_session.network.get_data(request=request, data_type="request")
    await bidi_session.network.get_data(request=request, data_type="response")

    # Remove the collector.
    await bidi_session.network.remove_data_collector(collector=collector)

    # Response data no longer available.
    with pytest.raises(error.NoSuchNetworkDataException):
        await bidi_session.network.get_data(request=request,
                                            data_type="response")
    # Request data no longer available.
    with pytest.raises(error.NoSuchNetworkDataException):
        await bidi_session.network.get_data(request=request,
                                            data_type="response")
