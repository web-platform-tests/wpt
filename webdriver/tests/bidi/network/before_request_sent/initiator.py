import asyncio

import pytest

from tests.support.sync import AsyncPoll

from .. import (
    BEFORE_REQUEST_SENT_EVENT,
    PAGE_EMPTY_SCRIPT,
    PAGE_SCRIPT_FETCH,
    PAGE_SCRIPT_IMPORTS_OTHER,
    PAGE_CSS_IMPORTS_OTHER
)

from ... import (
    any_dict,
    any_int,
    any_string,
    recursive_compare,
)


@pytest.mark.asyncio
async def test_initiator_navigation(
    bidi_session,
    top_context,
    setup_network_test,
    test_page,
):
    network_events = await setup_network_test(events=[BEFORE_REQUEST_SENT_EVENT])
    events = network_events[BEFORE_REQUEST_SENT_EVENT]

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=test_page,
        wait="complete",
    )

    assert len(events) == 1
    assert events[0]["initiator"] == {
        "type": "other"
    }


@pytest.mark.asyncio
async def test_initiator_top_level_script(
    bidi_session,
    top_context,
    setup_network_test,
    inline,
):
    network_events = await setup_network_test(events=[BEFORE_REQUEST_SENT_EVENT])
    events = network_events[BEFORE_REQUEST_SENT_EVENT]

    script_url = PAGE_EMPTY_SCRIPT
    target_url = inline(f"<script src='{script_url}'></script>")

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=target_url,
        wait="complete",
    )

    matches = [x for x in events if x["request"]["url"].endswith(script_url)]

    assert len(matches) == 1
    recursive_compare(
        {
            "type": "parser",
            "lineNumber": any_int,
            "columnNumber": any_int,
            "url": any_string
        },
        matches[0]["initiator"],
    )


@pytest.mark.asyncio
async def test_initiator_inner_script(
    bidi_session,
    top_context,
    setup_network_test,
    inline,
):
    network_events = await setup_network_test(events=[BEFORE_REQUEST_SENT_EVENT])
    events = network_events[BEFORE_REQUEST_SENT_EVENT]

    script_url = PAGE_SCRIPT_IMPORTS_OTHER
    inner_script_url = PAGE_EMPTY_SCRIPT
    target_url = inline(f"<script type='module' src='{script_url}'></script>")

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=target_url,
        wait="complete",
    )

    # Wait until we receive 3 events: initial request, top-level script, inner script.
    wait = AsyncPoll(bidi_session, timeout=2)
    await wait.until(lambda _: len(events) >= 3)

    matches = [x for x in events if x["request"]["url"].endswith(inner_script_url)]

    assert len(matches) == 1
    recursive_compare(
        {
            "type": "script",
            "lineNumber": any_int,
            "columnNumber": any_int,
            "url": any_string,
            # TODO: stacktrace is missing
            # "stackTrace": None
        },
        matches[0]["initiator"],
    )


@pytest.mark.asyncio
async def test_initiator_inner_script(
    bidi_session,
    top_context,
    setup_network_test,
    inline,
):
    network_events = await setup_network_test(events=[BEFORE_REQUEST_SENT_EVENT])
    events = network_events[BEFORE_REQUEST_SENT_EVENT]

    script_url = PAGE_SCRIPT_IMPORTS_OTHER
    inner_script_url = PAGE_EMPTY_SCRIPT
    target_url = inline(f"<script type='module' src='{script_url}'></script>")

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=target_url,
        wait="complete",
    )

    # Wait until we receive 3 events: initial request, top-level script, inner script.
    wait = AsyncPoll(bidi_session, timeout=2)
    await wait.until(lambda _: len(events) >= 3)

    matches = [x for x in events if x["request"]["url"].endswith(inner_script_url)]

    assert len(matches) == 1
    recursive_compare(
        {
            "type": "script",
            "lineNumber": any_int,
            "columnNumber": any_int,
            "url": any_string,
            # TODO: stacktrace is missing
            # "stackTrace": None
        },
        matches[0]["initiator"],
    )


@pytest.mark.asyncio
async def test_initiator_fetch(
    bidi_session,
    top_context,
    setup_network_test,
    inline,
):
    network_events = await setup_network_test(events=[BEFORE_REQUEST_SENT_EVENT])
    events = network_events[BEFORE_REQUEST_SENT_EVENT]

    script_url = PAGE_SCRIPT_FETCH
    target_url = inline(f"<script type='module' src='{script_url}'></script>")

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=target_url,
        wait="complete",
    )

    # Wait until we receive 3 events: initial request, top-level script, inner script.
    wait = AsyncPoll(bidi_session, timeout=2)
    await wait.until(lambda _: len(events) >= 3)

    matches = [x for x in events if x["request"]["url"].endswith('empty.js')]

    assert len(matches) == 1
    recursive_compare(
        {
            "type": "script",
            "stackTrace": any_dict
        },
        matches[0]["initiator"],
    )


@pytest.mark.asyncio
async def test_initiator_css(
    bidi_session,
    top_context,
    setup_network_test,
    inline,
):
    network_events = await setup_network_test(events=[BEFORE_REQUEST_SENT_EVENT])
    events = network_events[BEFORE_REQUEST_SENT_EVENT]

    css_url = PAGE_CSS_IMPORTS_OTHER
    target_url = inline(f"<link rel='stylesheet' href='{css_url}'>")

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=target_url,
        wait="complete",
    )

    # Wait until we receive 3 events: initial request, top-level script, inner script.
    wait = AsyncPoll(bidi_session, timeout=2)
    await wait.until(lambda _: len(events) >= 3)

    matches = [x for x in events if x["request"]["url"].endswith(css_url)]

    assert len(matches) == 1
    recursive_compare(
        {
            "type": "parser",
            "lineNumber": any_int,
            "columnNumber": any_int,
            "url": any_string
        },
        matches[0]["initiator"],
    )


@pytest.mark.asyncio
async def test_initiator_inner_css(
    bidi_session,
    top_context,
    setup_network_test,
    inline,
):
    network_events = await setup_network_test(events=[BEFORE_REQUEST_SENT_EVENT])
    events = network_events[BEFORE_REQUEST_SENT_EVENT]

    css_url = PAGE_CSS_IMPORTS_OTHER
    target_url = inline(f"<link rel='stylesheet' href='{css_url}'>")

    await bidi_session.browsing_context.navigate(
        context=top_context["context"],
        url=target_url,
        wait="complete",
    )

    # Wait until we receive 3 events: initial request, top-level script, inner script.
    wait = AsyncPoll(bidi_session, timeout=2)
    await wait.until(lambda _: len(events) >= 3)

    matches = [x for x in events if x["request"]["url"].endswith("empty.css")]

    assert len(matches) == 1
    recursive_compare(
        {
            "type": "parser",
            "lineNumber": any_int,
            "columnNumber": any_int,
            "url": any_string
        },
        matches[0]["initiator"],
    )
