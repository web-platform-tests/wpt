import pytest

pytestmark = pytest.mark.asyncio


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


async def test_nonexistent_or_directory_path_cancels_file_input(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [f"{temp_files['root']}/does_not_exist.txt"],
        }
    )
    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "cancel", "files": []}

    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["subdir"]],
        }
    )
    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "cancel", "files": []}
