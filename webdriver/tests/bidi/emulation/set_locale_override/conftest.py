import pytest
import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget

LOCALES = ["de-DE", "es-ES", "fr-FR", "it-IT"]


@pytest_asyncio.fixture
async def get_current_locale(bidi_session):
    async def get_current_locale(context, sandbox=None):
        result = await bidi_session.script.evaluate(
            expression="new Intl.DateTimeFormat().resolvedOptions().locale",
            target=ContextTarget(context["context"], sandbox=sandbox),
            await_promise=False,
        )

        return result["value"]

    return get_current_locale


@pytest_asyncio.fixture
async def default_locale(get_current_locale, top_context):
    """
    Returns default locale.
    """
    return await get_current_locale(top_context)


@pytest.fixture
def some_locale(default_locale):
    """
    Returns some locale which is not equal to `default_locale`.
    """
    for locale in LOCALES:
        if locale != default_locale:
            return locale

    raise Exception(
        f"Unexpectedly could not find locale different from the default {default_locale}"
    )


@pytest.fixture
def another_locale(default_locale, some_locale):
    """
    Returns some another locale which is not equal to `default_locale` nor to
    `some_locale`.
    """
    for locale in LOCALES:
        if locale != default_locale and locale != some_locale:
            return locale

    raise Exception(
        f"Unexpectedly could not find locale different from the default {default_locale} and {some_locale}"
    )


@pytest_asyncio.fixture
async def get_current_navigator_language(bidi_session):
    async def get_current_navigator_language(context, sandbox=None):
        result = await bidi_session.script.evaluate(
            expression="navigator.language",
            target=ContextTarget(context["context"], sandbox=sandbox),
            await_promise=False,
        )

        return result["value"]

    return get_navigator_language


@pytest_asyncio.fixture
async def get_current_navigator_languages(bidi_session):
    async def get_navigator_languages(context, sandbox=None):
        result = await bidi_session.script.evaluate(
            expression="navigator.languages",
            target=ContextTarget(context["context"], sandbox=sandbox),
            await_promise=False,
        )

        arr = []
        if result["type"] == "array":
            for item in result["value"]:
                arr.append(item["value"])

        return arr

    return get_navigator_languages


@pytest_asyncio.fixture
async def default_navigator_language(get_current_navigator_language, top_context):
    """
    Returns default navigator.language value.
    """
    return await get_current_navigator_language(top_context)


@pytest_asyncio.fixture
async def default_navigator_languages(get_current_navigator_languages, top_context):
    """
    Returns default navigator.languages value.
    """
    return await get_current_navigator_languages(top_context)


@pytest_asyncio.fixture
async def assert_locale_against_default(
    top_context,
    get_current_locale,
    get_current_navigator_language,
    get_current_navigator_languages,
    default_locale,
    default_navigator_language,
    default_navigator_languages,
):
    """
    Assert JS locale and navigator.language/s against default values.

    Note: it's possible to have slightly different values between JS locale and
    navigator.language/s, that's why we have to retrieve the default values
    for each API.
    """

    async def assert_locale_against_default(context=top_context):
        assert await get_current_locale(context) == default_locale
        assert (
            await get_current_navigator_language(context) == default_navigator_language
        )
        assert (
            await get_current_navigator_languages(context)
            == default_navigator_languages
        )

    return assert_locale_against_default


@pytest_asyncio.fixture
async def assert_locale_against_value(
    top_context,
    get_current_locale,
    get_current_navigator_language,
    get_current_navigator_languages,
):
    """
    Assert JS locale and navigator.language/s against provided value
    """

    async def assert_locale_against_value(value, context=top_context):
        assert await get_current_locale(context) == value
        assert await get_current_navigator_language(context) == value
        assert await get_current_navigator_languages(context) == [value]

    return assert_locale_against_value
