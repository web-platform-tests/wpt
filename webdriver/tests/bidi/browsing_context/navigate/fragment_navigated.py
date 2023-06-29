import pytest

from tests.support.sync import AsyncPoll
from webdriver.bidi.modules.script import ContextTarget

from ... import any_int, any_string, recursive_compare

pytestmark = pytest.mark.asyncio

EMPTY_PAGE = "/webdriver/tests/bidi/browsing_context/navigate/support/empty.html"
FRAGMENT_NAVIGATED_EVENT = "browsingContext.fragmentNavigated"


async def test_fragment_navigated_new_document(
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
async def test_fragment_navigated_same_document(
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
