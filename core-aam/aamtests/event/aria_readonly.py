# Testing: https://w3c.github.io/aria/core-aam/#event-aria-readonly

TEST_HTML = "<div id='target' role='textbox' aria-readonly='false'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:state-changed:read-only

    node = atspi.find_node("target", session.url)
    assert "STATE_READ_ONLY" not in atspi.get_state_list_helper(node)

    def toggle_aria_readonly():
        session.execute_script(
            "target.ariaReadOnly = target.ariaReadOnly === 'true' ? 'false' : 'true'",
        )

    event = atspi.expect_event(
        "object:state-changed:read-only", dom_id="target",
        action=toggle_aria_readonly,
    )

    assert event.detail1 == 1
    assert "STATE_READ_ONLY" in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:read-only", dom_id="target",
        action=toggle_aria_readonly,
    )

    assert event.detail1 == 0
    assert "STATE_READ_ONLY" not in atspi.get_state_list_helper(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXReadOnlyStatusChanged

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
#     # Property: AriaProperties
