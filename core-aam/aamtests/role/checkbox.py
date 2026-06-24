# Testing: https://w3c.github.io/core-aam/#role-map-checkbox

TEST_HTML = "<div role='checkbox' id='test'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_CHECK_BOX

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.CHECK_BOX

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXCheckBox
#     # AXSubrole: <nil>
#     # See also: aria-checked in the State and Property Mapping Tables

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: ROLE_SYSTEM_CHECKBUTTON
#     # See also: aria-checked in the State and Property Mapping Tables

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: CheckBox
    # See also: aria-checked in the State and Property Mapping Tables

    node = uia.find_node("test", session.url)
    assert uia.get_control_type(node) == "CheckBox"

    assert "Toggle" in uia.get_supported_patterns(node)
    toggle_pattern_attr = uia.get_pattern_attr(node, "Toggle")
    assert toggle_pattern_attr["ToggleState"] == 0
