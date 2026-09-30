// META: title=WebNN float16 subnormal value transport
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// Every value is exactly represented by float16. Value movement must not
// flush its subnormals, including at the normal/subnormal boundary.
const transportValues = [
  2 ** -24, 3 * 2 ** -24, 1023 * 2 ** -24,
  -(2 ** -24), -3 * 2 ** -24, -1023 * 2 ** -24,
  2 ** -14, -(2 ** -14)
];
const transportTensor = (data, shape, dataType = 'float16') =>
    ({data, descriptor: {shape, dataType}});
const transportTest = (name, inputs, operator, data, shape) => ({
  name: `${name} preserves float16 subnormal values`,
  graph: {
    inputs,
    operators: [operator],
    expectedOutputs: {result: transportTensor(data, shape)}
  }
});
const transportOp = (name, arguments_) =>
    ({name, arguments: arguments_, outputs: 'result'});
const transportInput = {input: transportTensor(transportValues, [8])};
const transportReversed = transportValues.toReversed();
const transportTests = [
  transportTest('same-type cast', transportInput,
      transportOp('cast', [{input: 'input'}, {type: 'float16'}]),
      transportValues, [8]),
  transportTest('same-type cast constant', {
    input: {...transportInput.input, constant: true}
  }, transportOp('cast', [{input: 'input'}, {type: 'float16'}]),
      transportValues, [8]),
  transportTest('same-type cast scalar', {
    input: transportTensor([2 ** -24], [])
  }, transportOp('cast', [{input: 'input'}, {type: 'float16'}]),
      [2 ** -24], []),
  transportTest('identity', transportInput,
      transportOp('identity', [{input: 'input'}]), transportValues, [8]),
  transportTest('identity constant', {
    input: {...transportInput.input, constant: true}
  }, transportOp('identity', [{input: 'input'}]), transportValues, [8]),
  transportTest('identity scalar', {
    input: transportTensor([2 ** -24], [])
  }, transportOp('identity', [{input: 'input'}]), [2 ** -24], []),
  transportTest('reshape', transportInput,
      transportOp('reshape', [{input: 'input'}, {newShape: [2, 4]}]),
      transportValues, [2, 4]),
  transportTest('transpose', {
    input: transportTensor(transportValues, [2, 4])
  }, transportOp('transpose', [
    {input: 'input'}, {options: {permutation: [1, 0]}}
  ]), [0, 4, 1, 5, 2, 6, 3, 7].map(i => transportValues[i]), [4, 2]),
  transportTest('reverse', transportInput,
      transportOp('reverse', [{input: 'input'}, {options: {axes: [0]}}]),
      transportReversed, [8]),
  transportTest('slice', transportInput,
      transportOp('slice', [{input: 'input'}, {starts: [1]}, {sizes: [7]}]),
      transportValues.slice(1), [7]),
  transportTest('positive-strided slice', {
    input: transportTensor(transportValues.flatMap(value => [value, value]), [16])
  }, transportOp('slice', [
    {input: 'input'}, {starts: [1]}, {sizes: [15]}, {options: {strides: [2]}}
  ]), transportValues, [8]),
  transportTest('concat', {
    left: transportTensor(transportValues.slice(0, 4), [4]),
    right: transportTensor(transportValues.slice(4), [4])
  }, transportOp('concat', [{inputs: ['left', 'right']}, {axis: 0}]),
      transportValues, [8]),
  {
    name: 'split preserves float16 subnormal values in both outputs',
    graph: {
      inputs: transportInput,
      operators: [{
        name: 'split', arguments: [{input: 'input'}, {splits: [4, 4]}],
        outputs: ['first', 'second']
      }],
      expectedOutputs: {
        first: transportTensor(transportValues.slice(0, 4), [4]),
        second: transportTensor(transportValues.slice(4), [4])
      }
    }
  },
  transportTest('gather', {
    ...transportInput,
    indices: transportTensor([7, 6, 5, 4, 3, 2, 1, 0], [8], 'int32')
  }, transportOp('gather', [{input: 'input'}, {indices: 'indices'}]),
      transportReversed, [8]),
  transportTest('gatherElements', {
    input: transportTensor(transportValues, [2, 4]),
    indices: {...transportTensor([3, 2, 1, 0, 3, 2, 1, 0], [2, 4], 'int32'),
      constant: true}
  }, transportOp('gatherElements', [
    {input: 'input'}, {indices: 'indices'}, {options: {axis: 1}}
  ]), [3, 2, 1, 0, 7, 6, 5, 4].map(i => transportValues[i]), [2, 4]),
  transportTest('gatherND', {
    input: transportTensor(transportValues, [2, 4]),
    indices: transportTensor([1, 3, 0, 0, 1, 0, 0, 3], [4, 2], 'int32')
  }, transportOp('gatherND', [{input: 'input'}, {indices: 'indices'}]),
      [7, 0, 4, 3].map(i => transportValues[i]), [4]),
  transportTest('expand', {
    input: transportTensor(transportValues, [1, 8])
  }, transportOp('expand', [{input: 'input'}, {newShape: [2, 8]}]),
      [...transportValues, ...transportValues], [2, 8]),
  transportTest('tile', {
    input: transportTensor(transportValues, [1, 8])
  }, transportOp('tile', [{input: 'input'}, {repetitions: [2, 1]}]),
      [...transportValues, ...transportValues], [2, 8]),
  transportTest('where', {
    condition: transportTensor([0, 1, 0, 1, 0, 1, 0, 1], [8], 'uint8'),
    yes: transportTensor(transportValues, [8]),
    no: transportTensor(transportReversed, [8])
  }, transportOp('where', [
    {condition: 'condition'}, {trueValue: 'yes'}, {falseValue: 'no'}
  ]), transportValues.map((value, i) => i % 2 ? value : transportReversed[i]), [8]),
  transportTest('constant pad', transportInput, transportOp('pad', [
    {input: 'input'}, {beginningPadding: [1]}, {endingPadding: [2]},
    {options: {value: 2 ** -24}}
  ]), [2 ** -24, ...transportValues, 2 ** -24, 2 ** -24], [11]),
  transportTest('edge pad', transportInput, transportOp('pad', [
    {input: 'input'}, {beginningPadding: [1]}, {endingPadding: [1]},
    {options: {mode: 'edge'}}
  ]), [transportValues[0], ...transportValues, transportValues[7]], [10]),
  transportTest('reflection pad', transportInput, transportOp('pad', [
    {input: 'input'}, {beginningPadding: [1]}, {endingPadding: [1]},
    {options: {mode: 'reflection'}}
  ]), [transportValues[1], ...transportValues, transportValues[6]], [10]),
  transportTest('scatterElements', {
    input: transportTensor(Array(8).fill(0), [8]),
    indices: {...transportTensor([7, 6, 5, 4, 3, 2, 1, 0], [8], 'int32'),
      constant: true},
    updates: transportTensor(transportValues, [8])
  }, transportOp('scatterElements', [
    {input: 'input'}, {indices: 'indices'}, {updates: 'updates'}
  ]), transportReversed, [8]),
  transportTest('scatterND', {
    input: transportTensor(Array(8).fill(0), [8]),
    indices: transportTensor([7, 6, 5, 4, 3, 2, 1, 0], [8, 1], 'int32'),
    updates: transportTensor(transportValues, [8])
  }, transportOp('scatterND', [
    {input: 'input'}, {indices: 'indices'}, {updates: 'updates'}
  ]), transportReversed, [8])
];

webnn_conformance_test(transportTests, buildAndExecuteGraph, getZeroULPTolerance);
