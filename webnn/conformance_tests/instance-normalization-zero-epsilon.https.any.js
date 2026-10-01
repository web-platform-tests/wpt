// META: title=WebNN instance normalization honors zero epsilon
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// Both channels have nonzero spatial variance, even though their inputs are
// float16 subnormals. With epsilon zero, normalization produces exactly +/-1.
// Substituting the default epsilon instead produces values near zero.
const zeroEpsilonTests = [];
const unit = 2 ** -24;
for (const dataType of ['float32', 'float16']) {
  for (const layout of ['nchw', 'nhwc']) {
    const data = layout === 'nchw' ?
        [unit, -unit, unit, -unit, 2 * unit, -2 * unit, 2 * unit, -2 * unit] :
        [unit, 2 * unit, -unit, -2 * unit, unit, 2 * unit, -unit, -2 * unit];
    const normalized = layout === 'nchw' ?
        [1, -1, 1, -1, 1, -1, 1, -1] : [1, 1, -1, -1, 1, 1, -1, -1];
    for (const affine of [false, true]) {
      const inputs = {
        input: {data, descriptor: {shape: [1, 2, 2, 2], dataType}}
      };
      const options = {layout, epsilon: 0};
      if (affine) {
        inputs.scale = {
          data: [0.5, 2], descriptor: {shape: [2], dataType}, constant: true
        };
        inputs.bias = {
          data: [0.25, -0.5], descriptor: {shape: [2], dataType}, constant: true
        };
        options.scale = 'scale';
        options.bias = 'bias';
      }
      const expected = normalized.map((value, index) => {
        const channel = layout === 'nchw' ? Math.floor(index / 4) : index % 2;
        return affine ? value * [0.5, 2][channel] + [0.25, -0.5][channel] : value;
      });
      zeroEpsilonTests.push({
        name: `instanceNormalization ${dataType} ${layout} zero epsilon ${
            affine ? 'constant affine' : 'no affine'}`,
        graph: {
          inputs,
          operators: [{
            name: 'instanceNormalization',
            arguments: [{input: 'input'}, {options}], outputs: 'result'
          }],
          expectedOutputs: {
            result: {data: expected, descriptor: {shape: [1, 2, 2, 2], dataType}}
          }
        }
      });
    }
  }
}

webnn_conformance_test(
    zeroEpsilonTests, buildAndExecuteGraph, getInstanceNormPrecisionTolerance);
