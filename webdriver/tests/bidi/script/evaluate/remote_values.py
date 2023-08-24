import pytest
from webdriver.bidi.modules.script import ContextTarget, SerializationOptions
from ... import recursive_compare
from .. import REMOTE_VALUES


@pytest.mark.asyncio
@pytest.mark.parametrize("expression, expected", REMOTE_VALUES)
async def test_remote_values(bidi_session, top_context, expression, expected):
    result = await bidi_session.script.evaluate(
        expression=expression,
        target=ContextTarget(top_context["context"]),
        await_promise=False,
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    recursive_compare(expected, result)


@pytest.mark.asyncio
async def test_window_top_level_browsing_context(bidi_session, top_context):
    result = await bidi_session.script.evaluate(
        expression="window",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    recursive_compare(
        {
            "type": "window",
            "value": {
                "context": top_context["context"]
            }
        }, result)


@pytest.mark.asyncio
async def test_window_iframe_window(
        bidi_session, top_context, test_page_same_origin_frame):

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=test_page_same_origin_frame,
        wait="complete",
    )

    all_contexts = await bidi_session.browsing_context.get_tree()
    iframe_context = all_contexts[0]["children"][0]

    result = await bidi_session.script.evaluate(
        expression="window",
        target=ContextTarget(iframe_context["context"]),
        await_promise=False,
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    recursive_compare(
        {
            "type": "window",
            "value": {
                "context": iframe_context["context"]
            }
        }, result)


@pytest.mark.asyncio
async def test_window_remove_value_iframe_content_window(
        bidi_session, top_context, test_page_same_origin_frame):

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=test_page_same_origin_frame,
        wait="complete",
    )

    all_contexts = await bidi_session.browsing_context.get_tree()
    iframe_context = all_contexts[0]["children"][0]

    result = await bidi_session.script.evaluate(
        expression="document.querySelector('iframe')?.contentWindow",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
        serialization_options=SerializationOptions(max_object_depth=1),
    )

    recursive_compare(
        {
            "type": "window",
            "value": {
                "context": iframe_context["context"]
            }
        }, result)
