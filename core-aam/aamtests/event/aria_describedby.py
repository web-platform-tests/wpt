# Testing: https://w3c.github.io/aria/core-aam/#event-aria-describedby

TEST_HTML = "<div id='target' role='article' aria-describedby='desc1'>content</div><div id='desc1'>first description</div><div id='desc2'>second description</div>"

def test_atspi(atspi, session, inline):
    session.url = inline(TEST_HTML)

    # Spec:
    # object:property-change:accessible-description

    node = atspi.find_node("target", session.url)
    assert atspi.Accessible.get_description(node) == "first description"

    def change_aria_describedby():
        session.execute_script("target.setAttribute('aria-describedby', 'desc2')")

    atspi.expect_event(
        "object:property-change:accessible-description", dom_id="target",
        action=change_aria_describedby,
    )

    assert atspi.Accessible.get_description(node) == "second description"

# def test_axapi(axapi, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # AXDescribedByChanged

# def test_ia2(ia2, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # EVENT_OBJECT_DESCRIPTIONCHANGE

# def test_uia(uia, session, inline):
#     session.url = inline(TEST_HTML)
#
#     # Spec:
#     # PropertyChangedEvent
#     # Properties: DescribedBy
