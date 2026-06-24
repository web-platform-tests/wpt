# Testing: https://w3c.github.io/core-aam/#role-map-search

TEST_HTML = "<div role='search' id='test'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_LANDMARK
    # Object Attribute: xml-roles:search

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.LANDMARK
    assert "xml-roles:search" in atspi.Accessible.get_attributes_as_array(node)

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXGroup
#     # AXSubrole: AXLandmarkSearch

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: IA2_ROLE_LANDMARK
#     # Object Attribute: xml-roles:search

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: Group
    # Localized Control Type: search
    # Landmark Type: Search

    node = uia.find_node("test", session.url)
    assert uia.get_control_type(node) == "Group"
    assert uia.get_property(node, "LocalizedControlType") == "search"
    assert uia.get_landmark_type(node) == "Search"
