import pytest

from tests.support.sync import AsyncPoll
from webdriver.bidi.modules.script import ContextTarget
from webdriver.error import TimeoutException

from ... import any_int, any_string, recursive_compare, int_interval
from .. import assert_navigation_info

pytestmark = pytest.mark.asyncio

EMPTY_PAGE = "/webdriver/tests/bidi/support/empty.html"
FRAGMENT_NAVIGATED_EVENT = "browsingContext.fragmentNavigated"


async def test_unsubscribe(bidi_session, inline, top_context):
    await bidi_session.session.subscribe(events=[FRAGMENT_NAVIGATED_EVENT])
    await bidi_session.session.unsubscribe(events=[FRAGMENT_NAVIGATED_EVENT])

    # Track all received browsingContext.fragmentNavigated events in the events array
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(
        FRAGMENT_NAVIGATED_EVENT, on_event
    )

    url = inline("<div>foo</div>")

    # When navigation reaches complete state,
    # we should have received a browsingContext.fragmentNavigated event
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=url, wait="complete"
    )

    assert len(events) == 0

    remove_listener()


async def test_subscribe(bidi_session, subscribe_events, inline, new_tab, wait_for_event):
    await subscribe_events(events=[FRAGMENT_NAVIGATED_EVENT])

    on_entry = wait_for_event(FRAGMENT_NAVIGATED_EVENT)
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"], url=url)
    event = await on_entry

    assert_navigation_info(event, {"context": new_tab["context"], "url": url})


async def test_timestamp(bidi_session, current_time, subscribe_events, inline, new_tab, wait_for_event):
    await subscribe_events(events=[FRAGMENT_NAVIGATED_EVENT])

    time_start = await current_time()

    on_entry = wait_for_event(FRAGMENT_NAVIGATED_EVENT)
    url = inline("<div>foo</div>")
    await bidi_session.browsing_context.navigate(context=new_tab["context"], url=url)
    event = await on_entry

    time_end = await current_time()

    assert_navigation_info(
        event,
        {"context": new_tab["context"], "timestamp": int_interval(time_start, time_end)}
    )


async def test_iframe(bidi_session, subscribe_events, new_tab, test_page, test_page_same_origin_frame):
    events = []

    async def on_event(method, data):
        # Filter out events for about:blank to avoid browser differences
        if data["url"] != 'about:blank':
            events.append(data)

    remove_listener = bidi_session.add_event_listener(
        FRAGMENT_NAVIGATED_EVENT, on_event
    )
    await subscribe_events(events=[FRAGMENT_NAVIGATED_EVENT])

    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=test_page_same_origin_frame
    )

    wait = AsyncPoll(
        bidi_session, message="Didn't receive browsingContext.fragmentNavigated for frames"
    )
    await wait.until(lambda _: len(events) >= 2)
    assert len(events) == 2

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])

    assert len(contexts) == 1
    root_info = contexts[0]
    assert len(root_info["children"]) == 1
    child_info = root_info["children"][0]

    # The ordering of fragmentNavigated events is not guaranteed between the
    # root page and the iframe, find the appropriate events in the current list.
    first_is_root = events[0]["context"] == root_info["context"]
    root_event = events[0] if first_is_root else events[1]
    child_event = events[1] if first_is_root else events[0]

    assert_navigation_info(
        root_event,
        {"context": root_info["context"], "url": test_page_same_origin_frame}
    )
    assert_navigation_info(child_event, {"context": child_info["context"], "url": test_page})

    remove_listener()


async def test_cross_document(
    bidi_session, new_tab, url, subscribe_events, wait_for_event
):
    await subscribe_events([FRAGMENT_NAVIGATED_EVENT])

    on_frame_navigated = wait_for_event(FRAGMENT_NAVIGATED_EVENT)

    result = await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=url(EMPTY_PAGE))

    recursive_compare(
        {
            'context': new_tab["context"],
            'navigation': result["navigation"],
            'timestamp': any_int,
            'url': url(EMPTY_PAGE)
        },
        await on_frame_navigated,
    )


