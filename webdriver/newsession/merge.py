#META: timeout=long

import pytest
from webdriver import error


from util.newsession import new_session
from conftest import product, flatten, platform_name

@pytest.mark.skipif(platform_name() is None, reason="Unsupported platform")
@pytest.mark.parametrize("body", [lambda key, value: {"alwaysMatch": {key: value}},
                                  lambda key, value: {"firstMatch": [{key: value}]}])
def test_platform_name(_function_session, platform_name, body):
    resp = new_session(_function_session, {"capabilities": body("platformName", platform_name)})
    assert resp["capabilities"]["platformName"] == platform_name


invalid_merge = [
    ("acceptInsecureCerts", (True, True)),
    ("unhandledPromptBehavior", ("accept", "accept")),
    ("unhandledPromptBehavior", ("accept", "dismiss")),
    ("timeouts", ({"script": 10}, {"script": 10})),
    ("timeouts", ({"script": 10}, {"pageLoad": 10})),
]


@pytest.mark.parametrize("key,value", invalid_merge)
def test_merge_invalid(_function_session, key, value):
    with pytest.raises(error.InvalidArgumentException):
        resp = new_session(_function_session, {"capabilities":
                                               {"alwaysMatch": {key: value[0]},
                                                "firstMatch": [{}, {key: value[1]}]}})


@pytest.mark.skipif(platform_name() is None, reason="Unsupported platform")
def test_merge_platformName(_function_session, platform_name):
    resp = new_session(_function_session, {"capabilities":
                                           {"alwaysMatch": {"timeouts": {"script": 10}}},
                                            "firstMatch": [
                                                {
                                                    "platformName": platform_name.upper(),
                                                    "pageLoadStrategy": "none"
                                                },
                                                {
                                                    "platformName": platform_name,
                                                    "pageLoadStrategy": "eager"
                                                }
                                            ]})

    assert resp["capabilities"]["platformName"] == platform_name
    assert resp["capabilities"]["pageLoadStrategy"] == "eager"


def test_merge_browserName(_function_session, browser_settings):
    resp = new_session(_function_session, {"capabilities":
                                           {"alwaysMatch": {"timeouts": {"script": 10}}},
                                            "firstMatch": [
                                                {
                                                    "browserName": browser_settings["browserName"] + "invalid",
                                                    "pageLoadStrategy": "none"
                                                },
                                                {
                                                    "browserName": browser_settings["browserName"],
                                                    "pageLoadStrategy": "eager"
                                                }
                                            ]})

    assert resp["capabilities"]["browserName"] == browser_settings['browserName']
    assert resp["capabilities"]["pageLoadStrategy"] == "eager"
