# Testing: https://w3c.github.io/aria/core-aam/#event-aria-label

TEST_HTML = "<div id='target' role='article' aria-labelledby='label1'>content</div><div id='label1'>first label</div><div id='label2'>second label</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:property-change:accessible-name

    node = atspi.find_node("target", session.url)
    assert atspi.Accessible.get_name(node) == "first label"

    def change_aria_labelledby():
        session.execute_script("target.setAttribute('aria-labelledby', 'label2')")

    atspi.expect_event(
        "object:property-change:accessible-name", dom_id="target",
        action=change_aria_labelledby,
    )

    assert atspi.Accessible.get_name(node) == "second label"

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXLabelCreated

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # EVENT_OBJECT_NAMECHANGE

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # PropertyChangedEvent
#     # Property for aria-label: AriaProperties
#     # Property for aria-labelledby: LabeledBy
