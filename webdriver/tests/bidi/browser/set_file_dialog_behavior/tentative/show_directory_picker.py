import asyncio
import pytest

from tests.bidi.input.file_dialog_opened import assert_file_dialog_opened_event
from webdriver.bidi.modules.script import ContextTarget
from webdriver.bidi.undefined import UNDEFINED

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_show_directory_picker_cancel_and_unselectable(
    bidi_session, inline, new_tab, temp_files
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=inline(""), wait="complete"
    )

    for behavior in [
        {"type": "cancel"},
        {"type": "accept", "paths": [temp_files["file1"]]},
        {"type": "accept", "paths": [temp_files["subdir"], temp_files["subdir2"]]},
        {"type": "accept", "paths": [f"{temp_files['root']}/missing_dir"]},
        {"type": "accept", "paths": ["relative/subdir"]},
    ]:
        await bidi_session.browser.set_file_dialog_behavior(
            file_dialog_behavior=behavior
        )
        result = await bidi_session.script.evaluate(
            expression="""(async () => {
                try {
                    await window.showDirectoryPicker();
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

    eval_task = asyncio.create_task(
        bidi_session.script.evaluate(
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
    assert [item["value"] for item in result["value"]] == ["nested.txt"]
