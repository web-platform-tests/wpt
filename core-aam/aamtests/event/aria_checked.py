# Testing: https://w3c.github.io/aria/core-aam/#event-aria-checked

TEST_HTML = "<input id='target' type='checkbox'>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:state-changed:checked

    node = atspi.find_node("target", session.url)
    assert "STATE_CHECKED" not in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:checked", dom_id="target",
        action=lambda: session.find.css("#target", all=False).click(),
    )

    assert event.detail1 == 1
    assert "STATE_CHECKED" in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:checked", dom_id="target",
        action=lambda: session.find.css("#target", all=False).click(),
    )

    assert event.detail1 == 0
    assert "STATE_CHECKED" not in atspi.get_state_list_helper(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXValueChanged

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # EVENT_OBJECT_STATECHANGE

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # PropertyChangedEvent: AriaProperties, ToggleState
