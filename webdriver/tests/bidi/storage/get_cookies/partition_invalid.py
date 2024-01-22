import pytest
import webdriver.bidi.error as error

from webdriver.bidi.modules.storage import BrowsingContextPartitionDescriptor

pytestmark = pytest.mark.asyncio


async def test_partition_invalid_context(bidi_session):
    with pytest.raises(error.NoSuchFrameException):
        await bidi_session.storage.get_cookies(
            partition=BrowsingContextPartitionDescriptor("foo")
        )
