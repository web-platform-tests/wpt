import base64
import pytest

pytestmark = pytest.mark.asyncio


async def test_create_empty_temporary_directory(bidi_session):
    result = await bidi_session.browser.create_temporary_directory()
    try:
        assert isinstance(result["path"], str)
        assert len(result["path"]) > 0
    finally:
        await bidi_session.browser.remove_temporary_directory(path=result["path"])


async def test_create_temporary_directory_with_entries(bidi_session):
    base64_data = base64.b64encode(b"\x00\x01\x02\xff").decode("ascii")
    result = await bidi_session.browser.create_temporary_directory(
        entries=[
            {
                "type": "directory",
                "path": "nested/dir",
            },
            {
                "type": "file",
                "path": "nested/dir/hello.txt",
                "data": {"type": "string", "value": "Hello BiDi\n"},
            },
            {
                "type": "file",
                "path": "binary.bin",
                "data": {"type": "base64", "value": base64_data},
            },
            {
                "type": "file",
                "path": "zeroes.bin",
                "size": 32,
            },
            {
                "type": "symlink",
                "path": "link_to_hello.txt",
                "target": "nested/dir/hello.txt",
            },
        ]
    )
    try:
        assert isinstance(result["path"], str)
        assert len(result["path"]) > 0
    finally:
        await bidi_session.browser.remove_temporary_directory(path=result["path"])


async def test_create_temporary_directory_permissions_descending_depth(
    bidi_session,
):
    # Setting writable=False on a parent directory before creating a child file
    # inside it must succeed because permissions are applied in descending
    # depth order after all files, directories, and symlinks are created.
    result = await bidi_session.browser.create_temporary_directory(
        entries=[
            {
                "type": "directory",
                "path": "ro_parent",
                "permissions": {
                    "readable": True,
                    "writable": False,
                    "executable": True,
                },
            },
            {
                "type": "file",
                "path": "ro_parent/child.txt",
                "data": {"type": "string", "value": "inside ro_parent"},
            },
        ]
    )
    try:
        assert isinstance(result["path"], str)
    finally:
        await bidi_session.browser.remove_temporary_directory(path=result["path"])
