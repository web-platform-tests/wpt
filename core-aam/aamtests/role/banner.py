# Testing: https://w3c.github.io/core-aam/#role-map-banner

TEST_HTML = "<div role='banner' id='test'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_LANDMARK
    # Object Attribute: xml-roles:banner

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.LANDMARK
    assert "xml-roles:banner" in atspi.Accessible.get_attributes_as_array(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXGroup
#     # AXSubrole: AXLandmarkBanner

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: IA2_ROLE_LANDMARK
#     # Object Attribute: xml-roles:banner

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: Group
    # Localized Control Type: banner
    # Landmark Type: Custom
    # Localized Landmark Type: banner
    node = uia.find_node("test", session.url)
    assert uia.get_control_type(node) == "Group"
    assert uia.get_property(node, "LocalizedControlType") == "banner"
    assert uia.get_landmark_type(node) == "Custom"
    assert uia.get_property(node, "LocalizedLandmarkType") == "banner"
