// META: title=test WebNN API relu operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-relu

const testRelu = async (operandType, syncFlag, inputShape, inputValue, expected) => {
  const x = builder.input('x', {type: operandType, dimensions: inputShape});
  const y = builder.relu(x);
  const TestTypedArray = TypedArrayDict[operandType];
  const inputs = {
    'x': new TestTypedArray(inputValue),
  };
  const outputs = {'y': new TestTypedArray(sizeOfShape(inputShape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, expected[operandType], PrecisionMetrics.ULP[operandType].relu, operandType);
};

// The behavior of relu operation is equal to behavior of clamp with specified minValu=0 options.
// Reuse input data (inputData) and expected data (expectedMinZero) in ./clamp.https.any.js to test relu operation
const inputData = [
  -3.4356449350874696, -6.530945988411405,  -8.175760663838268, 2.0879641317522726,
  -4.480150236948526,  -8.591504561715722,  5.071455429211573,  -6.618697702258771,
  4.224577823136105,   6.450272349350044,   -8.799923845835664, -3.3445965406946643,
  5.550524270215341,   1.2788677438688012,  9.333702625514768,  9.2261637863086,
  -7.302720212371034,  1.7865902395032585,  5.564981581526375,  3.145101011211482,
  -8.275078596251655,  -1.3557080837143296, 7.348269585030259,  -5.530012756488021,
];
const expected = {
  float32: [
    0,                  0,                  0,                 2.0879640579223633,
    0,                  0,                  5.071455478668213, 0,
    4.224577903747559,  6.450272560119629,  0,                 0,
    5.5505242347717285, 1.2788677215576172, 9.33370304107666,  9.226163864135742,
    0,                  1.7865902185440063, 5.564981460571289, 3.1451010704040527,
    0,                  0,                  7.348269462585449, 0,
  ],
};
// tests = [shape];
const tests = [
    // 1D
    [24],
    // 2D
    [4, 6],
    // 3D
    [2, 3, 4],
    // 4D
    [2, 3, 2, 2],
    // 5D
    [2, 3, 2, 1, 2],
];
let context;
let builder;

ExecutionArray.forEach(executionType => {
  const isSync = executionType === 'sync';
  if (self.GLOBAL.isWindow() && isSync) {
    return;
  }

  DeviceTypeArray.forEach(deviceType => {
    promise_setup(async () => {
      context = navigator.ml.createContext({deviceType});
      let tf = context.tf;
      await tf.setBackend('wasm');
      await tf.ready();
      builder = new MLGraphBuilder(context);
    });

    OperandTypeArray.forEach(operandType => {
      promise_test(async () => {
        for (let i = 0; i < tests.length; i++) {
          await testRelu(operandType, isSync, tests[i], inputData, expected);
        }
      }, `test relu / ${deviceType} / ${executionType} / ${operandType}`);
    });
  });
});