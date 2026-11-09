import pytest

import webdriver.bidi.error as error
from tests.bidi import get_invalid_cases

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", get_invalid_cases("string"))
async def test_params_path_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.remove_temporary_directory(path=value)


@pytest.mark.parametrize(
    "unknown_path",
    [
        "",
        "/tmp/not-a-registered-bidi-temp-dir",
    ],
)
async def test_params_path_no_such_temporary_directory(
    bidi_session, unknown_path
):
    with pytest.raises(error.NoSuchTemporaryDirectoryException):
        await bidi_session.browser.remove_temporary_directory(path=unknown_path)
