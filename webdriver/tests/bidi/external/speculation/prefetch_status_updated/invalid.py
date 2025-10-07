import pytest

from webdriver.bidi.error import InvalidArgumentException, NoSuchFrameException

pytestmark = pytest.mark.asyncio


@pytest.mark.asyncio
async def test_invalid_event_name(bidi_session):
    """Test that subscribing to invalid speculation events raises an error."""
    
    with pytest.raises(InvalidArgumentException):
        await bidi_session.session.subscribe(
            events=["speculation.invalidEvent"]
        )


@pytest.mark.asyncio
async def test_subscribe_with_invalid_context(bidi_session):
    """Test subscribing to prefetch events with invalid context."""
    
    with pytest.raises(NoSuchFrameException):
        await bidi_session.session.subscribe(
            events=["speculation.prefetchStatusUpdated"],
            contexts=["invalid-context-id"]
        )