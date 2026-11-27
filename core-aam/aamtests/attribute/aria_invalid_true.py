# Testing: https://w3c.github.io/core-aam/#ariaInvalidTrue

TEST_HTML = "<div role='textbox' id='test' aria-invalid='true'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # State: STATE_INVALID_ENTRY
    # Text Attribute: invalid:true

    node = atspi.find_node("test", session.url)
    assert "STATE_INVALID_ENTRY" in atspi.get_state_list_helper(node)
    assert atspi.Text.get_text_attribute_value(node, 0, "invalid") == "true"

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Property: AXInvalid: true

def test_ia2(ia2, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # State: IA2_STATE_INVALID_ENTRY
    # Text Attribute: invalid:true

    node = ia2.find_node("test", session.url)
    assert "INVALID_ENTRY" in ia2.get_state_list(node)
    assert ia2.get_text_attributes(node).get("invalid") == "true"

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Property: IsDataValidForForm: false
