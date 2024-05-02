import pytest

from webdriver import error

from tests.classic.perform_actions.support.refine import get_keys


@pytest.mark.parametrize("value", [
    "\U0001F604",  # "😄" (\ud83d\ude04), a single surrogate codepoint.
    "\U0001F60D",  # "😍" (\ud83d\ude0d), a single surrogate codepoint.
])
def test_codepoint_keys_behave_correctly(session, key_reporter, key_chain, value):
    # Not using key_chain.send_keys() because we always want to treat value as
    # one character here. `len(value)` varies by platform for non-BMP characters,
    # so we don't want to iterate over value.
    key_chain \
        .key_down(value) \
        .key_up(value) \
        .perform()

    # events sent by major browsers are inconsistent so only check key value
    assert get_keys(key_reporter) == value


@pytest.mark.parametrize("value", [
    "fa",  # 2 unicode codepoints.
    "\u0BA8\u0BBF",  # "நிb", 2 unicode codepoints forming a grapheme.
    "\u1100\u1161\u11A8",  # "각", 3 unicode codepoints forming a grapheme.
    "\u2764\ufe0f",  # "❤️",  2 codepoints: a base character and a variation selector.
])
def test_invalid_multiple_codepoint_keys_fail(session, key_reporter, key_chain, value):
    with pytest.raises(error.InvalidArgumentException):
        key_chain \
            .key_down(value) \
            .key_up(value) \
            .perform()
