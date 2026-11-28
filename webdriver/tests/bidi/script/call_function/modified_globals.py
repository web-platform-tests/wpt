import pytest

from webdriver.bidi.modules.script import ContextTarget

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "thrown",
    [
        "Symbol('foo')",
        "{ message: Symbol('foo') }",
        "{ message: { toString() { throw new Error('foo'); } } }",
    ],
    ids=["symbol", "symbol message", "throwing message"],
)
@pytest.mark.parametrize("await_promise", [True, False])
async def test_page_replaced_promise_methods(
    bidi_session, inline, top_context, thrown, await_promise
):
    page_url = inline(f"""<script>
        window.marker = 42;
        for (const name of ["all", "race", "reject", "resolve"])
            Promise[name] = () => {{ throw {thrown}; }};
        Promise.prototype.then = () => {{ throw {thrown}; }};
        Promise.prototype.catch = () => {{ throw {thrown}; }};
        Promise.prototype.finally = () => {{ throw {thrown}; }};
    </script>""")
    await bidi_session.browsing_context.navigate(
        context=top_context["context"], url=page_url, wait="complete"
    )

    result = await bidi_session.script.call_function(
        function_declaration="() => window.marker",
        await_promise=await_promise,
        target=ContextTarget(top_context["context"]),
    )

    assert result == {"type": "number", "value": 42}
