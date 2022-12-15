import pytest

pytestmark = pytest.mark.asyncio


async def test_top_level_context_has_the_same_ids(top_context, current_session):
    assert top_context["context"] == current_session.window_handle
