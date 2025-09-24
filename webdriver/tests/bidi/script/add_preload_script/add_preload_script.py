import asyncio
import pytest

from webdriver.bidi.modules.script import ContextTarget

CONTEXT_CREATED_EVENT = "browsingContext.contextCreated"
CONTEXT_LOAD_EVENT = "browsingContext.load"


@pytest.mark.asyncio
@pytest.mark.parametrize("type_hint", ["tab", "window"])
async def test_add_preload_script(
    bidi_session, add_preload_script, top_context, inline, type_hint
):
    await add_preload_script(function_declaration="() => { window.foo='bar'; }")

    # Check that preload script didn't apply the changes to the current context
    result = await bidi_session.script.evaluate(
        expression="window.foo",
        target=ContextTarget(top_context["context"]),
        await_promise=True,
    )
    assert result == {"type": "undefined"}

    new_context = await bidi_session.browsing_context.create(type_hint=type_hint)

    # Check that preload script applied the changes to the window
    result = await bidi_session.script.evaluate(
        expression="window.foo",
        target=ContextTarget(new_context["context"]),
        await_promise=True,
    )
    assert result == {"type": "string", "value": "bar"}

    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(
        context=new_context["context"],
        url=url,
        wait="complete",
    )

    # Check that preload script was applied after navigation
    result = await bidi_session.script.evaluate(
        expression="window.foo",
        target=ContextTarget(new_context["context"]),
        await_promise=True,
    )
    assert result == {"type": "string", "value": "bar"}


@pytest.mark.asyncio
async def test_add_same_preload_script_twice(add_preload_script):
    script_1 = await add_preload_script(function_declaration="() => { return 42; }")
    script_2 = await add_preload_script(function_declaration="() => { return 42; }")

    # Make sure that preload scripts have different ids
    assert script_1 != script_2


@pytest.mark.asyncio
async def test_script_order(
    bidi_session, add_preload_script, subscribe_events, new_tab, inline
):
    preload_script_console_text = "preload script"

    await add_preload_script(
        function_declaration=f"() => {{ console.log('{preload_script_console_text}') }}"
    )
    await subscribe_events(events=["log.entryAdded"], contexts=[new_tab["context"]])

    events = []

    async def on_event(method, data):
        # Ignore errors and warnings which might occur during test execution
        if data["level"] == "info":
            events.append(data)

    remove_listener = bidi_session.add_event_listener("log.entryAdded", on_event)

    user_console_text = "user script"
    url = inline(f"<script>console.log('{user_console_text}')</script>")

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=url,
        wait="complete",
    )

    assert len(events) > 0
    # Make sure that console event from preload script comes first
    events[0]["text"] == preload_script_console_text

    remove_listener()


@pytest.mark.asyncio
async def test_add_preload_script_in_iframe(
    bidi_session, add_preload_script, new_tab, test_page_same_origin_frame
):
    await add_preload_script(function_declaration="() => { window.bar='foo'; }")

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_page_same_origin_frame,
        wait="complete",
    )

    # Check that preload script applied the changes to the window
    result = await bidi_session.script.evaluate(
        expression="window.bar",
        target=ContextTarget(new_tab["context"]),
        await_promise=True,
    )
    assert result == {"type": "string", "value": "foo"}

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])

    assert len(contexts[0]["children"]) == 1
    frame_context = contexts[0]["children"][0]

    # Check that preload script applied the changes to the iframe
    result = await bidi_session.script.evaluate(
        expression="window.bar",
        target=ContextTarget(frame_context["context"]),
        await_promise=True,
    )
    assert result == {"type": "string", "value": "foo"}


@pytest.mark.asyncio
async def test_add_preload_script_with_error(
    bidi_session, add_preload_script, subscribe_events, inline, new_tab, wait_for_event, wait_for_future_safe
):
    await add_preload_script(
        function_declaration="() => {{ throw Error('error in preload script') }}"
    )

    await subscribe_events(events=["browsingContext.load", "log.entryAdded"])

    on_entry = wait_for_event("log.entryAdded")
    on_load = wait_for_event("browsingContext.load")

    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"], url=url)
    error_event = await wait_for_future_safe(on_entry)

    # Make sure that page is loaded
    await wait_for_future_safe(on_load)

    # Make sure that exception from preloaded script was reported
    assert error_event["level"] == "error"
    assert error_event["text"] == "Error: error in preload script"


