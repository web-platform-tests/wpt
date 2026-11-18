import pytest
import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget


@pytest_asyncio.fixture(autouse=True)
async def reset_file_dialog_behavior(bidi_session):
    yield
    await bidi_session.browser.set_file_dialog_behavior(file_dialog_behavior=None)


@pytest.fixture
def temp_files(tmp_path):
    file1 = tmp_path / "file1.txt"
    file1.write_text("Hello File 1")
    file2 = tmp_path / "file2.txt"
    file2.write_text("Hello File 2")
    subdir = tmp_path / "subdir"
    subdir.mkdir()

    return {
        "root": str(tmp_path),
        "file1": str(file1),
        "file2": str(file2),
        "subdir": str(subdir),
    }


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
