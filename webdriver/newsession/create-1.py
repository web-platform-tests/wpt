#META: timeout=long

import pytest
from webdriver import error


from util.newsession import new_session
from conftest import product, flatten, platform_name


# Note that we can only test things here all implementations must support
valid_data = [
    ("proxy", [None]),
    ("unhandledPromptBehavior", ["dismiss", "accept", None]),
    ("test:extension", [True, "abc", 123, [], {"key": "value"}, None]),
]


@pytest.mark.parametrize("body", [lambda key, value: {"alwaysMatch": {key: value}},
                                  lambda key, value: {"firstMatch": [{key: value}]}])
@pytest.mark.parametrize("key,value", flatten(product(*item) for item in valid_data))
def test_valid(_function_session, body, key, value):
    resp = new_session(_function_session, {"capabilities": body(key, value)})

