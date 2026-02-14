import pytest

TEST_HTML = {
    "true": "<div id=test role=button aria-pressed=true>press me</div>",
    "false": "<div id=test role=button aria-pressed=false>press me</div>"
}

@pytest.mark.parametrize("test_name", TEST_HTML)
def test_atspi(atspi, session, inline, test_name):
    if not atspi:
        return

    session.url = inline(TEST_HTML[test_name])

    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_role_name(node) == "toggle button"

@pytest.mark.parametrize("test_name", TEST_HTML)
def test_axapi(axapi, session, inline, test_name):
    if not axapi:
        return

    session.url = inline(TEST_HTML[test_name])

    # Todo: Add test for AX API.

@pytest.mark.parametrize("test_name", TEST_HTML)
def test_ia2(ia2, session, inline, test_name):
    if not ia2:
        return

    session.url = inline(TEST_HTML[test_name])

    # Todo: Add test for IA2.

@pytest.mark.parametrize("test_name", TEST_HTML)
def test_uia(uia, session, inline, test_name):
    if not uia:
        return

    session.url = inline(TEST_HTML[test_name])

    # Todo: Add test for UIA.
