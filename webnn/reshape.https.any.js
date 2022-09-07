// META: title=test WebNN API reshape operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-reshape

let context;
let builder;

const testReshape = async (syncFlag, oldShape, newShape, expectedShape) => {
  const x = builder.input('x', {type: 'float32', dimensions: oldShape});
  const y = builder.reshape(x, newShape);
  const bufferSize = sizeOfShape(oldShape);
  const inputBuffer = new Float32Array(bufferSize);

  for (let i = 0; i < inputBuffer.length; ++i) {
    inputBuffer[i] = Math.random();
  }

  const inputs = {'x': inputBuffer};
  const outputs = {
    'y': new Float32Array(sizeOfShape(expectedShape ? expectedShape : newShape)),
  };
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, inputBuffer, ULPTolerance.float32.reshape, 'float32');
};


// {oldShape, newShape, expectedShape, name},
const tests = {
  'reorder all dimensions': [
    {oldShape: [2, 3], newShape: [3, 2], expectedShape: [3, 2], name: '2D to 2D'},
    {oldShape: [2, 3, 4], newShape: [4, 2, 3], expectedShape: [4, 2, 3], name: '3D to 3D'},
    {oldShape: [2, 3, 4, 5], newShape: [5, 4, 3, 2], expectedShape: [5, 4, 3, 2], name: '4D to 4D'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 4, 5, 3, 2], expectedShape: [6, 4, 5, 3, 2], name: '5D to 5D'},
  ],
  'reduce dimensions': [
    {oldShape: [2, 3], newShape: [6], expectedShape: [6], name: '2D to 1D'},
    {oldShape: [2, 3, 4], newShape: [24], expectedShape: [24], name: '3D to 1D'},
    {oldShape: [2, 3, 4], newShape: [4, 6], expectedShape: [4, 6], name: '3D to 2D'},
    {oldShape: [2, 3, 4, 5], newShape: [120], expectedShape: [120], name: '4D to 1D'},
    {oldShape: [2, 3, 4, 5], newShape: [8, 15], expectedShape: [8, 15], name: '4D to 2D'},
    {oldShape: [2, 3, 4, 5], newShape: [4, 5, 6], expectedShape: [4, 5, 6], name: '4D to 3D'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [720], expectedShape: [720], name: '5D to 1D'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [20, 36], expectedShape: [20, 36], name: '5D to 2D'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 10, 12], expectedShape: [6, 10, 12], name: '5D to 3D'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [3, 5, 6, 8], expectedShape: [3, 5, 6, 8], name: '5D to 4D'},
  ],
  'extend dimensions': [
    {oldShape: [6], newShape: [2, 3], expectedShape: [2, 3], name: '1D to 2D'},
    {oldShape: [24], newShape: [2, 3, 4], expectedShape: [2, 3, 4], name: '1D to 3D'},
    {oldShape: [120], newShape: [2, 3, 4, 5], expectedShape: [2, 3, 4, 5], name: '1D to 4D'},
    {oldShape: [720], newShape: [2, 3, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '1D to 5D'},
    {oldShape: [4, 6], newShape: [2, 3, 4], expectedShape: [2, 3, 4], name: '2D to 3D'},
    {oldShape: [8, 15], newShape: [2, 3, 4, 5], expectedShape: [2, 3, 4, 5], name: '2D to 4D'},
    {oldShape: [20, 36], newShape: [2, 3, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '2D to 5D'},
    {oldShape: [4, 5, 6], newShape: [2, 3, 4, 5], expectedShape: [2, 3, 4, 5], name: '3D to 4D'},
    {oldShape: [6, 10, 12], newShape: [2, 3, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '3D to 5D'},
    {oldShape: [3, 5, 6, 8], newShape: [2, 3, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '4D to 5D'},
  ],
  'new shape with one dimension being the special value of -1': [
    {oldShape: [2, 3], newShape: [-1], expectedShape: [6], name: '2D to 1D'},
    {oldShape: [2, 3], newShape: [-1, 2], expectedShape: [3, 2], name: '2D to 2D / 1'},
    {oldShape: [2, 3], newShape: [3, -1], expectedShape: [3, 2], name: '2D to 2D / 2'},
    {oldShape: [4, 6], newShape: [-1, 3, 4], expectedShape: [2, 3, 4], name: '2D to 3D / 1'},
    {oldShape: [4, 6], newShape: [2, -1, 4], expectedShape: [2, 3, 4], name: '2D to 3D / 2'},
    {oldShape: [4, 6], newShape: [2, 3, -1], expectedShape: [2, 3, 4], name: '2D to 3D / 3'},
    {oldShape: [8, 15], newShape: [-1, 3, 4, 5], expectedShape: [2, 3, 4, 5], name: '2D to 4D / 1'},
    {oldShape: [8, 15], newShape: [2, -1, 4, 5], expectedShape: [2, 3, 4, 5], name: '2D to 4D / 2'},
    {oldShape: [8, 15], newShape: [2, 3, -1, 5], expectedShape: [2, 3, 4, 5], name: '2D to 4D / 3'},
    {oldShape: [8, 15], newShape: [2, 3, 4, -1], expectedShape: [2, 3, 4, 5], name: '2D to 4D / 4'},
    {oldShape: [20, 36], newShape: [-1, 3, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '2D to 5D / 1'},
    {oldShape: [20, 36], newShape: [2, -1, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '2D to 5D / 2'},
    {oldShape: [20, 36], newShape: [2, 3, -1, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '2D to 5D / 3'},
    {oldShape: [20, 36], newShape: [2, 3, 4, -1, 6], expectedShape: [2, 3, 4, 5, 6], name: '2D to 5D / 4'},
    {oldShape: [20, 36], newShape: [2, 3, 4, 5, -1], expectedShape: [2, 3, 4, 5, 6], name: '2D to 5D / 5'},
    {oldShape: [2, 3, 4], newShape: [-1], expectedShape: [24], name: '3D to 1D'},
    {oldShape: [2, 3, 4], newShape: [-1, 6], expectedShape: [4, 6], name: '3D to 2D / 1'},
    {oldShape: [2, 3, 4], newShape: [4, -1], expectedShape: [4, 6], name: '3D to 2D / 2'},
    {oldShape: [2, 3, 4], newShape: [-1, 2, 3], expectedShape: [4, 2, 3], name: '3D to 3D / 1'},
    {oldShape: [2, 3, 4], newShape: [4, -1, 3], expectedShape: [4, 2, 3], name: '3D to 3D / 2'},
    {oldShape: [2, 3, 4], newShape: [4, 2, -1], expectedShape: [4, 2, 3], name: '3D to 3D / 3'},
    {oldShape: [4, 5, 6], newShape: [-1, 3, 4, 5], expectedShape: [2, 3, 4, 5], name: '3D to 4D / 1'},
    {oldShape: [4, 5, 6], newShape: [2, -1, 4, 5], expectedShape: [2, 3, 4, 5], name: '3D to 4D / 2'},
    {oldShape: [4, 5, 6], newShape: [2, 3, -1, 5], expectedShape: [2, 3, 4, 5], name: '3D to 4D / 3'},
    {oldShape: [4, 5, 6], newShape: [2, 3, 4, -1], expectedShape: [2, 3, 4, 5], name: '3D to 4D / 4'},
    {oldShape: [6, 10, 12], newShape: [-1, 3, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '3D to 5D / 1'},
    {oldShape: [6, 10, 12], newShape: [2, -1, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '3D to 5D / 2'},
    {oldShape: [6, 10, 12], newShape: [2, 3, -1, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '3D to 5D / 3'},
    {oldShape: [6, 10, 12], newShape: [2, 3, 4, -1, 6], expectedShape: [2, 3, 4, 5, 6], name: '3D to 5D / 4'},
    {oldShape: [6, 10, 12], newShape: [2, 3, 4, 5, -1], expectedShape: [2, 3, 4, 5, 6], name: '3D to 5D / 5'},
    {oldShape: [2, 3, 4, 5], newShape: [-1], expectedShape: [120], name: '4D to 1D'},
    {oldShape: [2, 3, 4, 5], newShape: [-1, 15], expectedShape: [8, 15], name: '4D to 2D / 1'},
    {oldShape: [2, 3, 4, 5], newShape: [8, -1], expectedShape: [8, 15], name: '4D to 2D / 2'},
    {oldShape: [2, 3, 4, 5], newShape: [-1, 5, 6], expectedShape: [4, 5, 6], name: '4D to 3D / 1'},
    {oldShape: [2, 3, 4, 5], newShape: [4, -1, 6], expectedShape: [4, 5, 6], name: '4D to 3D / 2'},
    {oldShape: [2, 3, 4, 5], newShape: [4, 5, -1], expectedShape: [4, 5, 6], name: '4D to 3D / 3'},
    {oldShape: [2, 3, 4, 5], newShape: [-1, 4, 3, 2], expectedShape: [5, 4, 3, 2], name: '4D to 4D / 1'},
    {oldShape: [2, 3, 4, 5], newShape: [5, -1, 3, 2], expectedShape: [5, 4, 3, 2], name: '4D to 4D / 2'},
    {oldShape: [2, 3, 4, 5], newShape: [5, 4, -1, 2], expectedShape: [5, 4, 3, 2], name: '4D to 4D / 3'},
    {oldShape: [2, 3, 4, 5], newShape: [5, 4, 3, -1], expectedShape: [5, 4, 3, 2], name: '4D to 4D / 4'},
    {oldShape: [3, 5, 6, 8], newShape: [-1, 3, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '4D to 5D / 1'},
    {oldShape: [3, 5, 6, 8], newShape: [2, -1, 4, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '4D to 5D / 2'},
    {oldShape: [3, 5, 6, 8], newShape: [2, 3, -1, 5, 6], expectedShape: [2, 3, 4, 5, 6], name: '4D to 5D / 3'},
    {oldShape: [3, 5, 6, 8], newShape: [2, 3, 4, -1, 6], expectedShape: [2, 3, 4, 5, 6], name: '4D to 5D / 4'},
    {oldShape: [3, 5, 6, 8], newShape: [2, 3, 4, 5, -1], expectedShape: [2, 3, 4, 5, 6], name: '4D to 5D / 5'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [-1], expectedShape: [720], name: '5D to 1D'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [-1, 36], expectedShape: [20, 36], name: '5D to 2D / 1'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [20, -1], expectedShape: [20, 36], name: '5D to 2D / 2'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 10, 12], expectedShape: [6, 10, 12], name: '5D to 3D / 1'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 10, 12], expectedShape: [6, 10, 12], name: '5D to 3D / 2'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 10, 12], expectedShape: [6, 10, 12], name: '5D to 3D / 3'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [-1, 5, 6, 8], expectedShape: [3, 5, 6, 8], name: '5D to 4D / 1'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [3, -1, 6, 8], expectedShape: [3, 5, 6, 8], name: '5D to 4D / 2'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [3, 5, -1, 8], expectedShape: [3, 5, 6, 8], name: '5D to 4D / 3'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [3, 5, 6, -1], expectedShape: [3, 5, 6, 8], name: '5D to 4D / 4'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [-1, 4, 5, 3, 2], expectedShape: [6, 4, 5, 3, 2], name: '5D to 5D / 1'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, -1, 5, 3, 2], expectedShape: [6, 4, 5, 3, 2], name: '5D to 5D / 2'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 4, -1, 3, 2], expectedShape: [6, 4, 5, 3, 2], name: '5D to 5D / 3'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 4, 5, -1, 2], expectedShape: [6, 4, 5, 3, 2], name: '5D to 5D / 4'},
    {oldShape: [2, 3, 4, 5, 6], newShape: [6, 4, 5, 3, -1], expectedShape: [6, 4, 5, 3, 2], name: '5D to 5D / 5'},
  ],
};

for (let purpose in tests) {
  const subTests = tests[purpose];
  for (let i = 0; i < subTests.length; i++) {
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

        promise_test(async () => {
          await testReshape(isSync, subTests[i].oldShape, subTests[i].newShape, subTests[i].expectedShape);
        }, `test reshape to ${purpose} ${subTests[i].name} / ${deviceType} / ${executionType}`);
      });
    });
  }
}


