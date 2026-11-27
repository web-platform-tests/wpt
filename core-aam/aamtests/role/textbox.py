import pytest

# Testing: https://w3c.github.io/core-aam/#role-map-textbox

TEST_HTML = {
    "no-aria-readonly": "<div role='searchbox' contenteditable id='test'>content</div>",
    "aria-readonly-true": "<div role='searchbox' aria-readonly='true' contenteditable id='test'>content</div>"
}

@pytest.mark.parametrize("test_html", TEST_HTML.values(), ids=TEST_HTML.keys())
def test_atspi_editable(atspi, session, inline, test_html):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_ENTRY
    # State: STATE_SINGLE_LINE
    # Interface: EditableText

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.ENTRY
    assert "STATE_SINGLE_LINE" in atspi.get_state_list_helper(node)
    assert atspi.Accessible.get_editable_text_iface(node) is not None


# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXTextField
#     # AXSubrole: <nil>

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # Role: ROLE_SYSTEM_TEXT
#     # State: IA2_STATE_SINGLE_LINE

@pytest.mark.parametrize("test_html", TEST_HTML.values(), ids=TEST_HTML.keys())
def test_uia(uia, session, inline, test_html):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: Edit

    node = uia.find_node("test", session.url)
    assert node.CurrentControlType == uia.ControlType.Edit
