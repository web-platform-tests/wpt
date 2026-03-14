import pytest

TEST_HTML = {
    "no-attributes": "<div id=test role=button>click me</div>",
    "aria-pressed": "<div id=test role=button aria-pressed>click me</div>",
    "aria-pressed-and-aria-haspopup": "<div id=test role=button aria-pressed aria-haspopup>click me</div>",
    "aria-haspopup": "<div id=test role=button aria-haspopup>click me</div>",
    "aria-haspopup-false": "<div id=test role=button aria-haspopup=false>click me</div>",
}

@pytest.mark.parametrize("test_name,test_html", TEST_HTML.items(), ids=TEST_HTML.keys())
def test_atspi(atspi, session, inline, test_name, test_html):
    session.url = inline(test_html)

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role(node) == atspi.Role.PUSH_BUTTON

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
