import pytest

TEST_HTML = {
    "both": "<input role='combobox' id='test' aria-autocomplete='both'>",
    "inline": "<input role='combobox' id='test' aria-autocomplete='inline'>",
    "list": "<input role='combobox' id='test' aria-autocomplete='list'>",
}

@pytest.mark.parametrize("test_name", TEST_HTML.keys())
def test_atspi(atspi, session, inline, test_name):
    if not atspi:
        return

    session.url = inline(TEST_HTML[test_name])

    node = atspi.find_node("test", session.url)
    assert f"autocomplete:{test_name}" in atspi.Accessible.get_attributes_as_array(node)
    assert "STATE_SUPPORTS_AUTOCOMPLETION" in atspi.get_state_list_helper(node)


# Intentionally no AX API test, AX API does not map.

@pytest.mark.parametrize("test_name", TEST_HTML.keys())
def test_ia2(ia2, session, inline, test_name):
    if not ia2:
        return

    session.url = inline(TEST_HTML[test_name])

    # Todo: Add test for IA2.


# Intentionally no UIA test, UIA does not map.
