// META: title=test WebNN API slice operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-slice

const testSlice = async (operandType, syncFlag, inputShape, inputData, starts, sizes, axes, expectedShape, expected) => {
  const x = builder.input('x', {type: operandType, dimensions: inputShape});
  const y = builder.slice(x, starts, sizes, {axes});
  const TestTypedArray = TypedArrayDict[operandType];
  const inputs = {'x': new TestTypedArray(inputData)};
  const outputs = {'y': new TestTypedArray(sizeOfShape(expectedShape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, expected, PrecisionMetrics.ULP[operandType].slice, operandType);
};

const inputData = [
  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
];

// tests = {
//   purpose: [
//     [inputShape, starts, sizes, axes, expectedShape, expected],
//   ],
// };
const tests = {
  'default axes options': [
    // 1D
    [[24], [10], [8], undefined, [8], [11, 12, 13, 14, 15, 16, 17, 18]],
    // 2D
    [[4, 6], [1, 2], [2, 3], undefined, [2, 3], [9, 10, 11, 15, 16, 17]],
    // 3D
    [[2, 3, 4], [1, 1, 2], [1, 2, 2], undefined, [1, 2, 2], [19, 20, 23, 24],],
    // 4D
    [[1, 2, 4, 3], [0, 1, 2, 1], [1, 1, 2, 2], undefined, [1, 1, 2, 2], [20, 21, 23, 24],],
    // 5D
    [[1, 3, 2, 2, 2], [0, 1, 0, 1, 0], [1, 2, 2, 1, 2], undefined, [1, 2, 2, 1, 2], [11, 12, 15, 16, 19, 20, 23, 24,]],
  ],
  'negative starts': [
    // 1D
    [[24], [-14], [8], undefined, [8], [11, 12, 13, 14, 15, 16, 17, 18]],
    // 2D
    [[4, 6], [-3, -4], [2, 3], undefined, [2, 3], [9, 10, 11, 15, 16, 17]],
    // 3D
    [[2, 3, 4], [-1, -2, -2], [1, 2, 2], undefined, [1, 2, 2], [19, 20, 23, 24],],
    // 4D
    [[1, 2, 4, 3], [-1, -1, -2, -2], [1, 1, 2, 2], undefined, [1, 1, 2, 2], [20, 21, 23, 24],],
    // 5D
    [[1, 3, 2, 2, 2], [-1, -2, -2, -1, -2], [1, 2, 2, 1, 2], undefined, [1, 2, 2, 1, 2], [11, 12, 15, 16, 19, 20, 23, 24,]],
  ],
  'axes options': [
    // 1D
    [[24], [10], [8], [0], [8], [11, 12, 13, 14, 15, 16, 17, 18]],
    // 2D
    [[4, 6], [2], [3], [1], [4, 3], [3, 4, 5, 9, 10, 11, 15, 16, 17, 21, 22, 23]],
    // 3D
    [[2, 3, 4], [1, 2], [2, 2], [1, 2], [2, 2, 2], [7, 8, 11, 12, 19, 20, 23, 24],],
    // 4D
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [0, 2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    // 5D
    [[1, 3, 2, 2, 2], [0, 2, 0, 1, 0], [1, 1, 2, 1, 2], [0, 1, 2, 3, 4], [1, 1, 2, 1, 2], [19, 20, 23, 24]],
  ],
  'negative axes options': [
    // 1D
    [[24], [10], [8], [-1], [8], [11, 12, 13, 14, 15, 16, 17, 18]],
    // 2D
    [[4, 6], [2], [3], [-1], [4, 3], [3, 4, 5, 9, 10, 11, 15, 16, 17, 21, 22, 23]],
    [[4, 6], [0, 2], [4, 3], [0, -1], [4, 3], [3, 4, 5, 9, 10, 11, 15, 16, 17, 21, 22, 23]],
    [[4, 6], [0, 2], [4, 3], [-2, 1], [4, 3], [3, 4, 5, 9, 10, 11, 15, 16, 17, 21, 22, 23]],
    [[4, 6], [0, 2], [4, 3], [-2, -1], [4, 3], [3, 4, 5, 9, 10, 11, 15, 16, 17, 21, 22, 23]],
    // 3D
    [[2, 3, 4], [1, 2], [2, 2], [1, -1], [2, 2, 2], [7, 8, 11, 12, 19, 20, 23, 24],],
    [[2, 3, 4], [1, 2], [2, 2], [-2, 2], [2, 2, 2], [7, 8, 11, 12, 19, 20, 23, 24],],
    [[2, 3, 4], [1, 2], [2, 2], [-2, -1], [2, 2, 2], [7, 8, 11, 12, 19, 20, 23, 24],],
    // 4D
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [0, 2, -1], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [0, -2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [-4, 2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [-4, -2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [0, -2, -1], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [-4, 2, -1], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [1, 2, 2], [-4, -2, -1], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    // 5D
    [[1, 3, 2, 2, 2], [0, 2, 0, 1, 0], [1, 1, 2, 1, 2], [0, 1, -3, 3, -1], [1, 1, 2, 1, 2], [19, 20, 23, 24]],
  ],
  'sizes having special value of -1': [
    // 1D
    [[24], [12], [-1], [0], [12], [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]],
    // 2D
    [[4, 6], [2], [-1], [1], [4, 4], [3, 4, 5, 6, 9, 10, 11, 12, 15, 16, 17, 18, 21, 22, 23, 24]],
    // 3D
    [[2, 3, 4], [1, 2], [-1, 2], [1, 2], [2, 2, 2], [7, 8, 11, 12, 19, 20, 23, 24],],
    [[2, 3, 4], [1, 2], [-1, -1], [1, 2], [2, 2, 2], [7, 8, 11, 12, 19, 20, 23, 24],],
    // 4D
    [[1, 2, 4, 3], [0, 2, 1], [-1, 2, 2], [0, 2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [1, -1, -1], [0, 2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [-1, -1, 2], [0, 2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    [[1, 2, 4, 3], [0, 2, 1], [-1, -1, -1], [0, 2, 3], [1, 2, 2, 2], [8, 9, 11, 12, 20, 21, 23, 24],],
    // 5D
    [[1, 3, 2, 2, 2], [0, 2, 0, 1, 0], [1, 1, -1, 1, -1], [0, 1, 2, 3, 4], [1, 1, 2, 1, 2], [19, 20, 23, 24]],
  ],
};
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
      builder = new MLGraphBuilder(context);
    });

    OperandTypeArray.forEach(operandType => {
      for (let purpose in tests) {
        promise_test(async () => {
          const subTests = tests[purpose];
          for (let i = 0; i < subTests.length; i++) {
            await testSlice(operandType, isSync, subTests[i][0], inputData, subTests[i][1], subTests[i][2], subTests[i][3], subTests[i][4], subTests[i][5]);
          }
        }, `test slice with ${purpose} / ${deviceType} / ${executionType} / ${operandType}`);
      }
    });
  });
});
