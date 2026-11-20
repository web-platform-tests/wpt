from pathlib import Path
import pytest

from tests.bidi import remote_mapping_to_dict
from tests.bidi.input.file_dialog_opened import assert_file_dialog_opened_event
from webdriver.bidi.modules.script import ContextTarget
from webdriver.bidi.undefined import UNDEFINED

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_show_save_file_picker_accept_new_file(
    bidi_session,
    subscribe_events,
    wait_for_event,
    wait_for_future_safe,
    inline,
    new_tab,
    temp_files,
):
    await subscribe_events(events=[FILE_DIALOG_OPENED_EVENT])
    on_opened = wait_for_event(FILE_DIALOG_OPENED_EVENT)

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline(""), wait="complete"
    )

    new_save_path = Path(temp_files["root"]) / "created_by_save_picker.txt"
    assert not new_save_path.exists()

    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [str(new_save_path)],
        }
    )

    result = await bidi_session.script.evaluate(
        expression="""(async () => {
            const handle = await window.showSaveFilePicker();
            const file = await handle.getFile();
            return { name: handle.name, text: await file.text() };
        })()""",
        target=ContextTarget(new_tab["context"]),
        await_promise=True,
        user_activation=True,
    )

    event = await wait_for_future_safe(on_opened)
    assert_file_dialog_opened_event(
        event,
        new_tab["context"],
        "default",
        multiple=False,
        element=UNDEFINED,
    )

    assert remote_mapping_to_dict(result["value"]) == {
        "name": "created_by_save_picker.txt",
        "text": "",
    }
    assert new_save_path.exists()
    assert new_save_path.read_bytes() == b""


async def test_show_save_file_picker_accept_existing_file(
    bidi_session, inline, new_tab, temp_files
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline(""), wait="complete"
    )

    overwrite_path = Path(temp_files["root"]) / "overwrite.txt"
    overwrite_path.write_text("Initial non-empty content", encoding="utf-8")

    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [str(overwrite_path)],
        }
    )
    result = await bidi_session.script.evaluate(
        expression="""(async () => {
            const handle = await window.showSaveFilePicker();
            const file = await handle.getFile();
            return { name: handle.name, text: await file.text() };
        })()""",
        target=ContextTarget(new_tab["context"]),
        await_promise=True,
        user_activation=True,
    )
    assert remote_mapping_to_dict(result["value"]) == {
        "name": "overwrite.txt",
        "text": "",
    }
    assert overwrite_path.read_bytes() == b""


async def test_show_save_file_picker_cancel(
    bidi_session, new_tab, get_picker_error
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )

    assert await get_picker_error(new_tab, "showSaveFilePicker") == "AbortError"


@pytest.mark.parametrize(
    "case", ["multiple_paths", "directory", "missing_parent"]
)
async def test_show_save_file_picker_unselectable_paths(
    bidi_session, new_tab, temp_files, get_picker_error, case
):
    paths_by_case = {
        "multiple_paths": [temp_files["file1"], temp_files["file2"]],
        "directory": [temp_files["subdir"]],
        "missing_parent": [f"{temp_files['root']}/missing_dir/save.txt"],
    }
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": paths_by_case[case],
        }
    )

    assert await get_picker_error(new_tab, "showSaveFilePicker") == "AbortError"
