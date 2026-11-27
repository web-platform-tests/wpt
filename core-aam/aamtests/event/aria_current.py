# Testing: https://w3c.github.io/aria/core-aam/#event-aria-current

TEST_HTML = "<div id='target' role='article' aria-current='false'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:state-changed:active

    node = atspi.find_node("target", session.url)
    assert "STATE_ACTIVE" not in atspi.get_state_list_helper(node)

    def toggle_aria_current():
        session.execute_script(
            "target.ariaCurrent = target.ariaCurrent === 'true' ? 'false' : 'true'",
        )

    event = atspi.expect_event(
        "object:state-changed:active", dom_id="target",
        action=toggle_aria_current,
    )

    assert event.detail1 == 1
    assert "STATE_ACTIVE" in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:active", dom_id="target",
        action=toggle_aria_current,
    )

    assert event.detail1 == 0
    assert "STATE_ACTIVE" not in atspi.get_state_list_helper(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXCurrentStateChanged

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # IA2_EVENT_OBJECT_ATTRIBUTE_CHANGED

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # PropertyChangedEvent
#     # Property: AriaProperties
