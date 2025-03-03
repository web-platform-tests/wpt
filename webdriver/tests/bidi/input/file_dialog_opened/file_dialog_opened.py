import pytest
from tests.support.sync import AsyncPoll

from webdriver.bidi.modules.script import ContextTarget

from webdriver.error import TimeoutException

pytestmark = pytest.mark.asyncio

FILE_DIALOG_OPENED_EVENT = "input.fileDialogOpened"


async def test_unsubscribe(bidi_session, inline, top_context, wait_for_event,
        wait_for_future_safe):
    await bidi_session.session.subscribe(events=[FILE_DIALOG_OPENED_EVENT])
    await bidi_session.session.unsubscribe(events=[FILE_DIALOG_OPENED_EVENT])

    # Track all received browsingContext.navigationStarted events in the events array
    events = []

    async def on_event(method, data):
        events.append(data)

    remove_listener = bidi_session.add_event_listener(FILE_DIALOG_OPENED_EVENT,
                                                      on_event)

    url = inline("<input id=input type=file />")
    await bidi_session.browsing_context.navigate(context=top_context["context"],
                                                 url=url, wait="complete")

    await bidi_session.script.evaluate(
        expression="input.click()",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
        user_activation=True
    )

    wait = AsyncPoll(bidi_session, timeout=0.5)
    with pytest.raises(TimeoutException):
        await wait.until(lambda _: len(events) > 0)

    remove_listener()


async def test_subscribe(bidi_session, inline, top_context, wait_for_event,
        wait_for_future_safe):
    await bidi_session.session.subscribe(events=[FILE_DIALOG_OPENED_EVENT])

    on_entry = wait_for_event(FILE_DIALOG_OPENED_EVENT)
    url = inline("<input id=input type=file />")

    await bidi_session.browsing_context.navigate(context=top_context["context"],
                                                 url=url, wait="complete")

    node = await bidi_session.script.evaluate(
        expression="input.click(); input",
        target=ContextTarget(top_context["context"]),
        await_promise=False,
        user_activation=True
    )
    shared_id = node["sharedId"]

    event = await wait_for_future_safe(on_entry)
    assert event == {
        'context': top_context["context"],
        'element': {
            'sharedId': shared_id,
        },
        'multiple': False,
    }
