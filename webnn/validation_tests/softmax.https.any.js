// META: title=validation tests for WebNN API softmax operation
// META: global=window,dedicatedworker
// META: script=../resources/utils_validation.js

'use strict';

validateInputFromAnotherBuilder('softmax');


const tests = [
  {
    name: '[softmax] Test with float32 input.',
    input: {dataType: 'float32', dimensions: [2, 4]},
    axis:0,
    output: {dataType: 'float32', dimensions: [2, 4]}
  },
  {
    name: '[softmax] Throw if building softmax with 4-D input.',
    input: {dataType: 'float32', dimensions: [1, 1, 2, 4]},
    axis:0,
  },
  {
    name: '[softmax] Throw if building softmax with int32 input.',
    input: {dataType: 'int32', dimensions: [3, 4]},
    axis:0,
  },
  {
    name: '[softmax] Throw if axis is greater than or equal to input\'s rank.',
    input: {dataType: 'float32', dimensions: [3, 4]},
    axis: 3,
  },
];

tests.forEach(
    test => promise_test(async t => {
      const input = builder.input(
          'input',
          {dataType: test.input.dataType, dimensions: test.input.dimensions});
      if (test.output) {
        const output = builder.softmax(input, test, axis);
        assert_equals(output.dataType(), test.output.dataType);
        assert_array_equals(output.shape(), test.output.dimensions);
      } else {
        assert_throws_js(TypeError, () => builder.softmax(input, test.axis));
      }
    }, test.name));
