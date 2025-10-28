import string

import pytest

from tests.support.asserts import assert_error, assert_success

__ascii_lowercase_table = str.maketrans(string.ascii_uppercase, string.ascii_lowercase)
__ascii_uppercase_table = str.maketrans(string.ascii_lowercase, string.ascii_uppercase)


def ascii_lowercase(s):
    return s.translate(__ascii_lowercase_table)


def ascii_uppercase(s):
    return s.translate(__ascii_uppercase_table)


@pytest.mark.parametrize("capability", ["browserName", "platformName"])
def test_value_is_lowercase(new_session, add_browser_capabilities, capability):
    response, _ = new_session(
        {"capabilities": {"alwaysMatch": add_browser_capabilities({})}}
    )
    value = assert_success(response)
    expected = value["capabilities"][capability]
    ascii_lowercase_expected = ascii_lowercase(expected)
    assert expected == ascii_lowercase_expected


@pytest.mark.parametrize("capability", ["browserName", "platformName"])
def test_value_is_case_sensitive(new_session, add_browser_capabilities, capability):
    always_match = add_browser_capabilities({})

    if capability in always_match:
        expected = always_match.pop(capability)
    else:
        response, _ = new_session({"capabilities": {"alwaysMatch": always_match}})
        value = assert_success(response)
        expected = value["capabilities"][capability]

    assert isinstance(expected, str)

    response, _ = new_session(
        {
            "capabilities": {
                "alwaysMatch": add_browser_capabilities(
                    {capability: ascii_uppercase(expected)}
                )
            }
        },
        delete_existing_session=True,
    )
    assert_error(response, "session not created")
