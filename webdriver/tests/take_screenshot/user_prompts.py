# META: timeout=long

import pytest

from tests.support.asserts import assert_png, assert_success, assert_error
from tests.support.inline import inline


def take_screenshot(session):
    return session.transport.send(
        "GET", "session/{session_id}/screenshot".format(**vars(session)))


@pytest.fixture
def check_user_prompt_closed_without_exception(session, create_dialog):
    def check_user_prompt_closed_without_exception(dialog_type):
        session.url = inline("<input/>")

        create_dialog(dialog_type, text=dialog_type)

        response = take_screenshot(session)
        value = assert_success(response)

        assert_png(value)

    return check_user_prompt_closed_without_exception


@pytest.fixture
def check_user_prompt_closed_with_exception(session, create_dialog):
    def check_user_prompt_closed_with_exception(dialog_type):
        session.url = inline("<input/>")

        create_dialog(dialog_type, text=dialog_type)

        response = take_screenshot(session)
        assert_error(response, "unexpected alert open")

        # Since dismiss and notify or accept and notify would have dismissed,
        # retrying the screenshot will succeed
        response = take_screenshot(session)
        value = assert_success(response)
        assert_png(value)

    return check_user_prompt_closed_with_exception


@pytest.fixture
def check_user_prompt_not_closed_but_exception(session, create_dialog):
    def check_user_prompt_not_closed_but_exception(dialog_type):
        session.url = inline("<input/>")

        create_dialog(dialog_type, text=dialog_type)

        response = take_screenshot(session)
        assert_error(response, "unexpected alert open")

        session.alert.dismiss()
        response = take_screenshot(session)
        value = assert_success(response)

        assert_png(value)

    return check_user_prompt_not_closed_but_exception


@pytest.mark.capabilities({"unhandledPromptBehavior": "accept"})
@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_accept(check_user_prompt_closed_without_exception, dialog_type):
    check_user_prompt_closed_without_exception(dialog_type)


@pytest.mark.capabilities({"unhandledPromptBehavior": "accept and notify"})
@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_accept_and_notify(check_user_prompt_closed_with_exception, dialog_type):
    check_user_prompt_closed_with_exception(dialog_type)


@pytest.mark.capabilities({"unhandledPromptBehavior": "dismiss"})
@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_dismiss(check_user_prompt_closed_without_exception, dialog_type):
    check_user_prompt_closed_without_exception(dialog_type)


@pytest.mark.capabilities({"unhandledPromptBehavior": "dismiss and notify"})
@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_dismiss_and_notify(check_user_prompt_closed_with_exception, dialog_type):
    check_user_prompt_closed_with_exception(dialog_type)


@pytest.mark.capabilities({"unhandledPromptBehavior": "ignore"})
@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_ignore(check_user_prompt_not_closed_but_exception, dialog_type):
    check_user_prompt_not_closed_but_exception(dialog_type)


@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_default(check_user_prompt_closed_with_exception, dialog_type):
    check_user_prompt_closed_with_exception(dialog_type)
