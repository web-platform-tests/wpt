from pathlib import Path
import asyncio
import pytest

from tests.bidi.input.file_dialog_opened import assert_file_dialog_opened_event
from webdriver.bidi.modules.script import ContextTarget
from webdriver.bidi.undefined import UNDEFINED

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_show_save_file_picker_accept_new_and_existing_file(
    bidi_session,
    subscribe_events,
    wait_for_event,
    wait_for_future_safe,
    inline,
    new_tab,
    temp_files,
):
    await subscribe_events(events=[FILE_DIALOG_OPENED_EVENT])
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline(""), wait="complete"
    )

    # 1. Save to a newly created file path.
    new_save_path = Path(temp_files["root"]) / "created_by_save_picker.txt"
    assert not new_save_path.exists()

    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [str(new_save_path)],
        }
    )

    on_opened = wait_for_event(FILE_DIALOG_OPENED_EVENT)
    eval_task = asyncio.create_task(
        bidi_session.script.evaluate(
            expression="""(async () => {
                const handle = await window.showSaveFilePicker();
                const writable = await handle.createWritable();
                await writable.write("Saved new file");
                await writable.close();
                return handle.name;
            })()""",
            target=ContextTarget(new_tab["context"]),
            await_promise=True,
            user_activation=True,
        )
    )

    event = await wait_for_future_safe(on_opened)
    assert_file_dialog_opened_event(
        event,
        new_tab["context"],
        "default",
        multiple=False,
        element=UNDEFINED,
    )
    result = await eval_task
    assert result["value"] == "created_by_save_picker.txt"
    assert new_save_path.read_text(encoding="utf-8") == "Saved new file"

    # 2. Overwrite an existing file with shorter content.
    overwrite_path = Path(temp_files["root"]) / "overwrite.txt"
    overwrite_path.write_text("Long initial content to overwrite", encoding="utf-8")

    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [str(overwrite_path)],
        }
    )
    await bidi_session.script.evaluate(
        expression="""(async () => {
            const handle = await window.showSaveFilePicker();
            const writable = await handle.createWritable();
            await writable.write("Short");
            await writable.close();
        })()""",
        target=ContextTarget(new_tab["context"]),
        await_promise=True,
        user_activation=True,
    )
    assert overwrite_path.read_text(encoding="utf-8") == "Short"


async def test_show_save_file_picker_cancel_and_unselectable(
    bidi_session, inline, new_tab, temp_files
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline(""), wait="complete"
    )

    for behavior in [
        {"type": "cancel"},
        {"type": "accept", "paths": [temp_files["file1"], temp_files["file2"]]},
        {"type": "accept", "paths": [temp_files["subdir"]]},
        {"type": "accept", "paths": ["relative/save.txt"]},
    ]:
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior=behavior
        )
        result = await bidi_session.script.evaluate(
            expression="""(async () => {
                try {
                    await window.showSaveFilePicker();
                    return "resolved";
                } catch (e) {
                    return e instanceof DOMException ? e.name : String(e);
                }
            })()""",
            target=ContextTarget(new_tab["context"]),
            await_promise=True,
            user_activation=True,
        )
        assert result["value"] == "AbortError"
