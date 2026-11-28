# Testing: https://w3c.github.io/core-aam/#ariaCheckedFalse

TEST_HTML = "<div role='listbox'> <div role='option' id='test' aria-checked='false'>content</div> </div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # State: STATE_CHECKABLE
    # State: STATE_CHECKED: not exposed

    node = atspi.find_node("test", session.url)
    assert "STATE_CHECKABLE" in atspi.get_state_list_helper(node)
    assert "STATE_CHECKED" not in atspi.get_state_list_helper(node)

def test_axapi(axapi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # AXSelected: false

    node = axapi.find_node("test", session.url)
    selected = axapi.AXUIElementCopyAttributeValue(node, "AXSelected", None)[1]
    assert selected == False

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # State: STATE_SYSTEM_CHECKED: not exposed
#     # Object Attribute: checkable:true

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Property: Toggle.ToggleState: Off (0)
#     # Property: SelectionItem.IsSelected: False for radio and menuitemradio
