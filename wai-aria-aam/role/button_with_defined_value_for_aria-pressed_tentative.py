import pytest

TEST_HTML = {
    "true": "<div id=test role=button aria-pressed=true>press me</div>",
    "false": "<div id=test role=button aria-pressed=false>press me</div>"
}

@pytest.mark.parametrize("test_name,test_html", TEST_HTML.items(), ids=TEST_HTML.keys())
def test_atspi(atspi, session, inline, test_name, test_html):
    session.url = inline(test_html)

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.TOGGLE_BUTTON

@pytest.mark.parametrize("test_name,test_html", TEST_HTML.items(), ids=TEST_HTML.keys())
def test_axapi(axapi, session, inline, test_name, test_html):
    session.url = inline(test_html)

    # Todo: Add test for AX API.

@pytest.mark.parametrize("test_name,test_html", TEST_HTML.items(), ids=TEST_HTML.keys())
def test_ia2(ia2, session, inline, test_name, test_html):
    session.url = inline(test_html)

    # Todo: Add test for IA2.

@pytest.mark.parametrize("test_name,test_html", TEST_HTML.items(), ids=TEST_HTML.keys())
def test_uia(uia, session, inline, test_name, test_html):
    session.url = inline(test_html)

    # Todo: Add test for UIA.
