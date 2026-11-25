# Testing: https://w3c.github.io/aria/core-aam/#event-aria-expanded

TEST_HTML = "<div id='target' role='button' aria-expanded='false'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:state-changed:expanded

    node = atspi.find_node("target", session.url)
    assert "STATE_EXPANDED" not in atspi.get_state_list_helper(node)

    def toggle_aria_expanded():
        session.execute_script(
            "target.ariaExpanded = target.ariaExpanded === 'true' ? 'false' : 'true'",
        )

    event = atspi.expect_event(
        "object:state-changed:expanded", dom_id="target",
        action=toggle_aria_expanded,
    )

    assert event.detail1 == 1
    assert "STATE_EXPANDED" in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:expanded", dom_id="target",
        action=toggle_aria_expanded,
    )

    assert event.detail1 == 0
    assert "STATE_EXPANDED" not in atspi.get_state_list_helper(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRowExpanded,
#     # AXRowCollapsed,
#     # AXRowCountChanged

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # EVENT_OBJECT_STATECHANGE

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # PropertyChangedEvent
#     # Properties: AriaProperties, ExpandCollapseState as part of the ExpandCollapse pattern
