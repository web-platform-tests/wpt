# Testing: https://w3c.github.io/core-aam/#role-map-listitem

TEST_HTML = "<div role='list'> <div role='listitem' id='test'>content</div> </div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_LIST_ITEM

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.LIST_ITEM

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXGroup
#     # AXSubrole: <nil>

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: ROLE_SYSTEM_LISTITEM
#     # State: STATE_SYSTEM_READONLY

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: ListItem
    # Control Pattern: SelectionItem
    # SelectionItem.SelectionContainer: list

    node = uia.find_node("test", session.url)
    assert uia.get_control_type(node) == "ListItem"

    assert "SelectionItem" in uia.get_supported_patterns(node)
    selection_pattern_attr = uia.get_pattern_attr(node, "SelectionItem")
    assert selection_pattern_attr["IsSelected"] == 0
