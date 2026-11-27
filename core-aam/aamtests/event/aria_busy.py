# Testing: https://w3c.github.io/aria/core-aam/#event-aria-busy

TEST_HTML = "<div id='target' role='article' aria-busy='false'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:state-changed:busy

    node = atspi.find_node("target", session.url)
    assert "STATE_BUSY" not in atspi.get_state_list_helper(node)

    def toggle_aria_busy():
        session.execute_script(
            "target.ariaBusy = target.ariaBusy === 'true' ? 'false' : 'true'",
        )

    event = atspi.expect_event(
        "object:state-changed:busy", dom_id="target",
        action=toggle_aria_busy,
    )

    assert event.detail1 == 1
    assert "STATE_BUSY" in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:busy", dom_id="target",
        action=toggle_aria_busy,
    )

    assert event.detail1 == 0
    assert "STATE_BUSY" not in atspi.get_state_list_helper(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXElementBusyChanged

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
