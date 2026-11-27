# Testing: https://w3c.github.io/core-aam/#role-map-alertdialog

TEST_HTML = "<div role='alertdialog' id='test'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_ALERT

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.ALERT

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXRole: AXGroup
#     # AXSubrole: AXApplicationAlertDialog

def test_ia2(ia2, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Role: ROLE_SYSTEM_DIALOG
    # Event: EVENT_SYSTEM_ALERT: .

    node = ia2.find_node("test", session.url)
    assert ia2.get_msaa_role(node) == "ROLE_SYSTEM_DIALOG"
    assert ia2.get_role(node) == "ROLE_SYSTEM_DIALOG"

def test_ia2_event(ia2, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Event: EVENT_SYSTEM_ALERT: .

    def add_element():
        session.execute_script("document.body.insertAdjacentHTML('beforeend', \"<div role='alertdialog' id='added'>content</div>\")")

    event = ia2.expect_event("EVENT_SYSTEM_ALERT", dom_id="added", action=add_element)
    assert event is not None

def test_uia(uia, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # Control Type: Pane

    node = uia.find_node("test", session.url)
    assert node.CurrentControlType == uia.ControlType.Pane
