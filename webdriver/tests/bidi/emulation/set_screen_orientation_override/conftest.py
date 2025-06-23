import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget
from ... import remote_mapping_to_dict


@pytest_asyncio.fixture
async def get_screen_orientation(bidi_session):
    async def get_screen_orientation(context):
        # Activation is required, as orientation is only available on an active
        # context.
        await bidi_session.browsing_context.activate(context=context["context"])

        result = await bidi_session.script.evaluate(
            expression="""({
                    angle: screen.orientation.angle,
                    type: screen.orientation.type
                })
            """,
            target=ContextTarget(context["context"]),
            await_promise=True,
        )

        return remote_mapping_to_dict(result["value"])

    return get_screen_orientation
