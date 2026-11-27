# Testing: https://w3c.github.io/core-aam/#role-map-image

TEST_HTML = "<div role='image' id='test'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_IMAGE
    # Interface: Image

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.IMAGE
    assert atspi.Accessible.get_image_iface(node) is not None

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXImage
#     # AXSubrole: <nil>

def test_ia2(ia2, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_SYSTEM_GRAPHIC
    # Interface: IAccessibleImage

    node = ia2.find_node("test", session.url)
    assert ia2.get_msaa_role(node) == "ROLE_SYSTEM_GRAPHIC"
    assert ia2.get_role(node) == "ROLE_SYSTEM_GRAPHIC"
    assert ia2.get_image_interface(node) is not None

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: Image

    node = uia.find_node("test", session.url)
    assert node.CurrentControlType == uia.ControlType.Image
