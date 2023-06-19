from webdriver.bidi.modules.script import ContextTarget

from ... import get_viewport_dimensions

async def physical_viewport_dimensions(bidi_session, context):
    """Get the physical dimensions of the context's viewport.

    :param bidi_session: BiDiSession
    :param context: Browsing context ID
    :returns: Tuple of (int, int) containing viewport width, viewport height.
    """
    viewport = await get_viewport_dimensions(bidi_session, context)
    dpr = await device_pixel_ratio(bidi_session, context)
    return (viewport["width"] * dpr, viewport["height"] * dpr)

async def device_pixel_ratio(bidi_session, context):
    """Get the DPR of the context.

    :param bidi_session: BiDiSession
    :param context: Browsing context ID
    :returns: (int) devicePixelRatio.
    """
    result = await bidi_session.script.call_function(
        function_declaration="""() => {
        return Math.floor(window.devicePixelRatio);
    }""",
        target=ContextTarget(context["context"]),
        await_promise=False)
    return result["value"]