@pytest.mark.parametrize(
    "navigation_kind",
    ["browsing_context.navigate", "script.call_function"],
)
@pytest.mark.parametrize(
    "hash_before, hash_after",
    [
        ("", "#foo"),
        ("#foo", "#bar"),
        ("#foo", "#foo"),
        ("#bar", ""),
    ],
    ids=[
        "without hash to with hash",
        "with different hashes",
        "with identical hashes",
        "with hash to without hash",
    ],
)
async def test_navigate_in_the_same_document(
    bidi_session, new_tab, url, subscribe_events, wait_for_event, hash_before, hash_after, navigation_kind
):
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=url(EMPTY_PAGE + hash_before), wait="complete"
    )

    await subscribe_events([FRAGMENT_NAVIGATED_EVENT])

    on_frame_navigated = wait_for_event(FRAGMENT_NAVIGATED_EVENT)

    if navigation_kind == "browsing_context.navigate":
      result = await bidi_session.browsing_context.navigate(
          context=new_tab["context"], url=url(EMPTY_PAGE + hash_after))

      recursive_compare(
          {
              'context': new_tab["context"],
              'navigation': result["navigation"],
              'timestamp': any_int,
              'url': url(EMPTY_PAGE + hash_after)
          },
          await on_frame_navigated,
      )
    elif navigation_kind == "script.call_function":
      await bidi_session.script.call_function(
          raw_result=True,
          function_declaration="""(url) => {
              document.location = url;
          }""",
          arguments=[
              {"type": "string", "value": url(EMPTY_PAGE + hash_after)},
          ],
          await_promise=False,
          target=ContextTarget(new_tab["context"]),
      )

      recursive_compare(
          {
              'context': new_tab["context"],
              'timestamp': any_int,
              'url': url(EMPTY_PAGE + hash_after)
          },
          await on_frame_navigated,
      )
    else:
       raise Exception("Unknown navigation_kind")


@pytest.mark.parametrize("type_hint", ["tab", "window"])
async def test_new_context(bidi_session, subscribe_events, wait_for_event, type_hint):
    await subscribe_events(events=[FRAGMENT_NAVIGATED_EVENT])

    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(FRAGMENT_NAVIGATED_EVENT, on_event)

    await bidi_session.browsing_context.create(type_hint=type_hint)

    wait = AsyncPoll(bidi_session, timeout=0.5)
    with pytest.raises(TimeoutException):
        await wait.until(lambda _: len(events) > 0)

    remove_listener()


async def test_document_write(bidi_session, subscribe_events, top_context, wait_for_event):
    await subscribe_events(events=[FRAGMENT_NAVIGATED_EVENT])

    on_entry = wait_for_event(FRAGMENT_NAVIGATED_EVENT)


    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(FRAGMENT_NAVIGATED_EVENT, on_event)

    await bidi_session.script.evaluate(
        expression="""document.open(); document.write("<h1>Replaced</h1>"); document.close();""",
        target=ContextTarget(top_context["context"]),
        await_promise=False
    )

    wait = AsyncPoll(bidi_session, timeout=0.5)
    with pytest.raises(TimeoutException):
        await wait.until(lambda _: len(events) > 0)

    remove_listener()


async def test_page_with_base_tag(bidi_session, subscribe_events, inline, new_tab, wait_for_event):
    await subscribe_events(events=[FRAGMENT_NAVIGATED_EVENT])

    on_entry = wait_for_event(FRAGMENT_NAVIGATED_EVENT)
    url = inline("""<base href="/relative-path">""")
    await bidi_session.browsing_context.navigate(context=new_tab["context"], url=url)
    event = await on_entry

    assert_navigation_info(event, {"context": new_tab["context"], "url": url})
