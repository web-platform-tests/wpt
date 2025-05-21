# META: timeout=long

import pytest

from tests.support.asserts import assert_error, assert_success


@pytest.mark.parametrize("body", [
    lambda key, value: {"alwaysMatch": {key: value}},
    lambda key, value: {"firstMatch": [{key: value}]}
], ids=["alwaysMatch", "firstMatch"])
def test_platform_name(new_session, add_browser_capabilities, body, target_platform):
    capabilities = body("platformName", target_platform)
    if "alwaysMatch" in capabilities:
        capabilities["alwaysMatch"] = add_browser_capabilities(capabilities["alwaysMatch"])
    else:
        capabilities["firstMatch"][0] = add_browser_capabilities(capabilities["firstMatch"][0])

    response, _ = new_session({"capabilities": capabilities})
    value = assert_success(response)

    assert value["capabilities"]["platformName"] == target_platform


invalid_merge = [
    ("acceptInsecureCerts", (True, True)),
    ("unhandledPromptBehavior", ("accept", "accept")),
    ("unhandledPromptBehavior", ("accept", "dismiss")),
    ("timeouts", ({"script": 10}, {"script": 10})),
    ("timeouts", ({"script": 10}, {"pageLoad": 10})),
]


@pytest.mark.parametrize("key,value", invalid_merge)
def test_merge_invalid(new_session, add_browser_capabilities, key, value):
    response, _ = new_session({"capabilities": {
        "alwaysMatch": add_browser_capabilities({key: value[0]}),
        "firstMatch": [{}, {key: value[1]}],
    }})
    assert_error(response, "invalid argument")


@pytest.mark.parametrize("capability", ["browserName", "platformName"])
def test_merge_firstMatch(new_session, add_browser_capabilities, capability):
    always_match = add_browser_capabilities({})

    if capability in always_match:
        expected = always_match.pop(capability)
    else:
        response, _ = new_session({"capabilities": {"alwaysMatch": always_match}})
        value = assert_success(response)
        expected = value["capabilities"][capability]

    assert isinstance(expected, str)

    # Remove pageLoadStrategy so we can use it to validate the merging of the firstMatch
    # capabilities, and guarantee the capability isn't simply ignored.
    if "pageLoadStrategy" in always_match:
        del always_match["pageLoadStrategy"]

    response, _ = new_session({
            "capabilities": {
                "alwaysMatch": always_match,
                "firstMatch": [
                    {
                        # This should be skipped, as it won't match.
                        capability: expected + "invalid",
                        "pageLoadStrategy": "none",
                    },
                    {
                        # Whereas this should match, and set the pageLoadStrategy.
                        capability: expected,
                        "pageLoadStrategy": "eager",
                    },
                ],
            }
        },
        delete_existing_session=True,
    )

    value = assert_success(response)

    assert value["capabilities"][capability] == expected
    assert value["capabilities"]["pageLoadStrategy"] == "eager"
