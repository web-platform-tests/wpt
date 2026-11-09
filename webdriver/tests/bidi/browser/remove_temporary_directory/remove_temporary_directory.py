import pytest
import webdriver.bidi.error as error

pytestmark = pytest.mark.asyncio


async def test_remove_temporary_directory(bidi_session):
    result = await bidi_session.browser.create_temporary_directory(
        entries=[
            {
                "type": "file",
                "path": "hello.txt",
                "data": {"type": "string", "value": "Hello"},
            },
            {
                "type": "symlink",
                "path": "alias.txt",
                "target": "hello.txt",
            },
        ]
    )
    path = result["path"]

    await bidi_session.browser.remove_temporary_directory(path=path)

    # Removing the same temporary directory a second time must fail with
    # `no such temporary directory`.
    with pytest.raises(error.NoSuchTemporaryDirectoryException):
        await bidi_session.browser.remove_temporary_directory(path=path)
