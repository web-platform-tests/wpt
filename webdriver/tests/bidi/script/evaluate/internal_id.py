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
    "exception_expression, await_promise",
    [
        ("throw {}", False),
        ("Promise.reject({})", True),
    ],
    ids=["throw", "promise-rejection"],
)
@pytest.mark.parametrize(
    "exception_structure, result_type",
    [
        ("[data, data]", "array"),
        ("new Map([['foo', data],['bar', data]])", "map"),
        ("({ 'foo': data, 'bar': data })", "object"),
    ],
)
@pytest.mark.parametrize(
    "expression",
    [
        "[1]",
        "new Map([[true, false]])",
        "new Set(['baz'])",
        "{ baz: 'qux' }",
    ],
)
async def test_exception_remote_values_with_internal_id(
    bidi_session,
    top_context,
    exception_expression,
    await_promise,
    exception_structure,
    result_type,
    expression,
):
    formatted_exception_expression = exception_expression.format(exception_structure)

    with pytest.raises(ScriptEvaluateResultException) as exception:
        await bidi_session.script.evaluate(
            expression=f"{{const data = {expression}; {formatted_exception_expression}}}",
            target=ContextTarget(top_context["context"]),
            await_promise=await_promise,
        )

    exception_value = exception.value.result["exceptionDetails"]["exception"]["value"]

    assert len(exception_value) == 2

    if result_type == "array":
        internalId1 = exception_value[0]["internalId"]
        internalId2 = exception_value[1]["internalId"]
    else:
        internalId1 = exception_value[0][1]["internalId"]
        internalId2 = exception_value[1][1]["internalId"]

    assert internalId1 == internalId2


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
