import pytest

pytestmark = pytest.mark.asyncio


async def test_cancel_file_dialog(
    bidi_session, new_tab, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )

    result = await trigger_input_file_dialog(new_tab, multiple=False)
    assert result == {"event": "cancel", "files": []}
