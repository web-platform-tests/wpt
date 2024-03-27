// META: title=validation tests for WebNN API constant interface
// META: global=window,dedicatedworker
// META: script=../resources/utils_validation.js

'use strict';

const tests = [
  // Tests for constant(descriptor, bufferView)
  {
    name:
      '[constant] Test building a 0-D scalar constant without presenting dimensions',
    descriptor: { dataType: 'float32' },
    bufferView: { type: Float32Array, byteLength: 1 * 4 },
    output: { dataType: 'float32', dimensions: [] }
  },
  {
    name:
      '[constant] Test building a 0-D scalar constant with empty dimensions',
    descriptor: { dataType: 'float32', dimensions: [] },
    bufferView: { type: Float32Array, byteLength: 1 * 4 },
    output: { dataType: 'float32', dimensions: [] }
  },
  {
    name: '[constant] Test building a constant with float32 data type',
    descriptor: { dataType: 'float32', dimensions: [2, 3] },
    bufferView: { type: Float32Array, byteLength: 6 * 4 },
    output: { dataType: 'float32', dimensions: [2, 3] }
  },
  {
    name:
      '[constant] Throw if byte length of bufferView for float32 doesn\'t match the given dimensions',
    descriptor: { dataType: 'float32', dimensions: [2, 3] },
    bufferView: {
      type: Float32Array,
      byteLength: 6 * 4 - 4  // The bufferView's byte length is less than the
      // one by given dimensions
    }
  },
  // TODO (crbug.com/329702838): Test building a constant with float16 data type
  {
    name: '[constant] Test building a constant with int32 data type',
    descriptor: { dataType: 'int32', dimensions: [2, 3] },
    bufferView: { type: Int32Array, byteLength: 6 * 4 },
    output: { dataType: 'int32', dimensions: [2, 3] }
  },
  {
    name:
      '[constant] Throw if byte length of bufferView for int32 doesn\'t match the given dimensions',
    descriptor: { dataType: 'int32', dimensions: [2, 3] },
    bufferView: {
      type: Int32Array,
      byteLength: 6 * 4 + 4  // The bufferView's byte length is greater than the
      // one by given dimensions
    }
  },
  {
    name: '[constant] Test building a constant with uint32 data type',
    descriptor: { dataType: 'uint32', dimensions: [2, 3] },
    bufferView: { type: Uint32Array, byteLength: 6 * 4 },
    output: { dataType: 'uint32', dimensions: [2, 3] }
  },
  {
    name:
      '[constant] Throw if byte length of bufferView for uint32 doesn\'t match the given dimensions',
    descriptor: { dataType: 'uint32', dimensions: [2, 3] },
    bufferView: { type: Uint32Array, byteLength: 6 * 4 + 4 }
  },
  {
    name: '[constant] Test building a constant with int64 data type',
    descriptor: { dataType: 'int64', dimensions: [2, 3] },
    bufferView: { type: BigInt64Array, byteLength: 6 * 8 },
    output: { dataType: 'int64', dimensions: [2, 3] }
  },
  {
    name:
      '[constant] Throw if byte length of bufferView for int64 doesn\'t match the given dimensions',
    descriptor: { dataType: 'int64', dimensions: [2, 3] },
    bufferView: { type: BigInt64Array, byteLength: 6 * 8 + 8 }
  },
  {
    name: '[constant] Test building a constant with uint64 data type',
    descriptor: { dataType: 'uint64', dimensions: [2, 3] },
    bufferView: { type: BigUint64Array, byteLength: 6 * 8 },
    output: { dataType: 'uint64', dimensions: [2, 3] }
  },
  {
    name:
      '[constant] Throw if byte length of bufferView for uint64 doesn\'t match the given dimensions',
    descriptor: { dataType: 'uint64', dimensions: [2, 3] },
    bufferView: { type: BigUint64Array, byteLength: 6 * 8 + 8 }
  },
  {
    name: '[constant] Test building a constant with int8 data type',
    descriptor: { dataType: 'int8', dimensions: [2, 3] },
    bufferView: { type: Int8Array, byteLength: 6 * 1 },
    output: { dataType: 'int8', dimensions: [2, 3] }
  },
  {
    name:
      '[constant] Throw if byte length of bufferView for int8 doesn\'t match the given dimensions',
    descriptor: { dataType: 'int8', dimensions: [2, 3] },
    bufferView: { type: Int8Array, byteLength: 6 * 4 - 4 }
  },
  {
    name: '[constant] Test building a constant with uint8 data type',
    descriptor: { dataType: 'uint8', dimensions: [2, 3] },
    bufferView: { type: Uint8Array, byteLength: 6 * 1 },
    output: { dataType: 'uint8', dimensions: [2, 3] }
  },
  {
    name:
      '[constant] Throw if byte length of bufferView for uint8 doesn\'t match the given dimensions',
    descriptor: { dataType: 'uint8', dimensions: [2, 3] },
    bufferView: { type: Uint8Array, byteLength: 6 * 4 - 4 }
  },
  {
    name: '[constant] Throw if a dimension is 0',
    descriptor: { dataType: 'float32', dimensions: [2, 0] },
    bufferView: { type: Float32Array, byteLength: 2 * 4 }
  },
  {
    name:
      '[constant] Throw if bufferView type doesn\'t match the operand data type',
    descriptor: { dataType: 'float32', dimensions: [2, 3] },
    bufferView: { type: Int32Array, byteLength: 6 * 4 }
  }
];

