import asyncio
import pytest

from tests.bidi.input.file_dialog_opened import assert_file_dialog_opened_event

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_cancel_file_dialog(
    bidi_session, new_tab, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )

    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "cancel", "files": []}


async def test_cancel_emits_file_dialog_opened_event(
    bidi_session,
    subscribe_events,
    wait_for_event,
    wait_for_future_safe,
    new_tab,
    trigger_input_file_dialog,
):
    await subscribe_events(events=[FILE_DIALOG_OPENED_EVENT])
    on_opened = wait_for_event(FILE_DIALOG_OPENED_EVENT)

    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )

    dialog_task = asyncio.create_task(
        trigger_input_file_dialog(new_tab, multiple=False)
    )
    event = await wait_for_future_safe(on_opened)
    assert_file_dialog_opened_event(
        event, new_tab["context"], "default", multiple=False
    )

    result = await dialog_task
    assert result == {"event": "cancel", "files": []}
