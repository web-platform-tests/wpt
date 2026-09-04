# Testing: https://w3c.github.io/core-aam/#ariaHaspopupFalse

TEST_HTML = "<div role='button' id='test' aria-haspopup='false'>content</div>"

# Intentionally no ATSPI test. ATSPI does not surface this node or attribute.

# Intentionally no AX API test. AX API does not surface this node or attribute.

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # State: STATE_SYSTEM_HASPOPUP: not exposed
#     # Object Attribute: haspopup:false

# Intentionally no UIA test. UIA does not surface this node or attribute.
