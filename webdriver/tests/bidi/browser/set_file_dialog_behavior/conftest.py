import pytest
import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget


@pytest_asyncio.fixture(autouse=True)
async def reset_file_dialog_behavior(bidi_session):
    yield
    await bidi_session.browser.set_file_dialog_behavior(file_dialog_behavior=None)


@pytest_asyncio.fixture
async def temp_files(bidi_session):
    result = await bidi_session.browser.create_temporary_directory(
        entries=[
            {
                "type": "file",
                "path": "file1.txt",
                "data": {"type": "string", "value": "Hello File 1"},
            },
            {
                "type": "file",
                "path": "file2.txt",
                "data": {"type": "string", "value": "Hello File 2"},
            },
            {
                "type": "directory",
                "path": "subdir",
            },
        ]
    )
    root = result["path"]
    yield {
        "root": root,
        "file1": f"{root}/file1.txt",
        "file2": f"{root}/file2.txt",
        "subdir": f"{root}/subdir",
    }
    await bidi_session.browser.remove_temporary_directory(path=root)


@pytest.fixture
def trigger_input_file_dialog(bidi_session, inline):
    async def _trigger(context, multiple=False):
        url = inline(
            f"<input id=input type=file {'multiple' if multiple else ''} />"
        )
        await bidi_session.browsing_context.navigate(
            context=context["context"], url=url, wait="complete"
        )
        result = await bidi_session.script.evaluate(
            expression="""new Promise((resolve) => {
                input.addEventListener("change", () => {
                    resolve({
                        event: "change",
                        files: Array.from(input.files, f => f.name),
                    });
                });
                input.addEventListener("cancel", () => {
                    resolve({
                        event: "cancel",
                        files: [],
                    });
                });
                input.showPicker();
            })""",
            target=ContextTarget(context["context"]),
            await_promise=True,
            user_activation=True,
        )
        return {
            "event": result["value"]["event"]["value"],
            "files": [f["value"] for f in result["value"]["files"]["value"]],
        }

    return _trigger
