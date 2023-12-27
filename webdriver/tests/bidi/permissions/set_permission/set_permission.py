import pytest
import webdriver.bidi.error as error

from . import get_context_origin, get_permission_state

pytestmark = pytest.mark.asyncio

@pytest.mark.asyncio
async def test_set_permission(bidi_session, new_tab, url):
    test_url = url("/common/blank.html", protocol="https")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_url,
        wait="complete",
    )

    origin = await get_context_origin(bidi_session, new_tab)

    assert await get_permission_state(bidi_session, new_tab,  "geolocation") == "prompt"

    await bidi_session.permissions.set_permission(
        descriptor={"name": "geolocation"},
        state="granted",
        origin=origin,
    )

    assert await get_permission_state(bidi_session, new_tab,  "geolocation") == "granted"

    await bidi_session.permissions.set_permission(
        descriptor={"name": "geolocation"},
        state="denied",
        origin=origin,
    )

    assert await get_permission_state(bidi_session, new_tab,  "geolocation") == "denied"

    await bidi_session.permissions.set_permission(
        descriptor={"name": "geolocation"},
        state="prompt",
        origin=origin,
    )

    assert await get_permission_state(bidi_session, new_tab,  "geolocation") == "prompt"


@pytest.mark.asyncio
async def test_set_permission_insecure_context(bidi_session, new_tab, url):
    test_url = url("/common/blank.html", protocol="http")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_url,
        wait="complete",
    )

    origin = await get_context_origin(bidi_session, new_tab)

    with pytest.raises(error.InvalidArgumentException):
      await bidi_session.permissions.set_permission(
          descriptor={"name": "push"},
          state="granted",
          origin=origin,
      )
