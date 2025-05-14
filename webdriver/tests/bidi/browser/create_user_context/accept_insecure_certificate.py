import pytest

from .. import get_user_context_ids

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("accept_insecure_certificate", [True, False])
async def test_create_context(bidi_session, create_user_context,
        accept_insecure_certificate):
    user_context = await create_user_context(
        accept_insecure_certificate=accept_insecure_certificate)
    # TODO: check the parameter is respected.
    assert user_context in await get_user_context_ids(bidi_session)
