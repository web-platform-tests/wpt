import asyncio
import pytest

from tests.bidi.input.file_dialog_opened import assert_file_dialog_opened_event

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_accept_single_file(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        }
    )

    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "change", "files": ["file1.txt"]}

    # Behavior persists across subsequent file dialog invocations.
    result_again = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result_again == {"event": "change", "files": ["file1.txt"]}


async def test_accept_multiple_files(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"], temp_files["file2"]],
        }
    )

    result = await trigger_input_file_dialog(new_tab, multiple=True)
    assert result == {"event": "change", "files": ["file1.txt", "file2.txt"]}


async def test_accept_single_file_for_multiple_input(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        }
    )

    result = await trigger_input_file_dialog(new_tab, multiple=True)
    assert result == {"event": "change", "files": ["file1.txt"]}


async def test_multiple_paths_for_single_file_input_cancels_dialog(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"], temp_files["file2"]],
        }
    )

    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "cancel", "files": []}


@pytest.mark.parametrize("case", ["nonexistent", "directory", "relative"])
async def test_unselectable_path_cancels_file_input(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog, case
):
    unselectable_paths = {
        "nonexistent": f"{temp_files['root']}/does_not_exist.txt",
        "directory": temp_files["subdir"],
        "relative": "relative/file1.txt",
    }
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [unselectable_paths[case]],
        }
    )

    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "cancel", "files": []}


@pytest.mark.capabilities(
    {"unhandledPromptBehavior": {"file": "dismiss", "default": "ignore"}}
)
async def test_accept_overrides_unhandled_prompt_behavior_and_reset(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        }
    )

    # Configured file dialog behavior takes precedence over unhandledPromptBehavior.
    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "change", "files": ["file1.txt"]}

    # Resetting to None restores unhandledPromptBehavior ("dismiss").
    await bidi_session.browser.set_file_dialog_behavior(file_dialog_behavior=None)
    result_after_reset = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result_after_reset == {"event": "cancel", "files": []}


@pytest.mark.parametrize("multiple", [False, True])
async def test_accept_emits_file_dialog_opened_event(
    bidi_session,
    subscribe_events,
    wait_for_event,
    wait_for_future_safe,
    new_tab,
    temp_files,
    trigger_input_file_dialog,
    multiple,
):
    await subscribe_events(events=[FILE_DIALOG_OPENED_EVENT])
    on_opened = wait_for_event(FILE_DIALOG_OPENED_EVENT)

    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        }
    )

    dialog_task = asyncio.create_task(
        trigger_input_file_dialog(new_tab, multiple=multiple)
    )
    event = await wait_for_future_safe(on_opened)
    assert_file_dialog_opened_event(
        event, new_tab["context"], "default", multiple=multiple
    )

    result = await dialog_task
    assert result == {"event": "change", "files": ["file1.txt"]}
