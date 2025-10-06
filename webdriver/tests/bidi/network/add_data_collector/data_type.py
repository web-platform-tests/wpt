import pytest

from .. import PAGE_EMPTY_TEXT, RESPONSE_COMPLETED_EVENT, \
    BEFORE_REQUEST_SENT_EVENT

pytestmark = pytest.mark.asyncio


async def test_data_type_response(bidi_session, add_data_collector,
        setup_network_test, wait_for_event, wait_for_future_safe, url, fetch):
    context = await bidi_session.browsing_context.create(type_hint="tab")
    await setup_network_test(
        events=[RESPONSE_COMPLETED_EVENT], context=context["context"]
    )

    collector = await add_data_collector(max_encoded_data_size=100_000,
                                         data_types=["response"])

    # Trigger a request and wait for the response.
    on_response_completed = wait_for_event(RESPONSE_COMPLETED_EVENT)
    await fetch(url(PAGE_EMPTY_TEXT), context=context)
    event = await wait_for_future_safe(on_response_completed)
    request = event["request"]["request"]

    # Assert response data can be retrieved.
    await bidi_session.network.get_data(
        request=request, data_type="response", collector=collector
    )


async def test_data_type_request(bidi_session, add_data_collector,
        setup_network_test, wait_for_event, wait_for_future_safe, url, fetch):
    context = await bidi_session.browsing_context.create(type_hint="tab")
    await setup_network_test(
        events=[BEFORE_REQUEST_SENT_EVENT], context=context["context"]
    )

    collector = await add_data_collector(max_encoded_data_size=100_000,
                                         data_types=["request"])

    # Trigger a request.
    on_response_completed = wait_for_event(BEFORE_REQUEST_SENT_EVENT)
    await fetch(url(PAGE_EMPTY_TEXT), context=context, method="POST",
                post_data="SOME_POST_DATA")
    event = await wait_for_future_safe(on_response_completed)
    request = event["request"]["request"]

    # Assert request data can be retrieved.
    await bidi_session.network.get_data(
        request=request, data_type="request", collector=collector
    )


async def test_data_type_request_and_response(bidi_session, add_data_collector,
        setup_network_test, wait_for_event, wait_for_future_safe, url, fetch):
    context = await bidi_session.browsing_context.create(type_hint="tab")
    await setup_network_test(
        events=[RESPONSE_COMPLETED_EVENT], context=context["context"]
    )

    collector = await add_data_collector(max_encoded_data_size=100_000,
                                         data_types=["response", "request"])

    # Trigger a request with post data and wait for the response.
    on_response_completed = wait_for_event(RESPONSE_COMPLETED_EVENT)
    await fetch(url(PAGE_EMPTY_TEXT), context=context, method="POST",
                post_data="SOME_POST_DATA")
    event = await wait_for_future_safe(on_response_completed)
    request = event["request"]["request"]

    # Assert request data can be retrieved.
    await bidi_session.network.get_data(
        request=request, data_type="request", collector=collector
    )
    # Assert response data can be retrieved.
    await bidi_session.network.get_data(
        request=request, data_type="response", collector=collector
    )
