import pytest


# Testing serialization.
async def assert_serialization(js_str_object, expected_serialized_object,
      send_blocking_command, context_id, recursive_compare):
    result = await send_blocking_command("script.evaluate", {
        "expression": f"({js_str_object})",
        "target": {"context": context_id}})
    # Compare ignoring `objectId`.
    recursive_compare(expected_serialized_object, result, ["objectId"])


@pytest.mark.asyncio
async def test_serialization_undefined(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("undefined", {
        "type": "undefined"}, send_blocking_command, context_id,
                               recursive_compare)


@pytest.mark.asyncio
async def test_serialization_null(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("null", {
        "type": "null"}, send_blocking_command, context_id, recursive_compare)


@pytest.mark.asyncio
async def test_serialization_string(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("'someStr'", {
        "type": "string",
        "value": "someStr"}, send_blocking_command, context_id,
                               recursive_compare)


@pytest.mark.asyncio
async def test_serialization_number(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("123", {
        "type": "number",
        "value": 123}, send_blocking_command, context_id, recursive_compare)
    await assert_serialization("0.56", {
        "type": "number",
        "value": 0.56}, send_blocking_command, context_id, recursive_compare)


@pytest.mark.asyncio
async def test_serialization_specialNumber(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("+Infinity", {
        "type": "number",
        "value": "+Infinity"}, send_blocking_command, context_id,
                               recursive_compare)
    await assert_serialization("-Infinity", {
        "type": "number",
        "value": "-Infinity"}, send_blocking_command, context_id,
                               recursive_compare)
    await assert_serialization("-0", {
        "type": "number",
        "value": "-0"}, send_blocking_command, context_id, recursive_compare)
    await assert_serialization("NaN", {
        "type": "number",
        "value": "NaN"}, send_blocking_command, context_id, recursive_compare)


@pytest.mark.asyncio
async def test_serialization_bool(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("true", {
        "type": "boolean",
        "value": True}, send_blocking_command, context_id, recursive_compare)
    await assert_serialization("false", {
        "type": "boolean",
        "value": False}, send_blocking_command, context_id, recursive_compare)


@pytest.mark.asyncio
async def test_serialization_function(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("function(){}", {
        "type": "function",
        "objectId": "__any_value__"
    }, send_blocking_command, context_id, recursive_compare)


@pytest.mark.asyncio
async def test_serialization_object(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("{'foo': {'bar': 'baz'}, 'qux': 'quux'}", {
        "type": "object",
        "objectId": "__any_value__",
        "value": [[
            "foo", {
                "type": "object",
                "objectId": "__any_value__"}], [
            "qux", {
                "type": "string",
                "value": "quux"}]]}, send_blocking_command, context_id,
                               recursive_compare)


@pytest.mark.asyncio
async def test_serialization_array(send_blocking_command, context_id,
      recursive_compare):
    await assert_serialization("[1, 'a', {foo: 'bar'}, [2,[3,4]]]", {
        "type": "array",
        "objectId": "__any_value__",
        "value": [{
            "type": "number",
            "value": 1
        }, {
            "type": "string",
            "value": "a"
        }, {
            "type": "object",
            "objectId": "__any_value__"
        }, {
            "type": "array",
            "objectId": "__any_value__"}]}, send_blocking_command, context_id,
                               recursive_compare)

# TODO (sadym-chromium): implement remaining tests.

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_bigint(send_blocking_command, context_id, recursive_compare):
#
# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_symbol(send_blocking_command, context_id, recursive_compare):
#
# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_regExp(send_blocking_command, context_id, recursive_compare):
#
# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_date(send_blocking_command, context_id, recursive_compare):
#
# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_windowProxy(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_error(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_node(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_map(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_set(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_weakMap(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_weakSet(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_iterator(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_generator(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_proxy(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_promise(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_typedArray(send_blocking_command, context_id, recursive_compare):

# @pytest.mark.asyncio
# # Not implemented yet.
# async def test_serialization_arrayBuffer(send_blocking_command, context_id, recursive_compare):
