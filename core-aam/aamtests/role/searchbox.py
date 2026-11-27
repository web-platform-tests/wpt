import pytest

# Testing: https://w3c.github.io/core-aam/#role-map-searchbox

TEST_HTML = {
    "no-aria-readonly": "<div role='searchbox' contenteditable id='test'>content</div>",
    "aria-readonly-true": "<div role='searchbox' aria-readonly='true' contenteditable id='test'>content</div>"
}

@pytest.mark.parametrize("test_html", TEST_HTML.values(), ids=TEST_HTML.keys())
def test_atspi(atspi, session, inline, test_html):
    session.url = inline(test_html)

    # Spec:
    # Role: ROLE_ENTRY
    # Object Attribute: xml-roles:searchbox
    # Object Attribute: text-input-type:search
    # Interface: EditableText

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.ENTRY
    assert "xml-roles:searchbox" in atspi.Accessible.get_attributes_as_array(node)
    assert "text-input-type:search" in atspi.Accessible.get_attributes_as_array(node)
    assert atspi.Accessible.get_editable_text_iface(node) is not None

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXTextField
#     # AXSubrole: AXSearchField

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: ROLE_SYSTEM_TEXT
#     # Object Attribute: text-input-type:search

@pytest.mark.parametrize("test_html", TEST_HTML.values(), ids=TEST_HTML.keys())
def test_uia(uia, session, inline, test_html):
    session.url = inline(test_html)

    # Spec:
    # Control Type: Edit
    # Localized Control Type: search box

    node = uia.find_node("test", session.url)
    assert node.CurrentControlType == uia.ControlType.Edit
    assert node.CurrentLocalizedControlType == "search box"
