import json
import pytest
import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget


@pytest_asyncio.fixture
async def match_media(bidi_session):
    async def match_media(context, query, sandbox=None):
        result = await bidi_session.script.evaluate(
            expression=f"window.matchMedia({json.dumps(query)}).matches",
            target=ContextTarget(context["context"], sandbox=sandbox),
            await_promise=False,
        )
        return result["value"]

    return match_media


@pytest_asyncio.fixture
async def default_prefers_color_scheme(match_media, top_context):
    """Returns the default prefers-color-scheme value."""
    if await match_media(top_context, "(prefers-color-scheme: dark)"):
        return "dark"
    return "light"


@pytest.fixture
def some_prefers_color_scheme(default_prefers_color_scheme):
    """Returns a prefers-color-scheme value different from default."""
    if default_prefers_color_scheme == "dark":
        return "light"
    return "dark"


@pytest_asyncio.fixture(params=['default', 'new'],
                        ids=["Default user context", "Custom user context"])
async def target_user_context(request):
    return request.param


@pytest_asyncio.fixture
async def affected_user_context(target_user_context, create_user_context):
    """Returns either a new or default user context."""
    if target_user_context == 'default':
        return 'default'
    return await create_user_context()


@pytest_asyncio.fixture
async def not_affected_user_context(target_user_context, create_user_context):
    """Returns opposite to affected_user_context user context."""
    if target_user_context == 'new':
        return 'default'
    return await create_user_context()
