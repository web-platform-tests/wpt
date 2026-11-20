import pytest

from tests.bidi.input.file_dialog_opened import assert_file_dialog_opened_event
from webdriver.bidi.modules.script import ContextTarget
from webdriver.bidi.undefined import UNDEFINED

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_show_directory_picker_accept(
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
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["subdir"]],
        }
    )

    result = await bidi_session.script.evaluate(
        expression="""(async () => {
            const dir = await window.showDirectoryPicker();
            const names = [];
            for await (const [name] of dir.entries()) {
                names.push(name);
            }
            return names.sort();
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

    assert [item["value"] for item in result["value"]] == ["nested.txt"]


async def test_show_directory_picker_cancel(
    bidi_session, new_tab, get_picker_error
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )

    assert await get_picker_error(new_tab, "showDirectoryPicker") == "AbortError"


@pytest.mark.parametrize(
    "case", ["file", "multiple_directories", "nonexistent"]
)
async def test_show_directory_picker_unselectable_paths(
    bidi_session, new_tab, temp_files, get_picker_error, case
):
    paths_by_case = {
        "file": [temp_files["file1"]],
        "multiple_directories": [temp_files["subdir"], temp_files["subdir2"]],
        "nonexistent": [f"{temp_files['root']}/missing_dir"],
    }
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": paths_by_case[case],
        }
    )

    assert await get_picker_error(new_tab, "showDirectoryPicker") == "AbortError"
