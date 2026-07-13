import pytest

# Testing MathML Core AAM Mappings: https://w3c.github.io/mathml-aam/#mathml-element-mappings
# FIXME: For role that is not mapped, TBD and nil, we match the chrome behavior for now
# See https://github.com/w3c/mathml-aam/issues/41
TEST_DATA = {
    "annotation": {
        "html": "<math><annotation id='test'>XML</annotation></math>",
        "atspi_role": "ROLE_STATIC",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathText" # Not mapped, match chrome
    },
    "annotation-xml": {
        "html": "<math><annotation-xml id='test'>XML</annotation-xml></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "maction": {
        "html": "<math><maction id='test' actiontype='toggle'><mi>A</mi></maction></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "math": {
        "html": "<math id='test'><mi>x</mi></math>",
        "atspi_role": "ROLE_MATH",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXDocumentMath"
    },
    "merror": {
        "html": "<math><merror id='test'><mtext>error</mtext></merror></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow"
    },
    "mfrac": {
        "html": "<math><mfrac id='test'><mi>a</mi><mi>b</mi></mfrac></math>",
        "atspi_role": "ROLE_MATH_FRACTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathFraction"
    },
    "mi": {
        "html": "<math><mi id='test'>x</mi></math>",
        "atspi_role": "ROLE_STATIC",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathIdentifier"
    },
    "mmultiscripts": {
        "html": "<math><mmultiscripts id='test'><mi>X</mi></mmultiscripts></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathMultiscript"
    },
    "mn": {
        "html": "<math><mn id='test'>2</mn></math>",
        "atspi_role": "ROLE_STATIC",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathNumber"
    },
    "mo": {
        "html": "<math><mo id='test'>+</mo></math>",
        "atspi_role": "ROLE_STATIC",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathOperator"
    },
    "mover": {
        "html": "<math><mover id='test'><mi>a</mi><mo>˙</mo></mover></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathUnderOver"
    },
    "mpadded": {
        "html": "<math><mpadded id='test'><mi>x</mi></mpadded></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "mphantom": {
        "html": "<math><mphantom style='visibility: visible;' id='test'><mi>x</mi></mphantom></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow"
    },
    "mprescripts": {
        "html": "<math><mmultiscripts><mi>X</mi><mprescripts id='test'/></mmultiscripts></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole", # Not mapped, match chrome 
        "axapi_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "mroot": {
        "html": "<math><mroot id='test'><mi>x</mi><mn>3</mn></mroot></math>",
        "atspi_role": "ROLE_MATH_ROOT",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRoot"
    },
    "mrow": {
        "html": "<math><mrow id='test'><mi>a</mi><mo>+</mo><mi>b</mi></mrow></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow"
    },
    "ms": {
        "html": "<math><ms id='test'>string</ms></math>",
        "atspi_role": "ROLE_STATIC",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": None # nil
    },
    "mspace": {
        "html": "<math><mspace id='test' width='1em'/></math>",
        "atspi_role": "ROLE_SECTION", # Not mapped, match chrome
        "axapi_role": "NSAccessibilityGroupRole",  # Not mapped, match chrome
        "axapi_subrole": "AXEmptyGroup" # Not mapped, match chrome
    },
    "msqrt": {
        "html": "<math><msqrt id='test'><mi>x</mi></msqrt></math>",
        "atspi_role": "ROLE_MATH_ROOT",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathSquareRoot"
    },
    "mstyle": {
        "html": "<math><mstyle id='test' mathcolor='red'><mi>x</mi></mstyle></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow"
    },
    "msub": {
        "html": "<math><msub id='test'><mi>x</mi><mn>1</mn></msub></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathSubscriptSuperscript"
    },
    "msubsup": {
        "html": "<math><msubsup id='test'><mi>x</mi><mn>1</mn><mn>2</mn></msubsup></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathSubscriptSuperscript"
    },
    "msup": {
        "html": "<math><msup id='test'><mi>x</mi><mn>2</mn></msup></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathSubscriptSuperscript"
    },
    "mtable": {
        "html": "<math><mtable id='test'><mtr><mtd><mn>1</mn></mtd></mtr></mtable></math>",
        "atspi_role": "ROLE_TABLE",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathTable"
    },
    "mtd": {
        "html": "<math><mtable><mtr><mtd id='test'><mn>1</mn></mtd></mtr></mtable></math>",
        "atspi_role": "ROLE_TABLE_CELL",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathTableCell"
    },
    "mtext": {
        "html": "<math><mtext id='test'>text</mtext></math>",
        "atspi_role": "ROLE_STATIC",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathText"
    },
    "mtr": {
        "html": "<math><mtable><mtr id='test'><mtd><mn>1</mn></mtd></mtr></mtable></math>",
        "atspi_role": "ROLE_TABLE_ROW",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathTableRow"
    },
    "munder": {
        "html": "<math><munder id='test'><mi>x</mi><mo>_</mo></munder></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathUnderOver"
    },
    "munderover": {
        "html": "<math><munderover id='test'><mi>x</mi><mo>_</mo><mo>˙</mo></munderover></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathUnderOver"
    },
    "none": {
        "html": "<math><mmultiscripts><mi>X</mi><none id='test'/></mmultiscripts></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole", # Not mapped, match chrome
        "axapi_subrole": "AXMathRow" # Not mapped, match chrome
    },
    "semantics": {
        "html": "<math><semantics id='test'><mi>x</mi></semantics></math>",
        "atspi_role": "ROLE_SECTION",
        "axapi_role": "NSAccessibilityGroupRole",
        "axapi_subrole": "AXMathRow" # Not mapped, match chrome
    }
}

@pytest.mark.parametrize("element_name", TEST_DATA.keys())
def test_atspi(atspi, session, inline, element_name):
    data = TEST_DATA[element_name]
    
    session.url = inline(data["html"])
    node = atspi.find_node("test", session.url)

    actual_role = atspi.Accessible.get_role(node)

    role_attr_name = data["atspi_role"].replace("ROLE_", "")
    expected_role = getattr(atspi.Role, role_attr_name)

    assert actual_role == expected_role, f"Expected {expected_role}, but got {actual_role}"


@pytest.mark.parametrize("element_name", TEST_DATA.keys())
def test_axapi(axapi, session, inline, element_name):
    data = TEST_DATA[element_name]

    session.url = inline(data["html"])
    node = axapi.find_node("test", session.url)

    expected_role = data["axapi_role"]
    if expected_role == "NSAccessibilityGroupRole":
        expected_role = "AXGroup"

    role_result = axapi.AXUIElementCopyAttributeValue(node, "AXRole", None)
    actual_role = role_result[1] if (role_result and len(role_result) > 1) else None
    assert actual_role == expected_role, f"AXRole mismatch for <{element_name}>. Expected '{data['axapi_role']}', got '{actual_role}'"

    subrole_result = axapi.AXUIElementCopyAttributeValue(node, "AXSubrole", None)
    actual_subrole = subrole_result[1] if (subrole_result and len(subrole_result) > 1) else None
  
    assert actual_subrole == data["axapi_subrole"], f"AXSubrole mismatch for <{element_name}>. Expected '{data['axapi_subrole']}', got '{actual_subrole}'"
