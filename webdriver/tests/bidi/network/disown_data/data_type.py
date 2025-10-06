import pytest

import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "data_type_to_remove,data_type_to_keep",
    [("response", "request"), ("request", "response")]
)
async def test_data_type_response_and_request(bidi_session, url,
        setup_collected_request, add_data_collector, data_type_to_remove,
        data_type_to_keep):
    collector = await add_data_collector(collector_type="blob",
                                         data_types=[data_type_to_remove,
                                                     data_type_to_keep],
                                         max_encoded_data_size=1_000)

    [request, _] = await setup_collected_request()
    # Assert all the collected data types are available.
    await bidi_session.network.get_data(request=request,
                                        data_type=data_type_to_remove,
                                        collector=collector)
    await bidi_session.network.get_data(request=request,
                                        data_type=data_type_to_keep,
                                        collector=collector)

    await bidi_session.network.disown_data(request=request,
                                           data_type=data_type_to_remove,
                                           collector=collector)

    # Assert the kept data is still available.
    await bidi_session.network.get_data(request=request,
                                        data_type=data_type_to_keep,
                                        collector=collector)
    # Assert the removed data is no longer available.
    with pytest.raises(error.NoSuchNetworkDataException):
        await bidi_session.network.get_data(request=request,
                                            data_type=data_type_to_remove,
                                            collector=collector)
