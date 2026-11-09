import pytest

import webdriver.bidi.error as error
from tests.bidi import get_invalid_cases

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", get_invalid_cases("list"))
async def test_params_entries_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_temporary_directory(entries=value)


@pytest.mark.parametrize("value", get_invalid_cases("dict"))
async def test_params_entry_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_temporary_directory(entries=[value])


@pytest.mark.parametrize(
    "invalid_path",
    [
        "",
        "/absolute/path.txt",
        "trailing/",
        "double//slash.txt",
        ".",
        "..",
        "./file.txt",
        "a/./file.txt",
        "../escape.txt",
        "a/../../escape.txt",
        "backslash\\path.txt",
        "C:drive.txt",
        "null\x00byte.txt",
    ],
)
async def test_params_entry_invalid_path(bidi_session, invalid_path):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_temporary_directory(
            entries=[{"type": "file", "path": invalid_path}]
        )


@pytest.mark.parametrize(
    "conflicting_entries",
    [
        [
            {"type": "file", "path": "dup.txt"},
            {"type": "file", "path": "dup.txt"},
        ],
        [
            {"type": "directory", "path": "dup_dir"},
            {"type": "directory", "path": "dup_dir"},
        ],
        [
            {"type": "file", "path": "node"},
            {"type": "directory", "path": "node"},
        ],
        [
            {"type": "directory", "path": "node"},
            {"type": "file", "path": "node"},
        ],
        [
            {"type": "file", "path": "parent"},
            {"type": "file", "path": "parent/child.txt"},
        ],
        [
            {"type": "symlink", "path": "link_dir", "target": "real_dir"},
            {"type": "file", "path": "link_dir/child.txt"},
        ],
    ],
)
async def test_params_duplicate_or_conflicting_paths(
    bidi_session, conflicting_entries
):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_temporary_directory(
            entries=conflicting_entries
        )


async def test_params_file_both_data_and_size(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_temporary_directory(
            entries=[
                {
                    "type": "file",
                    "path": "both.txt",
                    "data": {"type": "string", "value": "abc"},
                    "size": 3,
                }
            ]
        )


async def test_params_file_invalid_base64(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_temporary_directory(
            entries=[
                {
                    "type": "file",
                    "path": "bad.txt",
                    "data": {
                        "type": "base64",
                        "value": "!!!not_valid_base64!!!",
                    },
                }
            ]
        )


@pytest.mark.parametrize(
    "invalid_target",
    [
        "",
        "/absolute/target",
        "../outside",
        "a/../../outside",
        "./target",
        "backslash\\target",
        "C:target",
    ],
)
async def test_params_symlink_invalid_target(bidi_session, invalid_target):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.browser.create_temporary_directory(
            entries=[
                {
                    "type": "symlink",
                    "path": "sub/link",
                    "target": invalid_target,
                }
            ]
        )
