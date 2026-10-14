import json
import uuid

import pytest

from ... import assert_navigation_info

pytestmark = pytest.mark.asyncio

NAVIGATION_COMMITTED_EVENT = "browsingContext.navigationCommitted"


async def test_reload_navigation_id(
    bidi_session, subscribe_events, inline, new_tab, wait_for_events
):
    # navigationCommitted fires before scripts run, so the initial navigation
    # commits first, then the inline script triggers a reload.
    await subscribe_events(events=[NAVIGATION_COMMITTED_EVENT])

    page_url = inline(f"""
        <script type="text/javascript">
            const item = {json.dumps(str(uuid.uuid4()))};
            if (!sessionStorage.getItem(item)) {{
                sessionStorage.setItem(item, 'true');
                location.reload();
            }}
        </script>
    """)

    with wait_for_events([NAVIGATION_COMMITTED_EVENT]) as event_collector:
        await bidi_session.browsing_context.navigate(
            context=new_tab["context"], url=page_url
        )
        events = await event_collector.get_events(lambda evts: len(evts) >= 2)

    initial_event = events[0][1]
    reload_event = events[1][1]

    assert_navigation_info(initial_event, {"context": new_tab["context"], "url": page_url})
    assert initial_event["navigation"] is not None

    # Per spec the reload's navigationId should be null (the traversal algorithm
    # does not pass one), but this violates the spec's own assertion that
    # navigationId must be non-null at this point.
    assert_navigation_info(reload_event, {"context": new_tab["context"], "url": page_url})
    assert initial_event["navigation"] != reload_event["navigation"]
    assert reload_event["navigation"] is None
