import pytest

from ... import recursive_compare, any_string


@pytest.mark.asyncio
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
    call_function, return_structure, result_type, expression, type
):
    result = await call_function(
        f"() => {{ const data = {expression}; return {return_structure}; }}"
    )

    if result_type == "array":
        value = [
            {"type": type, "internalId": any_string},
            {"type": type, "internalId": any_string},
        ]
    else:
        value = [
            ["foo", {"type": type, "internalId": any_string}],
            ["bar", {"type": type, "internalId": any_string}],
        ]

    recursive_compare({"type": result_type, "value": value}, result)
