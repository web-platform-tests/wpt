from webdriver.bidi.modules.script import ContextTarget


async def get_visibility_state(bidi_session, context: str) -> str:
    result = await bidi_session.script.call_function(
        function_declaration="""() => {
        return document.visibilityState;
    }""",
        target=ContextTarget(context["context"]),
        await_promise=False)
    return result["value"]


async def is_selector_focused(bidi_session, context: str, selector: str) -> bool:
    result = await bidi_session.script.call_function(
        function_declaration="""(selector) => {
        return document.querySelector(selector) === document.activeElement;
    }""",
        arguments=[
            {"type": "string", "value": selector},
        ],
        target=ContextTarget(context["context"]),
        await_promise=False)
    return result["value"]
