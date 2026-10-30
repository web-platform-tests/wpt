// META: title=WebNN GELU negative tails
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-gelu-method
// References use x/2 * erfc(-x/sqrt(2)), evaluated independently with
// mpmath erfc and a Decimal erf series at 160 and 240 digits, then rounded
// once to float32. This avoids cancellation in 1 + erf(x/sqrt(2)).
// Keep the existing GELU 18-ULP allowance through getPrecisionTolerance.
// -2 and -5 also distinguish the specified function from tanh approximation.
const negativeTailPackets = [
  {input: [-2, -5, -10, -13.5, -14],
    expected: [-0.0455002635717392, -1.433257807548216e-06, -7.619852977043458e-23, -1.0555420812373117e-40, -1.0930128021733573e-43], shape: [5]},
  {input: [-5], expected: [-1.433257807548216e-06], shape: []},
  {input: [-10], expected: [-7.619852977043458e-23], shape: []},

];
const negativeTailTests = [];
for (const {input, expected, shape} of negativeTailPackets) {
  for (const constant of [false, true]) {
    const descriptor = {shape, dataType: 'float32'};
    negativeTailTests.push({
      name: `gelu float32 negative tails ${shape.length ? 'vector' : input[0]} ` +
          `${constant ? 'constant' : 'runtime'}`,
      graph: {
        inputs: {input: {data: input, descriptor, constant}},
        operators: [{name: 'gelu', arguments: [{input: 'input'}], outputs: 'output'}],
        expectedOutputs: {output: {data: expected, descriptor}}
      }
    });
  }
}
webnn_conformance_test(negativeTailTests, buildAndExecuteGraph, getPrecisionTolerance);
