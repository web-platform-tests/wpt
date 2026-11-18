import pytest

pytestmark = pytest.mark.asyncio


async def test_unselectable_paths_cancel_webkitdirectory(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    for paths in [
        [temp_files["file1"]],
        [temp_files["subdir"], temp_files["subdir2"]],
        [f"{temp_files['root']}/does_not_exist_dir"],
        ["relative/subdir"],
    ]:
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior={
                "type": "accept",
                "paths": paths,
            }
        )
        result = await trigger_input_file_dialog(new_tab, webkitdirectory=True)
        assert result == {"event": "cancel", "files": []}


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
