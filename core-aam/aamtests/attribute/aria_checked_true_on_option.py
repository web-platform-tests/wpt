# Testing: https://w3c.github.io/core-aam/#ariaCheckedTrueOnOption

TEST_HTML = "<div role='listbox'> <div role='option' id='test' aria-checked='true'>content</div> </div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # State: STATE_CHECKABLE
    # State: STATE_CHECKED

    node = atspi.find_node("test", session.url)
    assert "STATE_CHECKABLE" in atspi.get_state_list_helper(node)
    assert "STATE_CHECKED" in atspi.get_state_list_helper(node)

def test_axapi(axapi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # AXSelected: true

    node = axapi.find_node("test", session.url)
    selected = axapi.AXUIElementCopyAttributeValue(node, "AXSelected", None)[1]
    assert selected == True

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # State: STATE_SYSTEM_CHECKED
#     # Object Attribute: checkable:true

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Property: Toggle.ToggleState: On (1)
#     # Property: SelectionItem.IsSelected: True for radio and menuitemradio
