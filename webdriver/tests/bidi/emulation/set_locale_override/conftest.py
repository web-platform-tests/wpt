import pytest
import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget


@pytest_asyncio.fixture
async def get_current_locale(bidi_session):
    async def get_current_locale(context):
        result = await bidi_session.script.evaluate(
            expression="new Intl.DateTimeFormat().resolvedOptions().locale",
            target=ContextTarget(context["context"]),
            await_promise=False,
        )

        return result["value"]

    return get_current_locale


@pytest_asyncio.fixture
async def initial_locale(get_current_locale, top_context):
    """
    Returns default locale.
    """
    return await get_current_locale(top_context)


@pytest.fixture
def some_locale(initial_locale):
    """
    Returns some locale which is not equal to `initial_locale` nor to
    `another_locale`.
    """
    return "es-ES" if initial_locale != "es-ES" else "it-IT"


@pytest.fixture
def another_locale(initial_locale):
    """
    Returns some locale which is not equal to `initial_locale` nor to
    `some_locale`.
    """
    return "de-DE" if initial_locale != "de-DE" else "fr-FR"
