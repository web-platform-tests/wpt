# Testing: https://w3c.github.io/aria/core-aam/#event-aria-valuenow

TEST_HTML = "<div id='target' role='meter' aria-valuemin='0' aria-valuemax='100' aria-valuenow='50'>content</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:property-change:accessible-value

    node = atspi.find_node("target", session.url)
    value = atspi.Accessible.get_value_iface(node)
    assert atspi.Value.get_current_value(value) == 50

    def change_aria_valuenow():
        session.execute_script("target.ariaValueNow = '75'")

    atspi.expect_event(
        "object:property-change:accessible-value", dom_id="target",
        action=change_aria_valuenow,
    )

    assert atspi.Value.get_current_value(value) == 75

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
#     # Properties: AriaProperties, also RangeValueValue if element is mapped with RangeValue Control Pattern
