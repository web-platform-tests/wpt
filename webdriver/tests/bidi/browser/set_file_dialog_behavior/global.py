import pytest

pytestmark = pytest.mark.asyncio


async def test_set_and_overwrite_globally(
    bidi_session, new_tab, temp_files, trigger_input_file_dialog
):
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        }
    )
    result = await trigger_input_file_dialog(new_tab)
    assert result == {"event": "change", "files": ["file1.txt"]}

    # Overwrite with cancel globally.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )
    result = await trigger_input_file_dialog(new_tab)
    assert result == {"event": "cancel", "files": []}


@pytest.mark.capabilities(
    {"unhandledPromptBehavior": {"file": "dismiss", "default": "ignore"}}
)
async def test_set_and_reset_globally(
    bidi_session,
    top_context,
    new_tab,
    create_user_context,
    inline,
    iframe,
    temp_files,
    trigger_input_file_dialog,
):
    user_context = await create_user_context()
    context_in_user_context = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=inline(iframe("")),
        wait="complete",
    )
    contexts = await bidi_session.browsing_context.get_tree(
        root=new_tab["context"]
    )
    iframe_context = contexts[0]["children"][0]

    # Set behavior globally.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        }
    )

    expected_accept = {"event": "change", "files": ["file1.txt"]}
    assert await trigger_input_file_dialog(top_context) == expected_accept
    assert (
        await trigger_input_file_dialog(
            await bidi_session.browsing_context.create(
                user_context="default", type_hint="tab"
            )
        )
        == expected_accept
    )
    assert (
        await trigger_input_file_dialog(context_in_user_context)
        == expected_accept
    )
    assert (
        await trigger_input_file_dialog(
            await bidi_session.browsing_context.create(
                user_context=user_context, type_hint="tab"
            )
        )
        == expected_accept
    )
    await bidi_session.browsing_context.activate(context=new_tab["context"])
    assert (
        await trigger_input_file_dialog(iframe_context, activate=False)
        == expected_accept
    )

    # Reset global behavior; unhandledPromptBehavior ("dismiss") applies again.
    await bidi_session.browser.set_file_dialog_behavior(file_dialog_behavior=None)

    expected_dismiss = {"event": "cancel", "files": []}
    assert await trigger_input_file_dialog(top_context) == expected_dismiss
    assert (
        await trigger_input_file_dialog(
            await bidi_session.browsing_context.create(
                user_context="default", type_hint="tab"
            )
        )
        == expected_dismiss
    )
    assert (
        await trigger_input_file_dialog(context_in_user_context)
        == expected_dismiss
    )
    assert (
        await trigger_input_file_dialog(
            await bidi_session.browsing_context.create(
                user_context=user_context, type_hint="tab"
            )
        )
        == expected_dismiss
    )
    await bidi_session.browsing_context.activate(context=new_tab["context"])
    assert (
        await trigger_input_file_dialog(iframe_context, activate=False)
        == expected_dismiss
    )
