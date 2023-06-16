from webdriver.bidi.modules.script import ContextTarget

async def layout_viewport_dimensions(bidi_session, context):
    """Get the layout viewport dimensions of the context's viewport.

    :param bidi_session: BiDiSession
    :param context: Browsing context ID
    :returns: Tuple of (int, int) containing layout viewport width, viewport height.
    """
    result = await bidi_session.script.call_function(
        function_declaration="""() => {
        const {innerHeight, innerWidth} = window;

        return [
          innerWidth,
          innerHeight
        ];
    }""",
        target=ContextTarget(context["context"]),
        await_promise=False)
    return tuple(item["value"] for item in result["value"])
