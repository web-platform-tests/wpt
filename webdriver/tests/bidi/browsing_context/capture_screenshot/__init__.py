async def viewport_dimensions(bidi_session, context):
    result = await bidi_session.script.call_function(
        function_declaration="""() => {
        const {devicePixelRatio, innerHeight, innerWidth} = window;

        return [
          Math.floor(innerWidth * devicePixelRatio),
          Math.floor(innerHeight * devicePixelRatio)
        ];
    }""",
        target={"context": context["context"]},
        await_promise=False)
    return tuple(item["value"] for item in result["value"])
