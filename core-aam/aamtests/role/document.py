# Testing: https://w3c.github.io/core-aam/#role-map-document

TEST_HTML = "<div role='document' id='test'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_DOCUMENT_FRAME

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.DOCUMENT_FRAME

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXGroup
#     # AXSubrole: AXDocument

def test_ia2(ia2, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_SYSTEM_DOCUMENT
    # State: STATE_SYSTEM_READONLY

    node = ia2.find_node("test", session.url)
    assert ia2.get_msaa_role(node) == "ROLE_SYSTEM_DOCUMENT"
    assert ia2.get_role(node) == "ROLE_SYSTEM_DOCUMENT"
    assert "READONLY" in ia2.get_msaa_state_list(node)

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: Document

    node = uia.find_node("test", session.url)
    assert node.CurrentControlType == uia.ControlType.Document
