import pytest

pytestmark = pytest.mark.asyncio

@pytest.mark.asyncio
async def test_subscribe_to_prefetch_status_updated(
    bidi_session, subscribe_events, new_tab, url
):
    """Test basic subscription to prefetch status updated events."""
    
    # Subscribe to prefetch status updated events
    await subscribe_events(events=["speculation.prefetchStatusUpdated"])
    
    # Navigate to a test page
    test_url = url("/common/blank.html", protocol="https")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_url,
        wait="complete",
    )
    
    assert True


@pytest.mark.asyncio
async def test_speculation_rules_generate_ready_events(
    bidi_session, subscribe_events, new_tab, url, wait_for_events, speculation_rules_helper, add_prefetch_link
):
    """Test that speculation rules generate prefetch events with proper pending->ready sequence."""

    await subscribe_events(events=["speculation.prefetchStatusUpdated"])

    test_url = url("/common/blank.html", protocol="https")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_url,
        wait="none",  
    )

    # Add speculation rules to trigger immediate prefetching
    prefetch_target = url("/common/dummy.xml", protocol="https")
    speculation_rules = f'''{{ 
        "prefetch": [{{
            "where": {{ "href_matches": "{prefetch_target}" }},
            "eagerness": "immediate"
        }}]
    }}'''

    # Set up event waiter before triggering prefetch
    with wait_for_events(["speculation.prefetchStatusUpdated"]) as waiter:
        # Add speculation rules and link to trigger prefetching
        await speculation_rules_helper(new_tab, speculation_rules)
        await add_prefetch_link(new_tab, prefetch_target)

        # Wait for pending and ready events
        events = await waiter.get_events(lambda events: len(events) == 2)

    # Verify all events have correct structure and sequence
    assert len(events) == 2, f"Expected 2 prefetch events (pending and ready), got {len(events)}"
    assert events == [
        ("speculation.prefetchStatusUpdated", {
            "url": prefetch_target,
            "status": "pending",
            "context": new_tab["context"]
        }),
        ("speculation.prefetchStatusUpdated", {
            "url": prefetch_target,
            "status": "ready",
            "context": new_tab["context"]
        })
    ], f"Events don't match expected sequence: {events}"


@pytest.mark.asyncio
async def test_speculation_rules_generate_events_with_navigation(
    bidi_session, subscribe_events, new_tab, url, wait_for_events, speculation_rules_helper, add_prefetch_link
):
    """Test that speculation rules generate prefetch events with navigation and success event after using prefetched page."""

    await subscribe_events(events=["speculation.prefetchStatusUpdated"])

    test_url = url("/common/blank.html", protocol="https")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_url,
        wait="none",
    )

    # Add speculation rules to trigger immediate prefetching
    prefetch_target = url("/common/dummy.xml", protocol="https")
    speculation_rules = f'''{{ 
        "prefetch": [{{
            "where": {{ "href_matches": "{prefetch_target}" }},
            "eagerness": "immediate"
        }}]
    }}'''

    # Set up event waiter before triggering prefetch - capture all events through navigation
    with wait_for_events(["speculation.prefetchStatusUpdated"]) as waiter:
        # Add speculation rules and link to trigger prefetching
        await speculation_rules_helper(new_tab, speculation_rules)
        await add_prefetch_link(new_tab, prefetch_target)
        
        # Wait for pending and ready events first
        events = await waiter.get_events(lambda events: len(events) >= 2)

        # Verify we got pending and ready events
        assert len(events) == 2, f"Expected 2 prefetch events (pending and ready), got {len(events)}"
        assert events == [
            ("speculation.prefetchStatusUpdated", {
                "url": prefetch_target,
                "status": "pending",
                "context": new_tab["context"]
            }),
            ("speculation.prefetchStatusUpdated", {
                "url": prefetch_target,
                "status": "ready",
                "context": new_tab["context"]
            })
        ], f"Events don't match expected sequence: {events}"

        # Now navigate to the prefetched page to potentially trigger success event
        # Navigate by clicking the link (user-initiated navigation to trigger success event)
        await bidi_session.script.evaluate(
            expression="""
                const prefetchLink = document.getElementById('prefetch-page');
                if (prefetchLink) {
                    prefetchLink.click();
                }
            """,
            target={"context": new_tab["context"]},
            await_promise=False
        )
        
        # Wait for success event after navigation to the prefetched page
        all_events = await waiter.get_events(lambda events: len(events) >= 3)

    # Verify all events have correct structure and sequence
    assert len(all_events) == 3, f"Expected 3 prefetch events (pending, ready, and success), got {len(all_events)}"
    assert all_events == [
        ("speculation.prefetchStatusUpdated", {
            "url": prefetch_target,
            "status": "pending",
            "context": new_tab["context"]
        }),
        ("speculation.prefetchStatusUpdated", {
            "url": prefetch_target,
            "status": "ready",
            "context": new_tab["context"]
        }),
        ("speculation.prefetchStatusUpdated", {
            "url": prefetch_target,
            "status": "success",
            "context": new_tab["context"]
        })
    ], f"Events don't match expected sequence: {events}"


@pytest.mark.asyncio
async def test_speculation_rules_generate_failure_events(
    bidi_session, subscribe_events, new_tab, url, wait_for_events, speculation_rules_helper, add_prefetch_link
):
    """Test that speculation rules generate pending and failure events for failed prefetch."""

    await subscribe_events(events=["speculation.prefetchStatusUpdated"])

    test_url = url("/common/blank.html", protocol="https")
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=test_url,
        wait="none",
    )

    # Create a target that will return 404 - use a non-existent path
    failed_target = url("/nonexistent/path/that/will/404.xml", protocol="https")

    # Add speculation rules to trigger immediate prefetching of 404 page
    speculation_rules = f'''{{ 
        "prefetch": [{{
            "where": {{ "href_matches": "{failed_target}" }},
            "eagerness": "immediate"
        }}]
    }}'''

    # Set up event waiter before triggering prefetch
    with wait_for_events(["speculation.prefetchStatusUpdated"]) as waiter:
        # Add speculation rules and link to trigger prefetching
        await speculation_rules_helper(new_tab, speculation_rules)
        await add_prefetch_link(new_tab, failed_target)
        
        # Wait for events (pending and failure)
        events = await waiter.get_events(lambda events: len(events) >= 2)

    # Verify all events have correct structure and sequence
    assert len(events) == 2, f"Expected 2 prefetch events (pending and failure), got {len(events)}"
    assert events == [
        ("speculation.prefetchStatusUpdated", {
            "url": failed_target,
            "status": "pending",
            "context": new_tab["context"]
        }),
        ("speculation.prefetchStatusUpdated", {
            "url": failed_target,
            "status": "failure",
            "context": new_tab["context"]
        })
    ], f"Events don't match expected sequence: {events}"

@pytest.mark.asyncio
async def test_unsubscribe_from_prefetch_status_updated(
    bidi_session
):
    """Test unsubscribing from prefetch status updated events."""
    
    # Subscribe to prefetch status updated events
    subscription_result = await bidi_session.session.subscribe(
        events=["speculation.prefetchStatusUpdated"]
    )
    subscription_id = subscription_result["subscription"]
    
    # Unsubscribe immediately
    await bidi_session.session.unsubscribe(subscriptions=[subscription_id])
    
    assert True