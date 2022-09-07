// META: title=test WebNN API reshape operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-reshape

const testReshape = async (operandType, syncFlag, oldShape, newShape, expectedShape) => {
  const x = builder.input('x', {type: operandType, dimensions: oldShape});
  const y = builder.reshape(x, newShape);
  const bufferSize = sizeOfShape(oldShape);
  const TestTypedArray = TypedArrayDict[operandType];
  const inputBuffer = new TestTypedArray(bufferSize);

  for (let i = 0; i < inputBuffer.length; ++i) {
    inputBuffer[i] = Math.random();
  }

  const inputs = {'x': inputBuffer};
  const outputs = {
    'y': new TestTypedArray(sizeOfShape(expectedShape ? expectedShape : newShape)),
  };
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, new TestTypedArray(inputBuffer), PrecisionMetrics.ULP[operandType].reshape, operandType);
};

// tests = {
//   purpose: [
//     [oldShape, newShape, expectedShape],
//   ],
// };
const tests = {
  'reorder all dimensions': [
    // 2D to 2D
    [[2, 3], [3, 2], [3, 2]],
    // 3D to 3D
    [[2, 3, 4], [4, 2, 3], [4, 2, 3]],
    // 4D to 4D
    [[2, 3, 4, 5], [5, 4, 3, 2], [5, 4, 3, 2]],
    // 5D to 5D
    [[2, 3, 4, 5, 6], [6, 4, 5, 3, 2], [6, 4, 5, 3, 2]],
  ],
  'reduce dimensions': [
    // 2D to 1D
    [[2, 3], [6], [6]],
    // 3D to 1D
    [[2, 3, 4], [24], [24]],
    // 3D to 2D
    [[2, 3, 4], [4, 6], [4, 6]],
    // 4D to 1D
    [[2, 3, 4, 5], [120], [120]],
    // 4D to 2D
    [[2, 3, 4, 5], [8, 15], [8, 15]],
    // 4D to 3D
    [[2, 3, 4, 5], [4, 5, 6], [4, 5, 6]],
    // 5D to 1D
    [[2, 3, 4, 5, 6], [720], [720]],
    // 5D to 2D
    [[2, 3, 4, 5, 6], [20, 36], [20, 36]],
    // 5D to 3D
    [[2, 3, 4, 5, 6], [6, 10, 12], [6, 10, 12]],
    // 5D to 4D
    [[2, 3, 4, 5, 6], [3, 5, 6, 8], [3, 5, 6, 8]],
  ],
  'extend dimensions': [
    // 1D to 2D
    [[6], [2, 3], [2, 3]],
    // 1D to 3D
    [[24], [2, 3, 4], [2, 3, 4]],
    // 1D to 4D
    [[120], [2, 3, 4, 5], [2, 3, 4, 5]],
    // 1D to 5D
    [[720], [2, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
    // 2D to 3D
    [[4, 6], [2, 3, 4], [2, 3, 4]],
    // 2D to 4D
    [[8, 15], [2, 3, 4, 5], [2, 3, 4, 5]],
    // 2D to 5D
    [[20, 36], [2, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
    // 3D to 4D
    [[4, 5, 6], [2, 3, 4, 5], [2, 3, 4, 5]],
    // 3D to 5D
    [[6, 10, 12], [2, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
    // 4D to 5D
    [[3, 5, 6, 8], [2, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
  ],
  'new shape with one dimension being the special value of -1': [
    // 1D to 1D
    [[6], [-1], [6]],
    // 2D to 1D
    [[2, 3], [-1], [6]],
    // 2D to 2D
    [[2, 3], [-1, 2], [3, 2]],
    [[2, 3], [3, -1], [3, 2]],
    // 2D to 3D
    [[4, 6], [-1, 3, 4], [2, 3, 4]],
    [[4, 6], [2, -1, 4], [2, 3, 4]],
    [[4, 6], [2, 3, -1], [2, 3, 4]],
    // 2D to 4D
    [[8, 15], [-1, 3, 4, 5], [2, 3, 4, 5]],
    [[8, 15], [2, -1, 4, 5], [2, 3, 4, 5]],
    [[8, 15], [2, 3, -1, 5], [2, 3, 4, 5]],
    [[8, 15], [2, 3, 4, -1], [2, 3, 4, 5]],
    // 2D to 5D
    [[20, 36], [-1, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
    [[20, 36], [2, -1, 4, 5, 6], [2, 3, 4, 5, 6]],
    [[20, 36], [2, 3, -1, 5, 6], [2, 3, 4, 5, 6]],
    [[20, 36], [2, 3, 4, -1, 6], [2, 3, 4, 5, 6]],
    [[20, 36], [2, 3, 4, 5, -1], [2, 3, 4, 5, 6]],
    // 3D to 1D
    [[2, 3, 4], [-1], [24]],
    // 3D to 2D
    [[2, 3, 4], [-1, 6], [4, 6]],
    [[2, 3, 4], [4, -1], [4, 6]],
    // 3D to 3D
    [[2, 3, 4], [-1, 2, 3], [4, 2, 3]],
    [[2, 3, 4], [4, -1, 3], [4, 2, 3]],
    [[2, 3, 4], [4, 2, -1], [4, 2, 3]],
    // 3D to 4D
    [[4, 5, 6], [-1, 3, 4, 5], [2, 3, 4, 5]],
    [[4, 5, 6], [2, -1, 4, 5], [2, 3, 4, 5]],
    [[4, 5, 6], [2, 3, -1, 5], [2, 3, 4, 5]],
    [[4, 5, 6], [2, 3, 4, -1], [2, 3, 4, 5]],
    // 3D to 5D
    [[6, 10, 12], [-1, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
    [[6, 10, 12], [2, -1, 4, 5, 6], [2, 3, 4, 5, 6]],
    [[6, 10, 12], [2, 3, -1, 5, 6], [2, 3, 4, 5, 6]],
    [[6, 10, 12], [2, 3, 4, -1, 6], [2, 3, 4, 5, 6]],
    [[6, 10, 12], [2, 3, 4, 5, -1], [2, 3, 4, 5, 6]],
    // 4D to 1D
    [[2, 3, 4, 5], [-1], [120]],
    // 4D to 2D
    [[2, 3, 4, 5], [-1, 15], [8, 15]],
    [[2, 3, 4, 5], [8, -1], [8, 15]],
    // 4D to 3D
    [[2, 3, 4, 5], [-1, 5, 6], [4, 5, 6]],
    [[2, 3, 4, 5], [4, -1, 6], [4, 5, 6]],
    [[2, 3, 4, 5], [4, 5, -1], [4, 5, 6]],
    // 4D to 4D
    [[2, 3, 4, 5], [-1, 4, 3, 2], [5, 4, 3, 2]],
    [[2, 3, 4, 5], [5, -1, 3, 2], [5, 4, 3, 2]],
    [[2, 3, 4, 5], [5, 4, -1, 2], [5, 4, 3, 2]],
    [[2, 3, 4, 5], [5, 4, 3, -1], [5, 4, 3, 2]],
    // 4D to 5D
    [[3, 5, 6, 8], [-1, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
    [[3, 5, 6, 8], [2, -1, 4, 5, 6], [2, 3, 4, 5, 6]],
    [[3, 5, 6, 8], [2, 3, -1, 5, 6], [2, 3, 4, 5, 6]],
    [[3, 5, 6, 8], [2, 3, 4, -1, 6], [2, 3, 4, 5, 6]],
    [[3, 5, 6, 8], [2, 3, 4, 5, -1], [2, 3, 4, 5, 6]],
    // 5D to 1D
    [[2, 3, 4, 5, 6], [-1], [720]],
    // 5D to 2D
    [[2, 3, 4, 5, 6], [-1, 36], [20, 36]],
    [[2, 3, 4, 5, 6], [20, -1], [20, 36]],
    // 5D to 3D
    [[2, 3, 4, 5, 6], [6, 10, 12], [6, 10, 12]],
    [[2, 3, 4, 5, 6], [6, 10, 12], [6, 10, 12]],
    [[2, 3, 4, 5, 6], [6, 10, 12], [6, 10, 12]],
    // 5D to 4D
    [[2, 3, 4, 5, 6], [-1, 5, 6, 8], [3, 5, 6, 8]],
    [[2, 3, 4, 5, 6], [3, -1, 6, 8], [3, 5, 6, 8]],
    [[2, 3, 4, 5, 6], [3, 5, -1, 8], [3, 5, 6, 8]],
    [[2, 3, 4, 5, 6], [3, 5, 6, -1], [3, 5, 6, 8]],
    // 5D to 5D
    [[2, 3, 4, 5, 6], [-1, 4, 5, 3, 2], [6, 4, 5, 3, 2]],
    [[2, 3, 4, 5, 6], [6, -1, 5, 3, 2], [6, 4, 5, 3, 2]],
    [[2, 3, 4, 5, 6], [6, 4, -1, 3, 2], [6, 4, 5, 3, 2]],
    [[2, 3, 4, 5, 6], [6, 4, 5, -1, 2], [6, 4, 5, 3, 2]],
    [[2, 3, 4, 5, 6], [6, 4, 5, 3, -1], [6, 4, 5, 3, 2]],
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
        const subTests = tests[purpose];
          promise_test(async () => {
            for (let i = 0; i < subTests.length; i++) {
              await testReshape(operandType, isSync, subTests[i][0], subTests[i][1], subTests[i][2]);
            }
          }, `test reshape to ${purpose} / ${deviceType} / ${executionType} / ${operandType}`);
      }
    });
  });
});


