# MathML AAM Reference: https://w3c.github.io/mathml-aam/#mathml-element-mappings
import pytest

TEST_DATA_ATTRIBUTES = {
    "mfrac": {
        "html": "<math><mfrac id='test'><mn id='num'>1</mn><mn id='den'>2</mn></mfrac></math>",
        "tag": "mfrac",
        "ax_attrs": {"AXMathFractionNumerator": "num", "AXMathFractionDenominator": "den"}
    },
    "mover": {
        "html": "<math><mover id='test'><mi id='base'>a</mi><mo id='over'>˙</mo></mover></math>",
        "tag": "mover",
        "ax_attrs": {"AXMathBase": "base", "AXMathOver": "over"}
    },
    "mroot": {
        "html": "<math><mroot id='test'><mi id='rad'>x</mi><mn id='idx'>3</mn></mroot></math>",
        "tag": "mroot",
        "ax_attrs": {"AXMathRootRadicand": "rad", "AXMathRootIndex": "idx"}
    },
    "msqrt": {
        "html": "<math><msqrt id='test'><mi id='rad1'>x</mi></msqrt></math>",
        "tag": "msqrt",
        "ax_attrs": {"AXMathRootRadicand": "rad1"}
    },
    "msub": {
        "html": "<math><msub id='test'><mi id='base'>x</mi><mn id='sub'>1</mn></msub></math>",
        "tag": "msub",
        "ax_attrs": {"AXMathBase": "base", "AXMathSubscript": "sub"}
    },
    "msubsup": {
        "html": "<math><msubsup id='test'><mi id='base'>x</mi><mn id='sub'>1</mn><mn id='sup'>2</mn></msubsup></math>",
        "tag": "msubsup",
        "ax_attrs": {"AXMathBase": "base", "AXMathSubscript": "sub", "AXMathSuperscript": "sup"}
    },
    "msup": {
        "html": "<math><msup id='test'><mi id='base'>x</mi><mn id='sup'>2</mn></msup></math>",
        "tag": "msup",
        "ax_attrs": {"AXMathBase": "base", "AXMathSuperscript": "sup"}
    },
    "mtable": {
        "html": "<math><mtable id='test'><mtr><mtd><mn>1</mn></mtd></mtr></mtable></math>",
        "tag": "mtable",
        "interface": "AtkTable"
    },
    "mtd": {
        "html": "<math><mtable><mtr><mtd id='test'><mn>1</mn></mtd></mtr></mtable></math>",
        "tag": "mtd",
        "interface": "AtkTableCell"
    },
    "munder": {
        "html": "<math><munder id='test'><mi id='base'>x</mi><mo id='under'>_</mo></munder></math>",
        "tag": "munder",
        "ax_attrs": {"AXMathBase": "base", "AXMathUnder": "under"}
    },
    "munderover": {
        "html": "<math><munderover id='test'><mi id='base'>x</mi><mo id='under'>_</mo><mo id='over'>˙</mo></munderover></math>",
        "tag": "munderover",
        "ax_attrs": {"AXMathBase": "base", "AXMathUnder": "under", "AXMathOver": "over"}
    },
    "mn": {
        "html": "<math><mn id='test'>2</mn></math>",
        "tag": "mn",
    }
}

@pytest.mark.parametrize("element_name", TEST_DATA_ATTRIBUTES.keys())
def test_atspi(atspi, session, inline, element_name):
    data = TEST_DATA_ATTRIBUTES[element_name]
    session.url = inline(data["html"])
    node = atspi.find_node("test", session.url)

    if "tag" in data:
        obj_attrs = atspi.Accessible.get_attributes(node)
        assert "tag" in obj_attrs, f"<{element_name}> object attributes missing 'tag' key. Found: {obj_attrs}"
        assert obj_attrs["tag"] == data["tag"], f"Expected tag '{data['tag']}', got '{obj_attrs['tag']}'"

    if "interface" in data:
        if data["interface"] == "AtkTable":
            table_iface = atspi.Accessible.get_table_iface(node)
            assert table_iface is not None, "mtable node must implement AtkTable interface"
        elif data["interface"] == "AtkTableCell":
            cell_iface = atspi.Accessible.get_table_cell(node)
            assert cell_iface is not None, "mtd node must implement AtkTableCell interface"


AX_ATTR_CASES = [name for name, d in TEST_DATA_ATTRIBUTES.items() if "ax_attrs" in d]

@pytest.mark.parametrize("element_name", AX_ATTR_CASES)
def test_axapi(axapi, session, inline, element_name):
    data = TEST_DATA_ATTRIBUTES[element_name]
    session.url = inline(data["html"])
    node = axapi.find_node("test", session.url)

    expected_relationships = data["ax_attrs"]
    
    for ax_attr_key, expected_dom_id in expected_relationships.items():
        attr_res = axapi.AXUIElementCopyAttributeValue(node, ax_attr_key, None)
        target_node = attr_res[1] if (attr_res and len(attr_res) > 1) else None
        
        assert target_node is not None, f"Relationship attribute '{ax_attr_key}' on <{element_name}> returned None."
        
        actual_dom_id = axapi.AXUIElementCopyAttributeValue(target_node, "AXDOMIdentifier", None)[1]
        assert actual_dom_id == expected_dom_id, f"Pointer '{ax_attr_key}' expected to target id '{expected_dom_id}', but got '{actual_dom_id}'"