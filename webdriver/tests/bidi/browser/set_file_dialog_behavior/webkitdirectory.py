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


@pytest.mark.parametrize(
    "case", ["file", "multiple_directories", "nonexistent", "relative"]
)
async def test_unselectable_paths_cancel_webkitdirectory(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog, case
):
    paths_by_case = {
        "file": [temp_files["file1"]],
        "multiple_directories": [temp_files["subdir"], temp_files["subdir2"]],
        "nonexistent": [f"{temp_files['root']}/does_not_exist_dir"],
        "relative": ["relative/subdir"],
    }
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": paths_by_case[case],
        }
    )

    result = await trigger_input_file_dialog(new_tab, webkitdirectory=True)
    assert result == {"event": "cancel", "files": []}
