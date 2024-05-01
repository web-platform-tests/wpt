import pytest

TEST_HTML = {
    "no-attributes": "<div id=test role=button>click me</div>",
    "aria-pressed": "<div id=test role=button aria-pressed>click me</div>",
    "aria-pressed-and-aria-haspopup": "<div id=test role=button aria-pressed aria-haspopup>click me</div>",
    "aria-haspopup": "<div id=test role=button aria-haspopup>click me</div>",
    "aria-haspopup-false": "<div id=test role=button aria-haspopup=false>click me</div>",
}

@pytest.mark.parametrize("test_name", TEST_HTML.keys())
def test_atspi(atspi, session, inline, test_name):
    if not atspi:
        return

    session.url = inline(TEST_HTML[test_name])

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role_name(node) == "button"

@pytest.mark.parametrize("test_name", TEST_HTML.keys())
def test_axapi(axapi, session, inline, test_name):
    if not axapi:
        return

    session.url = inline(TEST_HTML[test_name])

    # Todo: Add test for AX API.

@pytest.mark.parametrize("test_name", TEST_HTML.keys())
def test_ia2(ia2, session, inline, test_name):
    if not ia2:
        return

    session.url = inline(TEST_HTML[test_name])

    # Todo: Add test for IA2.

@pytest.mark.parametrize("test_name", TEST_HTML.keys())
def test_uia(uia, session, inline, test_name):
    if not uia:
        return

    session.url = inline(TEST_HTML[test_name])

    # Todo: Add test for UIA.
