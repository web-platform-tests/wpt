// META: title=test WebNN API transpose operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-transpose

const testTranspose = async (operandType, syncFlag, inputShape, inputData, expectedShape, expected, permutation = undefined) => {
  const x = builder.input('x', {type: operandType, dimensions: inputShape});
  const y = builder.transpose(x, {permutation});
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

  assert_array_approx_equals_ulp(outputs.y, expected, PrecisionMetrics.ULP[operandType].transpose, operandType);
};

const inputData = [
  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
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
      builder = new MLGraphBuilder(context);
    });

    OperandTypeArray.forEach(operandType => {
      promise_test(async () => {
        // transpose 2D
        const expected2D = [
          1, 7,  13, 19, 2, 8,  14, 20, 3, 9,  15, 21,
          4, 10, 16, 22, 5, 11, 17, 23, 6, 12, 18, 24,
        ];
        await testTranspose(operandType, isSync, [4, 6], inputData, [6, 4], expected2D);
        // transpose 3D
        const expected3D = [
          1, 13, 5, 17, 9,  21, 2, 14, 6, 18, 10, 22,
          3, 15, 7, 19, 11, 23, 4, 16, 8, 20, 12, 24,
        ];
        await testTranspose(operandType, isSync, [2, 3, 4], inputData, [4, 3, 2], expected3D);
        // transpose 4D
        const expected4D = [
          1, 13, 5, 17, 9,  21, 3, 15, 7, 19, 11, 23,
          2, 14, 6, 18, 10, 22, 4, 16, 8, 20, 12, 24,
        ];
        await testTranspose(operandType, isSync, [2, 3, 2, 2], inputData, [2, 2, 3, 2], expected4D);
        // transpose 5D
        const expected5D = [
          1, 13, 5, 17, 9,  21, 2, 14, 6, 18, 10, 22,
          3, 15, 7, 19, 11, 23, 4, 16, 8, 20, 12, 24,
        ];
        await testTranspose(operandType, isSync, [1, 2, 3, 4, 1], inputData, [1, 4, 3, 2, 1], expected5D);
      }, `test transpose with default permutations options / ${deviceType} / ${executionType} / ${operandType}`);

      promise_test(async () => {
        // transpose 2D
        const permutations2D = [[0, 1], [1, 0]];
        const inputShape2D = [4, 6];
        const expectedShapes2D = [[4, 6], [6, 4]];
        const expecteds2D = [
          [
            1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          ],
          [
            1, 7,  13, 19, 2, 8,  14, 20, 3, 9,  15, 21,
            4, 10, 16, 22, 5, 11, 17, 23, 6, 12, 18, 24,
          ],
        ];
        for (let i = 0; i < permutations2D.length; ++i) {
          await testTranspose(operandType, isSync, inputShape2D, inputData, expectedShapes2D[i], expecteds2D[i], permutations2D[i]);
        }
        // transpose 3D
        const permutations3D = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        const inputShape3D = [2, 3, 4];
        const expectedShapes3D = [[2, 3, 4], [2, 4, 3], [3, 2, 4], [3, 4, 2], [4, 2, 3], [4, 3, 2]];
        const expecteds3D = [
          [
            1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          ],
          [
            1,  5,  9,  2,  6,  10, 3,  7,  11, 4,  8,  12,
            13, 17, 21, 14, 18, 22, 15, 19, 23, 16, 20, 24,
          ],
          [
            1,  2,  3,  4,  13, 14, 15, 16, 5,  6,  7,  8,
            17, 18, 19, 20, 9,  10, 11, 12, 21, 22, 23, 24,
          ],
          [
            1, 13, 2, 14, 3, 15, 4,  16, 5,  17, 6,  18,
            7, 19, 8, 20, 9, 21, 10, 22, 11, 23, 12, 24,
          ],
          [
            1, 5, 9,  13, 17, 21, 2, 6, 10, 14, 18, 22,
            3, 7, 11, 15, 19, 23, 4, 8, 12, 16, 20, 24,
          ],
          [
            1, 13, 5, 17, 9,  21, 2, 14, 6, 18, 10, 22,
            3, 15, 7, 19, 11, 23, 4, 16, 8, 20, 12, 24,
          ],
        ];
        for (let i = 0; i < permutations3D.length; ++i) {
          await testTranspose(operandType, isSync, inputShape3D, inputData, expectedShapes3D[i], expecteds3D[i], permutations3D[i]);
        }
        // transpose 4D
        const permutations4D = [
          [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
          [1, 0, 2, 3], [1, 0, 3, 2], [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
          [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [2, 3, 1, 0],
          [3, 0, 1, 2], [3, 0, 2, 1], [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0],
        ];
        const inputShape4D = [1, 2, 3, 4];
        const expectedShapes4D = [
          [1, 2, 3, 4], [1, 2, 4, 3], [1, 3, 2, 4], [1, 3, 4, 2], [1, 4, 2, 3], [1, 4, 3, 2],
          [2, 1, 3, 4], [2, 1, 4, 3], [2, 3, 1, 4], [2, 3, 4, 1], [2, 4, 1, 3], [2, 4, 3, 1],
          [3, 1, 2, 4], [3, 1, 4, 2], [3, 2, 1, 4], [3, 2, 4, 1], [3, 4, 1, 2], [3, 4, 2, 1],
          [4, 1, 2, 3], [4, 1, 3, 2], [4, 2, 1, 3], [4, 2, 3, 1], [4, 3, 1, 2], [4, 3, 2, 1],
        ];
        const expecteds4D = [
          [
            1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          ],
          [
            1,  5,  9,  2,  6,  10, 3,  7,  11, 4,  8,  12,
            13, 17, 21, 14, 18, 22, 15, 19, 23, 16, 20, 24,
          ],
          [
            1,  2,  3,  4,  13, 14, 15, 16, 5,  6,  7,  8,
            17, 18, 19, 20, 9,  10, 11, 12, 21, 22, 23, 24,
          ],
          [
            1, 13, 2, 14, 3, 15, 4,  16, 5,  17, 6,  18,
            7, 19, 8, 20, 9, 21, 10, 22, 11, 23, 12, 24,
          ],
          [
            1, 5, 9,  13, 17, 21, 2, 6, 10, 14, 18, 22,
            3, 7, 11, 15, 19, 23, 4, 8, 12, 16, 20, 24,
          ],
          [
            1, 13, 5, 17, 9,  21, 2, 14, 6, 18, 10, 22,
            3, 15, 7, 19, 11, 23, 4, 16, 8, 20, 12, 24,
          ],
          [
            1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          ],
          [
            1,  5,  9,  2,  6,  10, 3,  7,  11, 4,  8,  12,
            13, 17, 21, 14, 18, 22, 15, 19, 23, 16, 20, 24,
          ],
          [
            1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          ],
          [
            1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          ],
          [
            1,  5,  9,  2,  6,  10, 3,  7,  11, 4,  8,  12,
            13, 17, 21, 14, 18, 22, 15, 19, 23, 16, 20, 24,
          ],
          [
            1,  5,  9,  2,  6,  10, 3,  7,  11, 4,  8,  12,
            13, 17, 21, 14, 18, 22, 15, 19, 23, 16, 20, 24,
          ],
          [
            1,  2,  3,  4,  13, 14, 15, 16, 5,  6,  7,  8,
            17, 18, 19, 20, 9,  10, 11, 12, 21, 22, 23, 24,
          ],
          [
            1, 13, 2, 14, 3, 15, 4,  16, 5,  17, 6,  18,
            7, 19, 8, 20, 9, 21, 10, 22, 11, 23, 12, 24,
          ],
          [
            1,  2,  3,  4,  13, 14, 15, 16, 5,  6,  7,  8,
            17, 18, 19, 20, 9,  10, 11, 12, 21, 22, 23, 24,
          ],
          [
            1,  2,  3,  4,  13, 14, 15, 16, 5,  6,  7,  8,
            17, 18, 19, 20, 9,  10, 11, 12, 21, 22, 23, 24,
          ],
          [
            1, 13, 2, 14, 3, 15, 4,  16, 5,  17, 6,  18,
            7, 19, 8, 20, 9, 21, 10, 22, 11, 23, 12, 24,
          ],
          [
            1, 13, 2, 14, 3, 15, 4,  16, 5,  17, 6,  18,
            7, 19, 8, 20, 9, 21, 10, 22, 11, 23, 12, 24,
          ],
          [
            1, 5, 9,  13, 17, 21, 2, 6, 10, 14, 18, 22,
            3, 7, 11, 15, 19, 23, 4, 8, 12, 16, 20, 24,
          ],
          [
            1, 13, 5, 17, 9,  21, 2, 14, 6, 18, 10, 22,
            3, 15, 7, 19, 11, 23, 4, 16, 8, 20, 12, 24,
          ],
          [
            1, 5, 9,  13, 17, 21, 2, 6, 10, 14, 18, 22,
            3, 7, 11, 15, 19, 23, 4, 8, 12, 16, 20, 24,
          ],
          [
            1, 5, 9,  13, 17, 21, 2, 6, 10, 14, 18, 22,
            3, 7, 11, 15, 19, 23, 4, 8, 12, 16, 20, 24,
          ],
          [
            1, 13, 5, 17, 9,  21, 2, 14, 6, 18, 10, 22,
            3, 15, 7, 19, 11, 23, 4, 16, 8, 20, 12, 24,
          ],
          [
            1, 13, 5, 17, 9,  21, 2, 14, 6, 18, 10, 22,
            3, 15, 7, 19, 11, 23, 4, 16, 8, 20, 12, 24,
          ],
        ];
        for (let i = 0; i < permutations4D.length; ++i) {
          await testTranspose(operandType, isSync, inputShape4D, inputData, expectedShapes4D[i], expecteds4D[i], permutations4D[i]);
        }
        // transpose 5D
        const permutations5D = [
          [0, 2, 3, 4, 1], [1, 3, 4, 2, 0], [2, 0, 4, 1, 3], [3, 4, 0, 2, 1], [4, 1, 0, 3, 2],
        ];
        const inputShape5D = [1, 2, 1, 3, 4];
        const expectedShapes5D = [
          [1, 1, 3, 4, 2], [2, 3, 4, 1, 1], [1, 1, 4, 2, 3], [3, 4, 1, 1, 2], [4, 2, 1, 3, 1],
        ];
        const expecteds5D = [
          [
            1, 13, 2, 14, 3, 15, 4,  16, 5,  17, 6,  18,
            7, 19, 8, 20, 9, 21, 10, 22, 11, 23, 12, 24,
          ],
          [
            1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          ],
          [
            1, 5, 9,  13, 17, 21, 2, 6, 10, 14, 18, 22,
            3, 7, 11, 15, 19, 23, 4, 8, 12, 16, 20, 24,
          ],
          [
            1, 13, 2, 14, 3, 15, 4,  16, 5,  17, 6,  18,
            7, 19, 8, 20, 9, 21, 10, 22, 11, 23, 12, 24,
          ],
          [
            1, 5, 9,  13, 17, 21, 2, 6, 10, 14, 18, 22,
            3, 7, 11, 15, 19, 23, 4, 8, 12, 16, 20, 24,
          ],
        ];
        for (let i = 0; i < permutations5D.length; ++i) {
          await testTranspose(operandType, isSync, inputShape5D, inputData, expectedShapes5D[i], expecteds5D[i], permutations5D[i]);
        }
      }, `test transpose with specified permutations options / ${deviceType} / ${executionType} / ${operandType}`);
    });
  });
});
