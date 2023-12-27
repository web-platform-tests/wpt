import pytest
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio

@pytest.mark.parametrize("descriptor", [False, "SOME_STRING", 42, {}, [], {"name": 23}, None])
async def test_params_descriptor_invalid_type(bidi_session, descriptor):
    with pytest.raises(error.InvalidArgumentException):
      await bidi_session.permissions.set_permission(
         descriptor=descriptor,
         state="granted",
         origin="https://example.com",
      )


@pytest.mark.parametrize("descriptor", [{"name": "unknown"}])
async def test_params_descriptor_invalid_value(bidi_session, descriptor):
    with pytest.raises(error.InvalidArgumentException):
      await bidi_session.permissions.set_permission(
         descriptor=descriptor,
         state="granted",
         origin="https://example.com",
      )


@pytest.mark.parametrize("state", [False, 42, {}, [], None])
async def test_params_state_invalid_type(bidi_session, state):
    with pytest.raises(error.InvalidArgumentException):
      await bidi_session.permissions.set_permission(
         descriptor={"name": "geolocation"},
         state=state,
         origin="https://example.com",
      )


@pytest.mark.parametrize("state", ["UNKOWN", "Granted"])
async def test_params_state_invalid_value(bidi_session, state):
    with pytest.raises(error.InvalidArgumentException):
      await bidi_session.permissions.set_permission(
         descriptor={"name": "geolocation"},
         state=state,
         origin="https://example.com",
      )


@pytest.mark.parametrize("origin", [False, 42, {}, [], None])
async def test_params_origin_invalid_type(bidi_session, origin):
    with pytest.raises(error.InvalidArgumentException):
      await bidi_session.permissions.set_permission(
         descriptor={"name": "geolocation"},
         state="granted",
         origin=origin,
      )
