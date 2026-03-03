import pytest

TEST_HTML = {
    "true": "<div id=test role=button aria-haspopup=true>click me</div>",
    "menu": "<div id=test role=button aria-haspopup=menu>click me</div>",
    "listbox": "<div id=test role=button aria-haspopup=listbox>click me</div>",
    "tree": "<div id=test role=button aria-haspopup=tree>click me</div>",
    "grid": "<div id=test role=button aria-haspopup=grid>click me</div>",
    "dialog": "<div id=test role=button aria-haspopup=dialog>click me</div>"
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
