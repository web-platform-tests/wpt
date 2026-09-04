# Testing: https://w3c.github.io/core-aam/#ariaAtomicFalse

TEST_HTML = "<div role='group' id='test' aria-atomic='false' aria-live='polite'> <div role='group' id='child'>content</div> </div>"

# Intentionally no ATSPI test. ATSPI does not surface this node or attribute.

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Property: AXARIAAtomic: NO
#     # See also: Changes to document content or node visibility

# Intentionally no IA2 test. IA2 does not surface this node or attribute.

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Property: AriaProperties.atomic: false
#     # See also: Changes to document content or node visibility
