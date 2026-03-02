TEST_HTML = "<div role=blockquote id=test></div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.BLOCK_QUOTE


def test_axapi(axapi, session, inline):
    session.url = inline(TEST_HTML)

    node = axapi.find_node("test", session.url)
    role = axapi.AXUIElementCopyAttributeValue(node, "AXRole", None)[1]
    assert role == "AXGroup"
    role = axapi.AXUIElementCopyAttributeValue(node, "AXSubrole", None)[1]
    assert role == None


def test_ia2(ia2, session, inline):
    session.url = inline(TEST_HTML)

    node = ia2.find_node("test", session.url)
    assert ia2.get_role(node) == "IA2_ROLE_BLOCK_QUOTE"
    assert ia2.get_msaa_role(node) == "ROLE_SYSTEM_GROUPING"


def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # This is an example, because the `uia` fixture is not implemented.
    node = uia.find_node("test", session.url)
    assert node.ControlType == "Group"
    assert node.LocalizedControlType == "blockquote"
