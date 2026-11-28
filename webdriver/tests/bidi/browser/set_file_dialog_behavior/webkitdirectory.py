import pytest

pytestmark = pytest.mark.asyncio


async def test_accept_webkitdirectory(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["subdir"]],
        }
    )

    result = await trigger_input_file_dialog(new_tab, webkitdirectory=True)
    assert result == {"event": "change", "files": ["nested.txt"]}


@pytest.mark.parametrize("multiple", [False, True])
async def test_multiple_directories_cancel_webkitdirectory(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog, multiple
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["subdir"], temp_files["subdir2"]],
        }
    )

    # Only one directory can be selected, also with the `multiple` attribute.
    result = await trigger_input_file_dialog(
        new_tab, multiple=multiple, webkitdirectory=True
    )
    assert result == {"event": "cancel", "files": []}


@pytest.mark.parametrize("case", ["file", "nonexistent"])
async def test_unselectable_path_cancels_webkitdirectory(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog, case
):
    unselectable_paths = {
        "file": temp_files["file1"],
        "nonexistent": f"{temp_files['root']}/does_not_exist_dir",
    }
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [unselectable_paths[case]],
        }
    )

    result = await trigger_input_file_dialog(new_tab, webkitdirectory=True)
    assert result == {"event": "cancel", "files": []}
