import pytest

import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


# Even though the user context is not expected to be created, if the user agent
# under the test does not support the parameter, the validation will not fail
# and unexpected user context will be created and will not be closed. Using
# `create_user_context` fixture guarantees the mistakenly created user context
# is destroyed.

@pytest.mark.parametrize("value", [42, "foo", {}, []])
async def test_accept_insecure_certs_invalid_type(create_user_context, value):
    with pytest.raises(error.InvalidArgumentException):
        await create_user_context(accept_insecure_certs=value)
