# Testing: https://w3c.github.io/aria/core-aam/#event-aria-required

TEST_HTML = "<div id='target' role='textbox' aria-required='false'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:state-changed:required

    node = atspi.find_node("target", session.url)
    assert "STATE_REQUIRED" not in atspi.get_state_list_helper(node)

    def toggle_aria_required():
        session.execute_script(
            "target.ariaRequired = target.ariaRequired === 'true' ? 'false' : 'true'",
        )

    event = atspi.expect_event(
        "object:state-changed:required", dom_id="target",
        action=toggle_aria_required,
    )

    assert event.detail1 == 1
    assert "STATE_REQUIRED" in atspi.get_state_list_helper(node)

    event = atspi.expect_event(
        "object:state-changed:required", dom_id="target",
        action=toggle_aria_required,
    )

    assert event.detail1 == 0
    assert "STATE_REQUIRED" not in atspi.get_state_list_helper(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRequiredStatusChanged

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
#     # Properties: AriaProperties, IsRequiredForForm