const testsFillSequence = [
  // Tests for constant(descriptor, start, step)
  {
    name: '[constant] Test building sequence with float32 data type',
    desc: { dataType: 'float32', dimensions: [3] },
    start: 0.1,
    step: 0.1,
    output: { dataType: 'float32', dimensions: [3] }
  },
  {
    name: '[constant] Test building sequence with float16 data type',
    desc: { dataType: 'float16', dimensions: [3] },
    start: 0.1,
    step: -0.2,
    output: { dataType: 'float16', dimensions: [3] }
  },
  {
    name: '[constant] Test building sequence with int8 data type',
    desc: { dataType: 'int8', dimensions: [3] },
    start: 3,
    step: -2,
    output: { dataType: 'int8', dimensions: [3] }
  },
  {
    name: '[constant] Test building sequence with output_shape = {}',
    desc: { dataType: 'float32', dimensions: [] },
    start: 0.1,
    step: 0.2,
    output: { dataType: 'float32', dimensions: [] }
  },
  {
    name: '[constant] Test building sequence with step = 0}',
    desc: { dataType: 'float32', dimensions: [5] },
    start: 0.1,
    step: 0,
    output: { dataType: 'float32', dimensions: [5] }
  },
  {
    name: '[constant] Test building sequence with start = infinity, step = -infinity}',
    desc: { dataType: 'float16', dimensions: [5] },
    start: Infinity,
    step: -Infinity,
    output: { dataType: 'float16', dimensions: [5] }
  },
  {
    name: '[constant] Throw if the values of start or step are not within the range of int8',
    desc: { dataType: 'int8', dimensions: [5] },
    start: 200,
    step: 2
  },
  {
    name: '[constant] Throw if the values of start or step are not within the range of float16',
    desc: { dataType: 'float16', dimensions: [5] },
    start: 65535,
    step: 2.2
  },
  {
    name: '[constant] Throw if the endpoint value is not within the range of int8',
    desc: { dataType: 'int8', dimensions: [5] },
    start: 126,
    step: 2
  },
  {
    name: '[constant] Throw if the endpoint value is not within the range of float16',
    desc: { dataType: 'float16', dimensions: [5] },
    start: 65533,
    step: 2.8
  }
]

tests.forEach(
  test => promise_test(async t => {
    const buffer = new ArrayBuffer(test.bufferView.byteLength);
    const bufferView = new test.bufferView.type(buffer);
    if (test.output) {
      const constantOperand = builder.constant(test.descriptor, bufferView);
      assert_equals(constantOperand.dataType(), test.output.dataType);
      assert_array_equals(constantOperand.shape(), test.output.dimensions);
    } else {
      assert_throws_js(
        TypeError, () => builder.constant(test.descriptor, bufferView));
    }
  }, test.name));

testsFillSequence.forEach(
  test => promise_test(async t => {
    if (test.output) {
      const output = builder.constant(
        test.desc, test.start, test.step);
      assert_equals(output.dataType(), test.output.dataType);
      assert_array_equals(output.shape(), test.output.dimensions);
    } else {
      assert_throws_js(
        TypeError, () => builder.constant(
          test.desc, test.start, test.step));
    }
  }, test.name));