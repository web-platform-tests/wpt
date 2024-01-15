import pytest
from webdriver.bidi.modules.network import NetworkStringValue
from webdriver.bidi.modules.storage import PartialCookie, StorageKeyPartitionDescriptor
from .. import assert_cookie_is_set, PROTOCOL_HTTPS

pytestmark = pytest.mark.asyncio

COOKIE_NAME = 'SOME_COOKIE_NAME'
COOKIE_VALUE = 'SOME_COOKIE_VALUE'


async def test_storage_key_partition_source_origin(bidi_session, top_context, inline, origin, domain_value):
    # Navigate to a secure context.
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=(inline("<div>foo</div>", protocol=PROTOCOL_HTTPS)), wait="complete"
    )

    source_origin = origin(PROTOCOL_HTTPS)
    partition = StorageKeyPartitionDescriptor(source_origin=source_origin)

    set_cookie_result = await bidi_session.storage.set_cookie(
        cookie=PartialCookie(
            name=COOKIE_NAME,
            value=NetworkStringValue(COOKIE_VALUE),
            domain=domain_value(),
            secure=True
        ),
        partition=partition)

    assert set_cookie_result == {
        'partitionKey': {
            'sourceOrigin': source_origin
        },
    }

    await assert_cookie_is_set(bidi_session, name=COOKIE_NAME, str_value=COOKIE_VALUE,
                               domain=domain_value(), partition=partition)

# TODO: test `StorageKeyPartitionDescriptor.userContext` parameter.
