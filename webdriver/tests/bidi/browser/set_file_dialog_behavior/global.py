import pytest

pytestmark = pytest.mark.asyncio


async def test_set_and_overwrite_globally(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        }
    )
    result = await trigger_input_file_dialog(new_tab)
    assert result == {"event": "change", "files": ["file1.txt"]}

    # Overwrite with cancel globally.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )
    result = await trigger_input_file_dialog(new_tab)
    assert result == {"event": "cancel", "files": []}
