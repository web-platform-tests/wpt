import pytest

TEST_CASES = {
    "mathml-link": '<math><a href="https://baidu.com" id="test"><mtext>Link</mtext></a></math>',
    "mathml-link-without-href": '<math><a id="test"><mtext>Link</mtext></a></math>',
}

@pytest.mark.parametrize("test_id, test_html", TEST_CASES.items(), ids=TEST_CASES.keys())
class TestMathMLALink:

    def test_atspi(self, atspi, session, inline, test_id, test_html):
        session.url = inline(test_html)
        
        node = atspi.find_node("test", session.url)
        has_href = "href" in test_html
        if has_href:
            assert atspi.Accessible.get_role(node) == atspi.Role.LINK
            hyperlink = atspi.Accessible.get_hyperlink(node)
            assert hyperlink is not None, "hyperlink interface should be present for link role"
            link = hyperlink.get_uri(0)
            assert link == "https://baidu.com/"
        else:
            assert atspi.Accessible.get_role(node) == atspi.Role.SECTION

    def test_axapi(self, axapi, session, inline, test_id, test_html):
        session.url = inline(test_html)
        node = axapi.find_node("test", session.url)

        role = axapi.AXUIElementCopyAttributeValue(node, "AXRole", None)[1]
        
        if test_id == "mathml-link":
            assert role == "AXLink"
        else:
            assert role != "AXLink"

    def test_ia2(self, ia2, session, inline, test_id, test_html):
        session.url = inline(test_html)
        node = ia2.find_node("test", session.url)

        if test_id == "mathml-link":
            assert ia2.get_role(node) == "ROLE_SYSTEM_LINK"
            assert ia2.get_hyperlink_interface(node) is not None
            msaa_state = ia2.get_msaa_state_list(node)
            assert "LINKED" in msaa_state
        else:
            assert ia2.get_role(node) != "ROLE_SYSTEM_LINK"
            assert ia2.get_hyperlink_interface(node) is None