import tempfile

import pytest

from webdriver.bidi.modules.script import ContextTarget

DOWNLOAD_END = "browsingContext.downloadEnd"


@pytest.fixture
def temp_dir():
    return tempfile.mkdtemp()

@pytest.fixture
def trigger_download(bidi_session, subscribe_events, wait_for_event,
        wait_for_future_safe, inline):
    async def trigger_download(context):
        page_with_download_link = inline(
            f"""<a id="download_link" href="{inline("")}" download="some_file.txt">download</a>""")
        await bidi_session.browsing_context.navigate(context=context,
                                                     url=page_with_download_link,
                                                     wait="complete")

        await subscribe_events(events=[DOWNLOAD_END])

        on_download_will_begin = wait_for_event(DOWNLOAD_END)
        # Trigger download by clicking the link.
        await bidi_session.script.evaluate(
            expression="download_link.click()",
            target=ContextTarget(context),
            await_promise=True,
            user_activation=True,
        )

        return await wait_for_future_safe(on_download_will_begin)

    return trigger_download


@pytest.fixture
def is_download_allowed(trigger_download):
    async def is_download_allowed(context):
        event = await trigger_download(context)
        return event["status"] == "complete"

    return is_download_allowed


@pytest.fixture
def default_is_download_allowed(is_download_allowed, new_tab):
    return is_download_allowed(new_tab["context"])
