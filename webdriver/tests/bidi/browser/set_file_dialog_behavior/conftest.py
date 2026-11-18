import pytest
import pytest_asyncio

from tests.bidi import remote_mapping_to_dict
from webdriver.bidi.modules.script import ContextTarget


@pytest_asyncio.fixture(autouse=True)
async def reset_file_dialog_behavior(bidi_session):
    yield
    await bidi_session.browser.set_file_dialog_behavior(file_dialog_behavior=None)


@pytest_asyncio.fixture(params=["default", "new"])
async def user_context_invariant(request, create_user_context):
    if request.param == "default":
        return "default"
    return await create_user_context()


@pytest.fixture
def temp_files(tmp_path):
    file1 = tmp_path / "file1.txt"
    file1.write_text("Hello File 1", encoding="utf-8")
    file2 = tmp_path / "file2.txt"
    file2.write_text("Hello File 2", encoding="utf-8")
    subdir = tmp_path / "subdir"
    subdir.mkdir()
    nested = subdir / "nested.txt"
    nested.write_text("Nested Content", encoding="utf-8")
    subdir2 = tmp_path / "subdir2"
    subdir2.mkdir()

    return {
        "root": str(tmp_path),
        "file1": str(file1),
        "file2": str(file2),
        "subdir": str(subdir),
        "subdir2": str(subdir2),
        "nested": str(nested),
    }


@pytest.fixture
def trigger_input_file_dialog(bidi_session, inline):
    async def _trigger(
        context, multiple=False, webkitdirectory=False, activate=True
    ):
        if activate:
            await bidi_session.browsing_context.activate(
                context=context["context"]
            )
        attrs = []
        if multiple:
            attrs.append("multiple")
        if webkitdirectory:
            attrs.append("webkitdirectory")
        attr_str = " ".join(attrs)
        url = inline(f"<input id=input type=file {attr_str} />")
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
        parsed = remote_mapping_to_dict(result["value"])
        return {
            "event": parsed["event"],
            "files": [f["value"] for f in parsed["files"]],
        }

    return _trigger
