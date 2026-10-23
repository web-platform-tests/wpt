import pytest
from webdriver.bidi.modules.script import ContextTarget, ScriptEvaluateResultException

from ... import recursive_compare, any_string

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize(
    "return_structure, result_type",
    [
        ("[data, data]", "array"),
        ("new Map([['foo', data],['bar', data]])", "map"),
        ("({ 'foo': data, 'bar': data })", "object"),
    ],
)
@pytest.mark.parametrize(
    "expression, type",
    [
        ("[1]", "array"),
        ("new Map([[true, false]])", "map"),
        ("new Set(['baz'])", "set"),
        ("{ baz: 'qux' }", "object"),
    ],
)
async def test_remote_values_with_internal_id(
    evaluate, return_structure, result_type, expression, type
):
    result = await evaluate(f"{{const data = {expression}; {return_structure}}}")
    result_value = result["value"]

    assert len(result_value) == 2

    if result_type == "array":
        value = [
            {"type": type, "internalId": any_string},
            {"type": type, "internalId": any_string},
        ]
        internalId1 = result_value[0]["internalId"]
        internalId2 = result_value[1]["internalId"]
    else:
        value = [
            ["foo", {"type": type, "internalId": any_string}],
            ["bar", {"type": type, "internalId": any_string}],
        ]
        internalId1 = result_value[0][1]["internalId"]
        internalId2 = result_value[1][1]["internalId"]

    # Make sure that the same duplicated objects have the same internal ids
    assert internalId1 == internalId2

    recursive_compare(value, result_value)


@pytest.mark.parametrize(
    "result_expression, await_promise",
    [
        ("throw [data, data]", False),
        ("Promise.reject([data, data])", True),
    ],
    ids=["throw", "promise-rejection"],
)
@pytest.mark.parametrize(
    "expression, remote_type",
    [
        ("[1]", "array"),
        ("new Map([[true, false]])", "map"),
        ("new Set(['baz'])", "set"),
        ("{ baz: 'qux' }", "object"),
    ],
)
async def test_exception_remote_values_with_internal_id(
    bidi_session,
    top_context,
    result_expression,
    await_promise,
    expression,
    remote_type,
):
    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.evaluate(
            expression=f"{{const data = {expression}; {result_expression}}}",
            target=ContextTarget(top_context["context"]),
            await_promise=await_promise,
        )

    result_value = exception.value.result["exceptionDetails"]["exception"]

    assert len(result_value["value"]) == 2
    assert result_value["value"][0]["internalId"] == result_value["value"][1]["internalId"]

    recursive_compare(
        {
            "type": "array",
            "value": [
                {"type": remote_type, "internalId": any_string},
                {"type": remote_type, "internalId": any_string},
            ],
        },
        result_value,
    )


async def test_different_remote_values_have_unique_internal_ids(evaluate):
    result = await evaluate(
        "{const obj1 = [1]; const obj2 = {'foo': 'bar'}; [obj1, obj2, obj1, obj2]}"
    )

    assert len(result["value"]) == 4

    internalId1 = result["value"][0]["internalId"]
    internalId2 = result["value"][1]["internalId"]

    # Make sure that different duplicated objects have different internal ids
    assert internalId1 != internalId2


async def test_nested_remote_values_have_same_internal_ids(evaluate):
    result = await evaluate(
        "{const obj1 = document; const obj2 = {}; ({key1:obj1, key2:obj2, nested:{key3:obj1, key4:obj2}}) }"
    )

    assert len(result["value"]) == 3

    internalIdKey1 = result["value"][0][1]["internalId"]
    internalIdKey2 = result["value"][1][1]["internalId"]
    internalIdKey3 = result["value"][2][1]["value"][0][1]["internalId"]
    internalIdKey4 = result["value"][2][1]["value"][1][1]["internalId"]

    assert internalIdKey1 != internalIdKey2
    assert internalIdKey1 == internalIdKey3
    assert internalIdKey2 == internalIdKey4
