import pytest

pytestmark = pytest.mark.asyncio


async def test_user_contexts(
    bidi_session,
    create_user_context,
    temp_files,
    trigger_input_file_dialog,
):
    user_context_1 = await create_user_context()
    user_context_2 = await create_user_context()

    context_1 = await bidi_session.browsing_context.create(
        user_context=user_context_1, type_hint="tab"
    )
    context_2 = await bidi_session.browsing_context.create(
        user_context=user_context_2, type_hint="tab"
    )

    # Set global behavior to cancel.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )

    # Override behavior in user_context_1 to accept file1.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        },
        user_contexts=[user_context_1],
    )

    assert await trigger_input_file_dialog(context_1) == {
        "event": "change",
        "files": ["file1.txt"],
    }
    assert await trigger_input_file_dialog(context_2) == {
        "event": "cancel",
        "files": [],
    }

    # Reset per-user-context override on user_context_1; global cancel applies.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior=None,
        user_contexts=[user_context_1],
    )
    assert await trigger_input_file_dialog(context_1) == {
        "event": "cancel",
        "files": [],
    }
