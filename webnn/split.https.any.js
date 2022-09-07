// META: title=test WebNN API split operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-split

const testSplit = async (operandType, syncFlag, inputShape, inputValue, expectedArray, splits, axis = undefined) => {
  const input = builder.input('input', {type: operandType, dimensions: inputShape});
  const splittedOperands = builder.split(input, splits, {axis});
  const namedOperands = {};
  for (let i = 0; i < splittedOperands.length; ++i) {
    namedOperands[`split${i}`] = splittedOperands[i];
  }

  const TestTypedArray = TypedArrayDict[operandType];
  const inputs = {'input': new TestTypedArray(inputValue)};
  const outputs = {};
  for (let i = 0; i < splittedOperands.length; ++i) {
    outputs[`split${i}`] = new TestTypedArray(sizeOfShape(expectedArray[i].shape));
  }

  let graph;

  if (syncFlag) {
    graph = builder.build(namedOperands);
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync(namedOperands);
    await context.computeAsync(graph, inputs, outputs);
  }

  for (let i = 0; i < splittedOperands.length; ++i) {
    assert_array_approx_equals_ulp(outputs[`split${i}`], expectedArray[i].value, PrecisionMetrics.ULP[operandType].split, operandType);
  }
};

const inputData1 = [
  1, 2, 3, 4, 5, 6,
];
const inputData2 = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];
const inputData3 = [
  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
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
        // split 1D to three 1D
        await testSplit(
          operandType,
          isSync,
          [6],
          inputData1,
          [
            {shape: [2], value: [1, 2]},
            {shape: [2], value: [3, 4]},
            {shape: [2], value: [5, 6]},
          ],
          3);
        // split 2D to two 2D
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 4,  5,  6]},
            {shape: [2, 3], value: [7, 8, 9, 10, 11, 12]},
          ],
          2);
        // split 3D to three 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [1, 2, 2], value: [1, 2,  3,  4]},
            {shape: [1, 2, 2], value: [5, 6,  7,  8]},
            {shape: [1, 2, 2], value: [9, 10, 11, 12]},
          ],
          3);
        // split 4D to three 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          3);
        // split 5D to three 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 1, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 1, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 1, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          3);
      }, `test split with a number splits and default axis options / ${deviceType} / ${executionType} / ${operandType}`);

      promise_test(async () => {
        // split 1D to three 1D
        await testSplit(
          operandType,
          isSync,
          [6],
          inputData1,
          [
            {shape: [2], value: [1, 2]},
            {shape: [2], value: [3, 4]},
            {shape: [2], value: [5, 6]},
          ],
          3, 0);
        // split 2D to two 2D
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 7,  8,  9]},
            {shape: [2, 3], value: [4, 5, 6, 10, 11, 12]},
          ],
          2, 1);
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 4,  5,  6]},
            {shape: [2, 3], value: [7, 8, 9, 10, 11, 12]},
          ],
          2, 0);
        // split 3D to two 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 2, 1], value: [1, 3, 5, 7, 9, 11]},
            {shape: [3, 2, 1], value: [2, 4, 6, 8, 10, 12]},
          ],
          2, 2);
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 1, 2], value: [1, 2, 5, 6, 9, 10]},
            {shape: [3, 1, 2], value: [3, 4, 7, 8, 11, 12]},
          ],
          2, 1);
        // split 3D to three 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          [
            {shape: [1, 2, 2], value: [1, 2,  3,  4]},
            {shape: [1, 2, 2], value: [5, 6,  7,  8]},
            {shape: [1, 2, 2], value: [9, 10, 11, 12]},
          ],
          3, 0);
        // split 4D to two 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {
              shape: [3, 2, 1, 3],
              value: [
                1, 2, 3, 7, 8, 9, 13, 14, 15, 19, 20, 21, 25, 26, 27, 31, 32, 33,
              ],
            },
            {
              shape: [3, 2, 1, 3],
              value: [
                4, 5, 6, 10, 11, 12, 16, 17, 18, 22,23, 24, 28, 29, 30, 34, 35, 36,
              ],
            },
          ],
          2, 2);
        // split 4D to three 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          3, 0);
        // split 5D to two 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                1,  2,  3,  4,  5,  6,
                13, 14, 15, 16, 17, 18,
                25, 26, 27, 28, 29, 30,
              ],
            },
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                7,  8,  9,  10, 11, 12,
                19, 20, 21, 22, 23, 24,
                31, 32, 33, 34, 35, 36,
              ],
            },
          ],
          2, 1);
        // split 5D to three 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 1, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 1, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 1, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          3, 0);
      }, `test split with a number splits and specified non-negative axis options / ${deviceType} / ${executionType} / ${operandType}`);

      promise_test(async () => {
        // split 1D to three 1D
        await testSplit(
          operandType,
          isSync,
          [6],
          inputData1,
          [
            {shape: [2], value: [1, 2]},
            {shape: [2], value: [3, 4]},
            {shape: [2], value: [5, 6]},
          ],
          3, -1);
        // split 2D to two 2D
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 7,  8,  9]},
            {shape: [2, 3], value: [4, 5, 6, 10, 11, 12]},
          ],
          2, -1);
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 4,  5,  6]},
            {shape: [2, 3], value: [7, 8, 9, 10, 11, 12]},
          ],
          2, -2);
        // split 3D to two 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 2, 1], value: [1, 3, 5, 7, 9, 11]},
            {shape: [3, 2, 1], value: [2, 4, 6, 8, 10, 12]},
          ],
          2, -1);
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 1, 2], value: [1, 2, 5, 6, 9, 10]},
            {shape: [3, 1, 2], value: [3, 4, 7, 8, 11, 12]},
          ],
          2, -2);
        // split 3D to three 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [1, 2, 2], value: [1, 2,  3,  4]},
            {shape: [1, 2, 2], value: [5, 6,  7,  8]},
            {shape: [1, 2, 2], value: [9, 10, 11, 12]},
          ],
          3, -3);
        // split 4D to two 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {
              shape: [3, 2, 1, 3],
              value: [
                1, 2, 3, 7, 8, 9, 13, 14, 15, 19, 20, 21, 25, 26, 27, 31, 32, 33,
              ],
            },
            {
              shape: [3, 2, 1, 3],
              value: [
                4, 5, 6, 10, 11, 12, 16, 17, 18, 22,23, 24, 28, 29, 30, 34, 35, 36,
              ],
            },
          ],
          2, -2);
        // split 4D to three 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          3, -4);
        // split 5D to two 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                1,  2,  3,  4,  5,  6,
                13, 14, 15, 16, 17, 18,
                25, 26, 27, 28, 29, 30,
              ],
            },
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                7,  8,  9,  10, 11, 12,
                19, 20, 21, 22, 23, 24,
                31, 32, 33, 34, 35, 36,
              ],
            },
          ],
          2, -4);
        // split 5D to three 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 1, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 1, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 1, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          3, -5);
      }, `test split with a number splits and specified negative axis options / ${deviceType} / ${executionType} / ${operandType}`);

      promise_test(async () => {
        // split 1D to three 1D
        await testSplit(
          operandType,
          isSync,
          [6],
          inputData1,
          [
            {shape: [2], value: [1, 2]},
            {shape: [4], value: [3, 4, 5, 6]},
          ],
          [2, 4]);
        // split 2D to two 2D
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 4,  5,  6]},
            {shape: [2, 3], value: [7, 8, 9, 10, 11, 12]},
          ],
          [1, 1]);
        // split 3D to two 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [1, 2, 2], value: [1, 2, 3, 4]},
            {shape: [2, 2, 2], value: [5, 6, 7, 8, 9, 10, 11, 12]},
          ],
          [1, 2]);
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [2, 2, 2], value: [1, 2, 3, 4, 5, 6, 7, 8]},
            {shape: [1, 2, 2], value: [9, 10, 11, 12]},
          ],
          [2, 1]);
        // split 3D to three 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [1, 2, 2], value: [1, 2,  3,  4]},
            {shape: [1, 2, 2], value: [5, 6,  7,  8]},
            {shape: [1, 2, 2], value: [9, 10, 11, 12]},
          ],
          [1, 1, 1]);
        // split 4D to two 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 2, 3], value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]},
            {
              shape: [2, 2, 2, 3],
              value:
              [
                13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
                25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
              ],
            },
          ],
          [1, 2]);
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {
              shape: [2, 2, 2, 3],
              value:
              [
                1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
                13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
              ],
            },
            {shape: [1, 2, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          [2, 1]);
        // split 4D to three 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          [1, 1, 1]);
        // split 5D to three 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 1, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 1, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 1, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          [1, 1, 1]);
      }, `test split with an array splits and default axis options / ${deviceType} / ${executionType} / ${operandType}`);

      promise_test(async () => {
        // split 1D to three 1D
        await testSplit(
          operandType,
          isSync,
          [6],
          inputData1,
          [
            {shape: [2], value: [1, 2]},
            {shape: [2], value: [3, 4]},
            {shape: [2], value: [5, 6]},
          ],
          [2, 2, 2], 0);
        // split 2D to two 2D
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 7,  8,  9]},
            {shape: [2, 3], value: [4, 5, 6, 10, 11, 12]},
          ],
          [3, 3], 1);
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 4,  5,  6]},
            {shape: [2, 3], value: [7, 8, 9, 10, 11, 12]},
          ],
          [1, 1], 0);
        // split 3D to two 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 2, 1], value: [1, 3, 5, 7, 9,  11]},
            {shape: [3, 2, 1], value: [2, 4, 6, 8, 10, 12]},
          ],
          [1, 1], 2);
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 1, 2], value: [1, 2, 5, 6, 9,  10]},
            {shape: [3, 1, 2], value: [3, 4, 7, 8, 11, 12]},
          ],
          [1, 1], 1);
        // split 3D to three 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [1, 2, 2], value: [1, 2, 3, 4]},
            {shape: [1, 2, 2], value: [5, 6, 7, 8]},
            {shape: [1, 2, 2], value: [9, 10, 11, 12]},
          ],
          [1, 1, 1], 0);
        // split 4D to two 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {
              shape: [3, 2, 1, 3],
              value: [
                1, 2, 3, 7, 8, 9, 13, 14, 15, 19, 20, 21, 25, 26, 27, 31, 32, 33,
              ],
            },
            {
              shape: [3, 2, 1, 3],
              value: [
                4, 5, 6, 10, 11, 12, 16, 17, 18, 22,23, 24, 28, 29, 30, 34, 35, 36,
              ],
            },
          ],
          [1, 1], 2);
        // split 4D to three 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          [1, 1, 1], 0);
        // split 5D to two 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                1,  2,  3,  4,  5,  6,
                13, 14, 15, 16, 17, 18,
                25, 26, 27, 28, 29, 30,
              ],
            },
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                7,  8,  9,  10, 11, 12,
                19, 20, 21, 22, 23, 24,
                31, 32, 33, 34, 35, 36,
              ],
            },
          ],
          [1, 1], 1);
        // split 5D to three 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 1, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 1, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 1, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          [1, 1, 1], 0);
      }, `test split with an array splits and specified non-negative axis options / ${deviceType} / ${executionType} / ${operandType}`);

      promise_test(async () => {
        // split 1D to three 1D
        await testSplit(
          operandType,
          isSync,
          [6],
          inputData1,
          [
            {shape: [2], value: [1, 2]},
            {shape: [2], value: [3, 4]},
            {shape: [2], value: [5, 6]},
          ],
          [2, 2, 2], -1);
        // split 2D to two 2D
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 7,  8,  9]},
            {shape: [2, 3], value: [4, 5, 6, 10, 11, 12]},
          ],
          [3, 3], -1);
        await testSplit(
          operandType,
          isSync,
          [2, 6],
          inputData2,
          [
            {shape: [2, 3], value: [1, 2, 3, 4,  5,  6]},
            {shape: [2, 3], value: [7, 8, 9, 10, 11, 12]},
          ],
          [1, 1], -2);
        // split 3D to two 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 2, 1], value: [1, 3, 5, 7, 9,  11]},
            {shape: [3, 2, 1], value: [2, 4, 6, 8, 10, 12]},
          ],
          [1, 1], -1);
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [3, 1, 2], value: [1, 2, 5, 6, 9, 10]},
            {shape: [3, 1, 2], value: [3, 4, 7, 8, 11, 12]},
          ],
          [1, 1], -2);
        // split 3D to three 3D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2],
          inputData2,
          [
            {shape: [1, 2, 2], value: [1, 2,  3,  4]},
            {shape: [1, 2, 2], value: [5, 6,  7,  8]},
            {shape: [1, 2, 2], value: [9, 10, 11, 12]},
          ],
          [1, 1, 1], -3);
        // split 4D to two 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {
              shape: [3, 2, 1, 3],
              value: [
                1, 2, 3, 7, 8, 9, 13, 14, 15, 19, 20, 21, 25, 26, 27, 31, 32, 33,
              ],
            },
            {
              shape: [3, 2, 1, 3],
              value: [
                4, 5, 6, 10, 11, 12, 16, 17, 18, 22,23, 24, 28, 29, 30, 34, 35, 36,
              ],
            },
          ],
          [1, 1], -2);
        // split 4D to three 4D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          [1, 1, 1], -4);
        // split 5D to two 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                1,  2,  3,  4,  5,  6,
                13, 14, 15, 16, 17, 18,
                25, 26, 27, 28, 29, 30,
              ],
            },
            {
              shape: [3, 1, 1, 2, 3],
              value: [
                7,  8,  9,  10, 11, 12,
                19, 20, 21, 22, 23, 24,
                31, 32, 33, 34, 35, 36,
              ],
            },
          ],
          [1, 1], -4);
        // split 5D to three 5D
        await testSplit(
          operandType,
          isSync,
          [3, 2, 1, 2, 3],
          inputData3,
          [
            {shape: [1, 2, 1, 2, 3], value: [1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12]},
            {shape: [1, 2, 1, 2, 3], value: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]},
            {shape: [1, 2, 1, 2, 3], value: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]},
          ],
          [1, 1, 1], -5);
      }, `test split with an array splits and specified negative axis options / ${deviceType} / ${executionType} / ${operandType}`);
    });
  });
});