import pytest

from tests.bidi import remote_mapping_to_dict
from tests.bidi.input.file_dialog_opened import assert_file_dialog_opened_event
from webdriver.bidi.modules.script import ContextTarget
from webdriver.bidi.undefined import UNDEFINED

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_show_open_file_picker_accept_single(
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
            "paths": [temp_files["file1"]],
        }
    )

    result = await bidi_session.script.evaluate(
        expression="""(async () => {
            const [handle] = await window.showOpenFilePicker();
            const file = await handle.getFile();
            return { name: file.name, text: await file.text() };
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
        "name": "file1.txt",
        "text": "Hello File 1",
    }


async def test_show_open_file_picker_accept_multiple(
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
            "paths": [temp_files["file1"], temp_files["file2"]],
        }
    )

    result = await bidi_session.script.evaluate(
        expression="""(async () => {
            const handles = await window.showOpenFilePicker({ multiple: true });
            return handles.map(h => h.name);
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
        multiple=True,
        element=UNDEFINED,
    )

    assert [item["value"] for item in result["value"]] == [
        "file1.txt",
        "file2.txt",
    ]


async def test_show_open_file_picker_dismiss(
    bidi_session, new_tab, get_picker_error
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "dismiss"}
    )

    assert await get_picker_error(new_tab, "showOpenFilePicker") == "AbortError"


@pytest.mark.parametrize(
    "case", ["multiple_paths", "directory", "nonexistent"]
)
async def test_show_open_file_picker_unselectable_paths(
    bidi_session, new_tab, temp_files, get_picker_error, case
):
    paths_by_case = {
        "multiple_paths": [temp_files["file1"], temp_files["file2"]],
        "directory": [temp_files["subdir"]],
        "nonexistent": [f"{temp_files['root']}/missing.txt"],
    }
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": paths_by_case[case],
        }
    )

    assert await get_picker_error(new_tab, "showOpenFilePicker") == "AbortError"
