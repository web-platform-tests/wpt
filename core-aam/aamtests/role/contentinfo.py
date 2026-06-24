# Testing: https://w3c.github.io/core-aam/#role-map-contentinfo

TEST_HTML = "<div role='contentinfo' id='test'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_LANDMARK
    # Object Attribute: xml-roles:contentinfo

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.LANDMARK
    assert "xml-roles:contentinfo" in atspi.Accessible.get_attributes_as_array(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXGroup
#     # AXSubrole: AXLandmarkContentInfo

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: IA2_ROLE_LANDMARK
#     # Object Attribute: xml-roles:contentinfo

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: Group
    # Localized Control Type: content information
    # Landmark Type: Custom
    # Localized Landmark Type: content information

    node = uia.find_node("test", session.url)
    assert uia.get_control_type(node) == "Group"
    assert uia.get_property(node, "LocalizedControlType") == "content information"
    assert uia.get_landmark_type(node) == "Custom"
    assert uia.get_property(node, "LocalizedLandmarkType") == "content information"