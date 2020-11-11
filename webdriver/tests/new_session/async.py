# META: timeout=long

import pytest

from .conftest import product, flatten

from tests.support.asserts import assert_success
from tests.new_session.support.create import valid_data


@pytest.mark.parametrize("key,value", flatten(product(*item) for item in valid_data))
def test_valid(new_session, add_browser_capabilities, key, value):
    new_async_session_response, get_session_response = new_async_session(
        {"capabilities": {
            "alwaysMatch": add_browser_capabilities({key: value})}})
    assert_success(new_async_session_response)
    assert_success(get_session_response)

@pytest.mark.parametrize("key,value", flatten(product(*item) for item in valid_data))
def test_get_session(get_session, add_browser_capabilities, key, value):
    bodyValue = get_session(
        {"capabilities": {
            "alwaysMatch": add_browser_capabilities({key: value})}})
    assert "sessionId" in bodyValue
    assert "capabilities" in bodyValue