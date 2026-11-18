import pytest

import webdriver.bidi.error as error
from tests.bidi import get_invalid_cases

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", get_invalid_cases("dict", nullable=True))
async def test_params_file_dialog_behavior_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior=value
        )


@pytest.mark.parametrize("value", get_invalid_cases("string"))
async def test_params_file_dialog_behavior_type_invalid_type(
    bidi_session, value
):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior={"type": value}
        )


async def test_params_file_dialog_behavior_type_invalid_value(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior={"type": "INVALID_TYPE"}
        )


async def test_params_file_dialog_behavior_accept_paths_missing(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior={"type": "accept"}
        )


async def test_params_file_dialog_behavior_accept_paths_empty_list(
    bidi_session,
):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior={"type": "accept", "paths": []}
        )


@pytest.mark.parametrize("value", get_invalid_cases("list"))
async def test_params_file_dialog_behavior_accept_paths_invalid_type(
    bidi_session, value
):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior={"type": "accept", "paths": value}
        )


@pytest.mark.parametrize("value", get_invalid_cases("string"))
async def test_params_file_dialog_behavior_accept_paths_item_invalid_type(
    bidi_session, value
):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior={"type": "accept", "paths": [value]}
        )


@pytest.mark.parametrize("value", get_invalid_cases("list"))
async def test_params_user_contexts_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior=None, user_contexts=value
        )


async def test_params_user_contexts_empty_list(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior=None, user_contexts=[]
        )


@pytest.mark.parametrize("value", get_invalid_cases("string"))
async def test_params_user_contexts_value_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior=None, user_contexts=[value]
        )


async def test_params_user_contexts_value_unknown_user_context(bidi_session):
    with pytest.raises(error.NoSuchUserContextException):
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior=None, user_contexts=["UNKNOWN_USER_CONTEXT"]
        )
