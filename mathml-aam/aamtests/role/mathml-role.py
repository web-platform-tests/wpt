import pytest

# Testing MathML Core AAM Mappings: https://w3c.github.io/mathml-aam/#mathml-element-mappings
TEST_DATA = {
    "annotation": {
        "html": "<math><annotation id='test'>XML</annotation></math>",
        "atk_role": "ATK_ROLE_STATIC",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathText" # Not mapped, match chrome
    },
    "annotation-xml": {
        "html": "<math><annotation-xml id='test'>XML</annotation-xml></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "maction": {
        "html": "<math><maction id='test' actiontype='toggle'><mi>A</mi></maction></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "math": {
        "html": "<math id='test'><mi>x</mi></math>",
        "atk_role": "ATK_ROLE_MATH",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXDocumentMath"
    },
    "merror": {
        "html": "<math><merror id='test'><mtext>error</mtext></merror></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow"
    },
    "mfrac": {
        "html": "<math><mfrac id='test'><mi>a</mi><mi>b</mi></mfrac></math>",
        "atk_role": "ATK_ROLE_MATH_FRACTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathFraction"
    },
    "mi": {
        "html": "<math><mi id='test'>x</mi></math>",
        "atk_role": "ATK_ROLE_STATIC",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathIdentifier"
    },
    "mmultiscripts": {
        "html": "<math><mmultiscripts id='test'><mi>X</mi></mmultiscripts></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathMultiscript"
    },
    "mn": {
        "html": "<math><mn id='test'>2</mn></math>",
        "atk_role": "ATK_ROLE_STATIC",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathNumber"
    },
    "mo": {
        "html": "<math><mo id='test'>+</mo></math>",
        "atk_role": "ATK_ROLE_STATIC",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathOperator"
    },
    "mover": {
        "html": "<math><mover id='test'><mi>a</mi><mo>˙</mo></mover></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathUnderOver"
    },
    "mpadded": {
        "html": "<math><mpadded id='test'><mi>x</mi></mpadded></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "mphantom": {
        "html": "<math><mphantom style='visibility: visible;' id='test'><mi>x</mi></mphantom></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow"
    },
    "mprescripts": {
        "html": "<math><mmultiscripts><mi>X</mi><mprescripts id='test'/></mmultiscripts></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole", # Not mapped, match chrome 
        "ax_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "mroot": {
        "html": "<math><mroot id='test'><mi>x</mi><mn>3</mn></mroot></math>",
        "atk_role": "ATK_ROLE_MATH_ROOT",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRoot"
    },
    "mrow": {
        "html": "<math><mrow id='test'><mi>a</mi><mo>+</mo><mi>b</mi></mrow></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow"
    },
    "ms": {
        "html": "<math><ms id='test'>string</ms></math>",
        "atk_role": "ATK_ROLE_STATIC",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": None # nil
    },
    "mspace": {
        "html": "<math><mspace id='test' width='1em'/></math>",
        "atk_role": "ATK_ROLE_SECTION", # Not mapped, match chrome
        "ax_role": "NSAccessibilityGroupRole",  # Not mapped, match chrome
        "ax_subrole": "AXEmptyGroup" # Not mapped, match chrome
    },
    "msqrt": {
        "html": "<math><msqrt id='test'><mi>x</mi></msqrt></math>",
        "atk_role": "ATK_ROLE_MATH_ROOT",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathSquareRoot"
    },
    "mstyle": {
        "html": "<math><mstyle id='test' mathcolor='red'><mi>x</mi></mstyle></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow"
    },
    "msub": {
        "html": "<math><msub id='test'><mi>x</mi><mn>1</mn></msub></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathSubscriptSuperscript"
    },
    "msubsup": {
        "html": "<math><msubsup id='test'><mi>x</mi><mn>1</mn><mn>2</mn></msubsup></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathSubscriptSuperscript"
    },
    "msup": {
        "html": "<math><msup id='test'><mi>x</mi><mn>2</mn></msup></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathSubscriptSuperscript"
    },
    "mtable": {
        "html": "<math><mtable id='test'><mtr><mtd><mn>1</mn></mtd></mtr></mtable></math>",
        "atk_role": "ATK_ROLE_TABLE",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathTable"
    },
    "mtd": {
        "html": "<math><mtable><mtr><mtd id='test'><mn>1</mn></mtd></mtr></mtable></math>",
        "atk_role": "ATK_ROLE_TABLE_CELL",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathTableCell"
    },
    "mtext": {
        "html": "<math><mtext id='test'>text</mtext></math>",
        "atk_role": "ATK_ROLE_STATIC",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathText"
    },
    "mtr": {
        "html": "<math><mtable><mtr id='test'><mtd><mn>1</mn></mtd></mtr></mtable></math>",
        "atk_role": "ATK_ROLE_TABLE_ROW",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathTableRow"
    },
    "munder": {
        "html": "<math><munder id='test'><mi>x</mi><mo>_</mo></munder></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathUnderOver"
    },
    "munderover": {
        "html": "<math><munderover id='test'><mi>x</mi><mo>_</mo><mo>˙</mo></munderover></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathUnderOver"
    },
    "none": {
        "html": "<math><mmultiscripts><mi>X</mi><none id='test'/></mmultiscripts></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole", # Not mapped, match chrome
        "ax_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "semantics": {
        "html": "<math><semantics id='test'><mi>x</mi></semantics></math>",
        "atk_role": "ATK_ROLE_SECTION",
        "ax_role": "NSAccessibilityGroupRole",
        "ax_subrole": "AXMathRow" # Not mapped, match chrome
    }
}

@pytest.mark.parametrize("element_name", TEST_DATA.keys())
def test_atspi(atspi, session, inline, element_name):
    data = TEST_DATA[element_name]
    
    session.url = inline(data["html"])
    node = atspi.find_node("test", session.url)

    actual_role = atspi.Accessible.get_role(node)

    role_attr_name = data["atk_role"].replace("ATK_ROLE_", "")
    expected_role = getattr(atspi.Role, role_attr_name)

    assert actual_role == expected_role, f"Expected {expected_role}, but got {actual_role}"


@pytest.mark.parametrize("element_name", TEST_DATA.keys())
def test_axapi(axapi, session, inline, element_name):
    data = TEST_DATA[element_name]

    session.url = inline(data["html"])
    node = axapi.find_node("test", session.url)

    expected_role = data["ax_role"]
    if expected_role == "NSAccessibilityGroupRole":
        expected_role = "AXGroup"

    role_result = axapi.AXUIElementCopyAttributeValue(node, "AXRole", None)
    actual_role = role_result[1] if (role_result and len(role_result) > 1) else None
    assert actual_role == expected_role, f"AXRole mismatch for <{element_name}>. Expected '{data['ax_role']}', got '{actual_role}'"

    subrole_result = axapi.AXUIElementCopyAttributeValue(node, "AXSubrole", None)
    actual_subrole = subrole_result[1] if (subrole_result and len(subrole_result) > 1) else None
  
    assert actual_subrole == data["ax_subrole"], f"AXSubrole mismatch for <{element_name}>. Expected '{data['ax_subrole']}', got '{actual_subrole}'"