@pytest.mark.asyncio
async def test_page_script_can_access_preload_script_properties(
    bidi_session, add_preload_script, new_tab, inline
):
    await add_preload_script(
        function_declaration="() => { window.preloadScriptFunction = () => window.baz = 42; }"
    )

    url = inline("<script>window.preloadScriptFunction()</script>")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=url,
        wait="complete",
    )

    # Check that page script could access a function set up by the preload script
    result = await bidi_session.script.evaluate(
        expression="window.baz",
        target=ContextTarget(new_tab["context"]),
        await_promise=True,
    )
    assert result == {"type": "number", "value": 42}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "types",
    [
        ("global", "userContexts", "contexts"),
        ("global", "contexts", "userContexts"),
        ("contexts", "global", "userContexts"),
        ("contexts", "userContexts", "global"),
        ("userContexts", "contexts", "global"),
        ("userContexts", "global", "contexts"),
    ],
)
async def test_add_preload_script_order_with_different_configuration(
    bidi_session, add_preload_script, inline, create_user_context, types
):

    async def add_preload_script_of_type(type):
        function_declaration = f"""() => {{
            window.preloadScriptApplied = window.preloadScriptApplied || [];
            window.preloadScriptApplied.push("{type}");
        }}"""

        if type == "global":
            await add_preload_script(function_declaration=function_declaration)

        elif type == "userContexts":
            await add_preload_script(
                function_declaration=function_declaration,
                user_contexts=[user_context],
            )

        elif type == "contexts":
            await add_preload_script(
                function_declaration=function_declaration,
                contexts=[new_context_in_user_context["context"]],
            )

    user_context = await create_user_context()
    new_context_in_user_context = await bidi_session.browsing_context.create(
        user_context=user_context, type_hint="tab"
    )

    for type in types:
        await add_preload_script_of_type(type)

    await bidi_session.browsing_context.navigate(
        context=new_context_in_user_context["context"],
        url=inline("<div>test</div>"),
        wait="complete",
    )

    # Check that preload script was applied after navigation
    result = await bidi_session.script.evaluate(
        expression="window.preloadScriptApplied",
        target=ContextTarget(new_context_in_user_context["context"]),
        await_promise=True,
    )

    expected_result = {"type": "array", "value": []}
    for type in types:
        expected_result["value"].append({"type": "string", "value": type})

    assert result == expected_result


@pytest.mark.asyncio
@pytest.mark.parametrize("access_type", ["current_context_with_url", "current_context_without_url", "opener_context_with_url", "opener_context_without_url", "data_url"])
@pytest.mark.parametrize("create_type", ["popup", "iframe"])
async def test_preload_script_properties_available_immediately(
    bidi_session, add_preload_script, new_tab, subscribe_events, wait_for_event, wait_for_future_safe, create_type, access_type
):
    await add_preload_script(function_declaration="() => { window.foo = 'bar'; }")

    await subscribe_events([CONTEXT_CREATED_EVENT, CONTEXT_LOAD_EVENT])
    on_created = wait_for_event(CONTEXT_CREATED_EVENT)

    if create_type == "popup":
        if access_type == "current_context_with_url":
            script = "window.open('about:blank')"
        elif access_type == "current_context_without_url":
            script = "window.open()"
        elif access_type == "opener_context_with_url":
            script = "window.baz = window.open('about:blank').foo"
        elif access_type == "opener_context_without_url":
            script = "window.baz = window.open().foo"
        elif access_type == "data_url":
            script = "window.open('data:text/html,<script>window.baz = window.foo</script>')"
    elif create_type == "iframe":
        script = "const iframe = document.createElement('iframe');"
        if access_type == "current_context_with_url":
            script += "iframe.src='about:blank'; document.body.appendChild(iframe)"
        elif access_type == "current_context_without_url":
            script += "document.body.appendChild(iframe)"
        elif access_type == "opener_context_with_url":
            script += """iframe.src='about:blank'; document.body.appendChild(iframe);
                window.baz = iframe.contentWindow.foo"""
        elif access_type == "opener_context_without_url":
            script += "document.body.appendChild(iframe); window.baz = iframe.contentWindow.foo"
        elif access_type == "data_url":
            script += """iframe.src='data:text/html,<script>window.baz = window.foo</script>';
                document.body.appendChild(iframe)"""

    asyncio.create_task(
        bidi_session.script.evaluate(
            expression=script,
            target=ContextTarget(new_tab["context"]),
            await_promise=False,
        )
    )

    if access_type == "data_url":
        try:
            # ensure the inline script was executed
            await wait_for_future_safe(wait_for_event(CONTEXT_LOAD_EVENT))
        except:
            pass

    new_context_info = await wait_for_future_safe(on_created)
    if access_type == "current_context_with_url" or access_type == "current_context_without_url":
        result = await bidi_session.script.evaluate(
            expression="window.foo",
            target=ContextTarget(new_context_info["context"]),
            await_promise=False,
        )
    if access_type == "opener_context_with_url" or access_type == "opener_context_without_url":
        result = await bidi_session.script.evaluate(
            expression="window.baz",
            target=ContextTarget(new_tab["context"]),
            await_promise=False,
        )
    if access_type == "data_url":
        result = await bidi_session.script.evaluate(
            expression="window.baz",
            target=ContextTarget(new_context_info["context"]),
            await_promise=False,
        )

    if create_type == "popup":
        await bidi_session.browsing_context.close(context=new_context_info["context"])

    assert result == {"type": "string", "value": "bar"}
