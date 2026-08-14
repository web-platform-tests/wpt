# Testing: https://w3c.github.io/mathml-aam/#mmultiscripts

TEST_HTML = (
    "<math>"
    "  <mmultiscripts id='test'>"
    "    <mi id='base'>X</mi>"
    "    <mn id='sub'>1</mn>"
    "    <mn id='sup'>2</mn>"
    "    <mprescripts/>"
    "    <mn id='presub'>3</mn>"
    "    <mn id='presup'>4</mn>"
    "  </mmultiscripts>"
    "</math>"
)

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ATK_ROLE_SECTION
    # Object Attribute: tag:mmultiscripts

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.SECTION

    obj_attrs = atspi.Accessible.get_attributes(node)
    assert obj_attrs.get("tag") == "mmultiscripts"


def test_axapi(axapi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # AXRole: NSAccessibilityGroupRole
    # AXSubrole: AXMathMultiscript
    # AXAttributes: AXMathPostscripts, AXMathPrescripts

    node = axapi.find_node("test", session.url)

    role = axapi.AXUIElementCopyAttributeValue(node, "AXRole", None)[1]
    assert role == "AXGroup"

    subrole = axapi.AXUIElementCopyAttributeValue(node, "AXSubrole", None)[1]
    assert subrole == "AXMathMultiscript"

    postscripts = axapi.AXUIElementCopyAttributeValue(node, "AXMathPostscripts", None)[1]
    post_pair = postscripts[0]

    sub_node = post_pair.get("AXMathSubscript")
    sup_node = post_pair.get("AXMathSuperscript")
    assert axapi.AXUIElementCopyAttributeValue(sub_node, "AXDOMIdentifier", None)[1] == "sub"
    assert axapi.AXUIElementCopyAttributeValue(sup_node, "AXDOMIdentifier", None)[1] == "sup"

    prescripts = axapi.AXUIElementCopyAttributeValue(node, "AXMathPrescripts", None)[1]
    pre_pair = prescripts[0]

    presub_node = pre_pair.get("AXMathSubscript")
    presup_node = pre_pair.get("AXMathSuperscript")
    assert axapi.AXUIElementCopyAttributeValue(presub_node, "AXDOMIdentifier", None)[1] == "presub"
    assert axapi.AXUIElementCopyAttributeValue(presup_node, "AXDOMIdentifier", None)[1] == "presup"


def test_ia2(ia2, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: TBD
    # Role: TBD

    node = ia2.find_node("test", session.url)
    assert ia2.get_msaa_role(node) == "ROLE_SYSTEM_GROUPING"
