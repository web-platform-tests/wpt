import pytest
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_context_invalid_type(bidi_session, inline, top_context, value):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=value, locator={"type": "css", "value": "div"}
        )


async def test_params_context_invalid_value(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context="foo", locator={ "type": "css", "value": "div" }
        )


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_locator_invalid_type(bidi_session, inline, top_context, value):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"], locator={ "type": value, "value": "div" }
        )


async def test_params_locator_invalid_value(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"], locator={ "type": "invalid", "value": "div" }
        )


@pytest.mark.parametrize("value", [False, "string", 1.5, {}, []])
async def test_params_max_node_count_invalid_type(bidi_session, inline, top_context, value):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "css", "value": "div" },
            max_node_count=value
        )


async def test_params_max_node_count_invalid_value(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "invalid", "value": "div" },
            max_node_count=0
        )


@pytest.mark.parametrize("value", [False, "string", 42, {}])
async def test_params_start_nodes_invalid_type(bidi_session, inline, top_context, value):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "css", "value": "div" },
            start_nodes=value
        )


async def test_params_start_nodes_empty_list(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "invalid", "value": "div" },
            start_nodes=[]
        )


@pytest.mark.parametrize("value", [False, 42, {}, []])
async def test_params_ownership_invalid_type(bidi_session, inline, top_context, value):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "css", "value": "div" },
            ownership=value
        )


async def test_params_ownership_invalid_value(bidi_session, inline, top_context):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "css", "value": "div" },
            ownership="foo"
        )


@pytest.mark.parametrize("value", [False, 42, {}, []])
async def test_params_sandbox_invalid_type(bidi_session, inline, top_context, value):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "css", "value": "div" },
            sandbox=value
        )


@pytest.mark.parametrize("value", [False, 42, "foo", []])
async def test_params_serialization_options_invalid_type(bidi_session, inline, top_context, value):
    url = inline("""<div>foo<span><strong>bar</strong></span><span>BAR</span>baz</div>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browsing_context.locate_nodes(
            context=top_context["context"],
            locator={ "type": "css", "value": "div" },
            serialization_options=value
        )
