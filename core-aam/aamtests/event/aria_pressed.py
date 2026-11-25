# Testing: https://w3c.github.io/aria/core-aam/#event-aria-pressed

TEST_HTML = "<div id='target' role='button' aria-pressed='false'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:state-changed:pressed

    node = atspi.find_node("target", session.url)
    assert "STATE_PRESSED" not in atspi.get_state_list_helper(node)

    def toggle_aria_pressed():
        session.execute_script(
            "target.ariaPressed = target.ariaPressed === 'true' ? 'false' : 'true'",
        )

    event = atspi.expect_event(
        "object:state-changed:pressed", dom_id="target",
        action=toggle_aria_pressed,
    )

    assert event.detail1 == 1
    assert "STATE_PRESSED" in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:pressed", dom_id="target",
        action=toggle_aria_pressed,
    )

    assert event.detail1 == 0
    assert "STATE_PRESSED" not in atspi.get_state_list_helper(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXPressedStateChanged

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
#     # Properties: AriaProperties, ToggleState as part of toggle pattern
