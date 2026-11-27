# Testing: https://w3c.github.io/aria/core-aam/#event-aria-valuetext

TEST_HTML = "<div id='target' role='meter' aria-valuemin='0' aria-valuemax='100' aria-valuenow='50' aria-valuetext='fifty'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:property-change:accessible-value

    node = atspi.find_node("target", session.url)
    assert atspi.Accessible.get_attributes(node).get("valuetext") == "fifty"

    def change_aria_valuetext():
        session.execute_script("target.ariaValueText = 'seventy-five'")

    atspi.expect_event(
        "object:property-change:accessible-value", dom_id="target",
        action=change_aria_valuetext,
    )

    assert atspi.Accessible.get_attributes(node).get("valuetext") == "seventy-five"

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXValueChanged

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # EVENT_OBJECT_VALUECHANGE

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # PropertyChangedEvent
#     # Property: AriaProperties
