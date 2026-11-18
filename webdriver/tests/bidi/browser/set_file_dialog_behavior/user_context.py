# META: timeout=long

import pytest

pytestmark = pytest.mark.asyncio


async def test_user_contexts(
    bidi_session,
    create_user_context,
    user_context_invariant,
    temp_files,
    trigger_input_file_dialog,
):
    affected_user_context = user_context_invariant
    not_affected_user_context = (
        await create_user_context()
        if user_context_invariant == "default"
        else "default"
    )

    context_in_affected = await bidi_session.browsing_context.create(
        user_context=affected_user_context, type_hint="tab"
    )
    context_in_not_affected = await bidi_session.browsing_context.create(
        user_context=not_affected_user_context, type_hint="tab"
    )

    # Set global behavior to cancel so unaffected contexts do not open OS dialogs.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )

    # Override behavior in affected_user_context to accept file1.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        },
        user_contexts=[affected_user_context],
    )

    expected_accept = {"event": "change", "files": ["file1.txt"]}
    expected_cancel = {"event": "cancel", "files": []}

    assert await trigger_input_file_dialog(context_in_affected) == expected_accept
    assert (
        await trigger_input_file_dialog(
            await bidi_session.browsing_context.create(
                user_context=affected_user_context, type_hint="tab"
            )
        )
        == expected_accept
    )

    assert (
        await trigger_input_file_dialog(context_in_not_affected)
        == expected_cancel
    )
    assert (
        await trigger_input_file_dialog(
            await bidi_session.browsing_context.create(
                user_context=not_affected_user_context, type_hint="tab"
            )
        )
        == expected_cancel
    )

    # Reset per-user-context override; global cancel applies.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior=None,
        user_contexts=[affected_user_context],
    )
    assert await trigger_input_file_dialog(context_in_affected) == expected_cancel
    assert (
        await trigger_input_file_dialog(
            await bidi_session.browsing_context.create(
                user_context=affected_user_context, type_hint="tab"
            )
        )
        == expected_cancel
    )


async def test_per_user_context_overrides_global(
    bidi_session,
    user_context_invariant,
    temp_files,
    trigger_input_file_dialog,
):
    context = await bidi_session.browsing_context.create(
        user_context=user_context_invariant, type_hint="tab"
    )

    # Set behavior per user context first.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={
            "type": "accept",
            "paths": [temp_files["file1"]],
        },
        user_contexts=[user_context_invariant],
    )
    assert await trigger_input_file_dialog(context) == {
        "event": "change",
        "files": ["file1.txt"],
    }

    # Set a conflicting global override afterwards; per-user-context still wins.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior={"type": "cancel"}
    )
    assert await trigger_input_file_dialog(context) == {
        "event": "change",
        "files": ["file1.txt"],
    }

    # Reset per-user-context override; global override now applies.
    await bidi_session.browser.set_file_dialog_behavior(
        file_dialog_behavior=None,
        user_contexts=[user_context_invariant],
    )
    assert await trigger_input_file_dialog(context) == {
        "event": "cancel",
        "files": [],
    }
