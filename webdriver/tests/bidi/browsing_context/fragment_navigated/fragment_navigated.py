import pytest

from tests.support.sync import AsyncPoll
from webdriver.bidi.modules.script import ContextTarget

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


async def test_navigate_to_new_document(
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
async def test_navigate_to_same_document(
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
              history.pushState(null, null, url);
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
              'navigation': None,
              'timestamp': any_int,
              'url': url(EMPTY_PAGE + hash_after)
          },
          await on_frame_navigated,
      )
    else:
       raise Exception("Unknown navigation_kind")
