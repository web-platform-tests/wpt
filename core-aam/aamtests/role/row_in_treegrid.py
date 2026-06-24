# Testing: https://w3c.github.io/core-aam/#role-map-row-in-treegrid

TEST_HTML = "<div role='treegrid'> <div role='row' id='test'> <div role='gridcell'>content</div> </div> </div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_TABLE_ROW

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.TABLE_ROW

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXRow
#     # AXSubrole: <nil>

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: ROLE_SYSTEM_OUTLINEITEM

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: DataItem
    # Localized Control Type: row
    # Control Pattern: SelectionItem

    node = uia.find_node("test", session.url)
    assert uia.get_control_type(node) == "DataItem"
    assert uia.get_property(node, "LocalizedControlType") == "row"

    assert "SelectionItem" in uia.get_supported_patterns(node)
    selection_pattern_attr = uia.get_pattern_attr(node, "SelectionItem")
    assert selection_pattern_attr["IsSelected"] == 0
