import json

import pytest_asyncio

from webdriver.bidi.modules.script import ContextTarget


@pytest_asyncio.fixture
async def get_navigation_headers(bidi_session, url):
    async def get_navigation_headers(context):
        echo_link = url("webdriver/tests/support/http_handlers/headers_echo.py")
        await bidi_session.browsing_context.navigate(context=context["context"],
                                                     url=echo_link,
                                                     wait="complete")

        result = await bidi_session.script.evaluate(
            expression="window.document.body.textContent",
            target=ContextTarget(context["context"]),
            await_promise=False,
        )

        return (json.JSONDecoder().decode(result["value"]))["headers"]

    return get_navigation_headers


@pytest_asyncio.fixture
async def get_fetch_headers(bidi_session, url):
    async def get_fetch_headers(context):
        echo_link = url("webdriver/tests/support/http_handlers/headers_echo.py")
        result = await bidi_session.script.evaluate(
            expression=f"fetch('{echo_link}').then(r => r.text())",
            target=ContextTarget(context["context"]),
            await_promise=True,
        )

        return (json.JSONDecoder().decode(result["value"]))["headers"]

    return get_fetch_headers


@pytest_asyncio.fixture(params=["fetch", "navigation"])
def get_headers_methods_invariant(request, get_fetch_headers,
        get_navigation_headers):
    if request.param == "fetch":
        return get_fetch_headers
    if request.param == "navigation":
        return get_navigation_headers
    raise Exception(f"Unsupported getter {request.param}")
