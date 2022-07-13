import pytest

from webdriver.bidi.modules.script import ContextTarget


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "argument",
    [
        {"type": "undefined"},
        {"type": "null"},
        {"type": "string", "value": "foobar"},
        {"type": "string", "value": "2"},
        {"type": "number", "value": "NaN"},
        {"type": "number", "value": "-0"},
        {"type": "number", "value": "Infinity"},
        {"type": "number", "value": "-Infinity"},
        {"type": "number", "value": 3},
        {"type": "number", "value": 1.4},
        {"type": "boolean", "value": True},
        {"type": "boolean", "value": False},
        {"type": "bigint", "value": "42"},
        {"type": "regexp", "value": {"pattern": "foo", "flags": "g"}},
        {"type": "date", "value": "2022-05-31T13:47:29.000Z"},
    ],
)
async def test_primitive_values(bidi_session, top_context, argument):
    result = await bidi_session.script.call_function(
        function_declaration=f"(arg) => arg",
        arguments=[argument],
        await_promise=False,
        target=ContextTarget(top_context["context"]),
    )

    assert result == argument


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "argument, expected_result",
    [
        ({
             "type": "array",
             "value": [
                 {"type": "string", "value": "foobar"},
                 {
                     "type": "object",
                     "value": [
                         ["foobar", {"type": "string", "value": "foobar"}],
                     ],
                 },
             ],
         },
         {
             "type": "array",
             "value": [
                 {"type": "string", "value": "foobar"},
                 {"type": "object"},
             ],
         }),
        ({
             "type": "object",
             "value": [
                 ["foobar", {"type": "string", "value": "foobar"}],
                 ["object", {
                     "type": "object",
                     "value": [
                         ["foobar", {"type": "string", "value": "foobar"}],
                     ],
                 }],
             ],
         }, {
             "type": "object",
             "value": [
                 ["foobar", {"type": "string", "value": "foobar"}],
                 ["object", {"type": "object", }],
             ],
         },),
        ({
             "type": "map",
             "value": [
                 ["foobar", {"type": "string", "value": "foobar"}],
                 ["object", {
                     "type": "object",
                     "value": [
                         ["foobar", {"type": "string", "value": "foobar"}],
                     ],
                 }],
             ],
         }, {
             "type": "map",
             "value": [
                 ["foobar", {"type": "string", "value": "foobar"}],
                 ["object", {"type": "object", }],
             ],
         },),
        ({
             "type": "set",
             "value": [
                 {"type": "string", "value": "foobar"},
                 {
                     "type": "object",
                     "value": [
                         ["foobar", {"type": "string", "value": "foobar"}],
                     ],
                 },
             ],
         }, {
             "type": "set",
             "value": [
                 {"type": "string", "value": "foobar"},
                 {"type": "object"},
             ],
         },),
    ],
)
async def test_local_values(bidi_session, top_context, argument, expected_result):
    result = await bidi_session.script.call_function(
        function_declaration=f"(arg) => arg",
        arguments=[argument],
        await_promise=False,
        target=ContextTarget(top_context["context"]),
    )

    assert result == expected_result
