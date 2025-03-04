# META: timeout=long
import pytest
import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget
from . import assert_file_dialog_opened_event

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"
SCRIPT_MESSAGE_EVENT = "script.message"


@pytest_asyncio.fixture
async def assert_file_dialog_canceled(bidi_session, subscribe_events, inline,
        top_context,
        wait_for_event, wait_for_future_safe):
    async def assert_file_dialog_canceled():
        await subscribe_events(
            events=[FILE_DIALOG_OPENED_EVENT, SCRIPT_MESSAGE_EVENT])

        on_file_opened_future = wait_for_event(FILE_DIALOG_OPENED_EVENT)
        on_script_message_future = wait_for_event(SCRIPT_MESSAGE_EVENT)

        url = inline("<input id=input type=file />")
        await bidi_session.browsing_context.navigate(
            context=top_context["context"],
            url=url, wait="complete")

        await bidi_session.script.call_function(
            function_declaration="""function(channel) {
                const input = document.getElementById('input');
                input.addEventListener('cancel', (event) => {
                    channel(JSON.stringify({
                        name: 'cancel',
                        event
                    }));
                });
                input.click();
            }""",
            target=ContextTarget(top_context["context"]),
            arguments=[
                {"type": "channel", "value": {"channel": "channel_name"}}],
            await_promise=False,
            user_activation=True
        )

        file_opened_event = await wait_for_future_safe(on_file_opened_future)
        assert_file_dialog_opened_event(file_opened_event,
                                        top_context["context"])

        script_message_event = await wait_for_future_safe(
            on_script_message_future)
        assert script_message_event['channel'] == 'channel_name'
        assert script_message_event['data'][
                   'value'] == '{"name":"cancel","event":{"isTrusted":true}}'

    yield assert_file_dialog_canceled


@pytest.mark.capabilities({"unhandledPromptBehavior": 'dismiss'})
async def test_string_dismiss(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()


@pytest.mark.capabilities({"unhandledPromptBehavior": 'dismiss and notify'})
async def test_string_dismiss_and_notify(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()


@pytest.mark.capabilities({"unhandledPromptBehavior": {'default': 'dismiss'}})
async def test_default_dismiss(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()


@pytest.mark.capabilities(
    {"unhandledPromptBehavior": {'file': 'dismiss', 'default': 'ignore'}})
async def test_file_dismiss(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()


@pytest.mark.capabilities({"unhandledPromptBehavior": 'accept'})
async def test_string_accept(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()


@pytest.mark.capabilities({"unhandledPromptBehavior": 'accept and notify'})
async def test_string_accept_and_notify(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()


@pytest.mark.capabilities({"unhandledPromptBehavior": {'default': 'accept'}})
async def test_default_accept(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()


@pytest.mark.capabilities(
    {"unhandledPromptBehavior": {'file': 'accept', 'default': 'ignore'}})
async def test_file_accept(assert_file_dialog_canceled):
    await assert_file_dialog_canceled()

# TODO: test 'file: ignore'.
