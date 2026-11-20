import pytest

from webdriver.bidi.modules.script import ContextTarget


@pytest.fixture
def get_picker_error(bidi_session, dialog_timeout_ms, inline):
    """
    Calls a File System Access picker method (e.g. "showOpenFilePicker") and
    returns the name of the exception that the returned promise rejects with.
    Returns "resolved" if the promise resolves, and "timeout" if it does not
    settle in time, e.g. if the remote end shows the file dialog to the user.
    """

    async def get_picker_error(context, method):
        await bidi_session.browsing_context.navigate(
            context=context["context"], url=inline(""), wait="complete"
        )
        result = await bidi_session.script.call_function(
            function_declaration="""(method, timeout) => Promise.race([
                window[method]().then(
                    () => "resolved",
                    (e) => (e instanceof DOMException ? e.name : String(e)),
                ),
                new Promise((resolve) => {
                    setTimeout(() => resolve("timeout"), timeout);
                }),
            ])""",
            arguments=[
                {"type": "string", "value": method},
                {"type": "number", "value": dialog_timeout_ms},
            ],
            target=ContextTarget(context["context"]),
            await_promise=True,
            user_activation=True,
        )
        return result["value"]

    return get_picker_error
