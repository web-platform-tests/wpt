import pytest
import webdriver.bidi.error as error

from webdriver.bidi.modules.script import ContextTarget, RealmTarget
from ... import recursive_compare

pytestmark = pytest.mark.asyncio


async def test_target_realm(bidi_session, default_realm):
    result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => { window.foo = 3; }",
        target=RealmTarget(default_realm),
        await_promise=True,
    )

    recursive_compare({"realm": default_realm, "result": {"type": "undefined"}}, result)

    result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => window.foo",
        target=RealmTarget(default_realm),
        await_promise=True,
    )

    recursive_compare(
        {"realm": default_realm, "result": {"type": "number", "value": 3}}, result
    )


async def test_context_target_uses_replacement_realm_after_navigation(
    bidi_session, default_realm, inline, top_context
):
    context = top_context["context"]
    await bidi_session.browsing_context.navigate(
        context=context,
        url=inline(
            "<script>window.replacementRealmMarker = 'replacement realm';</script>"
        ),
        wait="complete",
    )

    result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => window.replacementRealmMarker",
        target=ContextTarget(context),
        await_promise=False,
    )

    assert result["realm"] != default_realm
    assert result["result"] == {"type": "string", "value": "replacement realm"}


async def test_realm_target_is_not_retargeted_after_navigation(
    bidi_session, default_realm, inline, top_context
):
    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=inline(
            "<script>window.replacementRealmMarker = 'replacement realm';</script>"
        ),
        wait="complete",
    )

    # The explicit realm was destroyed by navigation and must not be retargeted
    # to the context's replacement realm.
    with pytest.raises(error.NoSuchFrameException):
        await bidi_session.script.call_function(
            function_declaration="() => window.replacementRealmMarker",
            target=RealmTarget(default_realm),
            await_promise=False,
        )


async def test_different_target_realm(bidi_session):
    await bidi_session.browsing_context.create(type_hint="tab")

    realms = await bidi_session.script.get_realms()
    first_tab_default_realm = realms[0]["realm"]
    second_tab_default_realm = realms[1]["realm"]

    assert first_tab_default_realm != second_tab_default_realm

    await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => { window.foo = 3; }",
        target=RealmTarget(first_tab_default_realm),
        await_promise=True,
    )
    await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => { window.foo = 5; }",
        target=RealmTarget(second_tab_default_realm),
        await_promise=True,
    )

    top_context_result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => window.foo",
        target=RealmTarget(first_tab_default_realm),
        await_promise=True,
    )
    recursive_compare(
        {"realm": first_tab_default_realm, "result": {"type": "number", "value": 3}}, top_context_result
    )

    new_context_result = await bidi_session.script.call_function(
        raw_result=True,
        function_declaration="() => window.foo",
        target=RealmTarget(second_tab_default_realm),
        await_promise=True,
    )
    recursive_compare(
        {"realm": second_tab_default_realm, "result": {"type": "number", "value": 5}}, new_context_result
    )
