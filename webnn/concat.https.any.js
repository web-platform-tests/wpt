// META: title=test WebNN API concat operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: script=./webnn-polyfill.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-concat

const perpare = (operandType, inputShapeValues, axis, expectedShapeValue) => {
  const TestTypedArray = TypedArrayDict[operandType];
  const inputOperands = [];
  const inputs = {};
  for (let i = 0; i < inputShapeValues.length; i++) {
    inputOperands.push(builder.input('input' + i, {type: operandType, dimensions: inputShapeValues[i].shape}));
    inputs['input' + i] = new TestTypedArray(inputShapeValues[i].data);
  }
  const outputOperand = builder.concat(inputOperands, axis);
  const outputs = {'outputOperand': new TestTypedArray(sizeOfShape(expectedShapeValue.shape))};
  return [outputOperand, inputs, outputs];
};

const testConcatSync = (operandType, inputShapeValues, axis, expectedShapeValue) => {
  const [outputOperand, inputs, outputs] = perpare(operandType, inputShapeValues, axis, expectedShapeValue);
  buildAndComputeSync(context, builder, {outputOperand}, inputs, outputs);
  assert_array_approx_equals_ulp(outputs.outputOperand, expectedShapeValue.data, PrecisionMetrics.concat.ULP[operandType], operandType);
};

const testConcat = async (operandType, inputShapeValues, axis, expectedShapeValue) => {
  const [outputOperand, inputs, outputs] = perpare(operandType, inputShapeValues, axis, expectedShapeValue);
  await buildAndCompute(context, builder, {outputOperand}, inputs, outputs);
  assert_array_approx_equals_ulp(outputs.outputOperand, expectedShapeValue.data, PrecisionMetrics.concat.ULP[operandType], operandType);
};

const testsDict = loadTestData('/webnn/resources/test_data/concat.json');
const tests = testsDict.tests;
const inputsData = testsDict.inputsData;
const expectedData = testsDict.expectedData;
const targetTests = [];
for (const test of tests) {
  const inputShapeValues = [];
  const inputShapes = test.inputs.shape;
  const inputDataSource = test.inputs.data;
  const expectedDataSource = test.expected.data;
  let position = 0;
  for (const shape of inputShapes) {
    const size = sizeOfShape(shape);
    inputShapeValues.push({shape, data: inputsData[inputDataSource].slice(position, position + size)});
    position += size;
  }
  const expectedShapeValue = {shape: test.expected.shape, data: expectedData[expectedDataSource]};
  targetTests.push({name: test.name, operandType: test.type, inputShapeValues, axis: test.axis, expectedShapeValue});
}
let context;
let builder;

ExecutionArray.forEach(executionType => {
  const isSync = executionType === 'sync';
  if (self.GLOBAL.isWindow() && isSync) {
    return;
  }
  if (isSync) {
    DeviceTypeArray.forEach(deviceType => {
      setup(() => {
        [context, builder] = createContextAndBuilderSync({deviceType});
      });
      for (const subTest of targetTests) {
        test(() => {
          testConcatSync(subTest.operandType, subTest.inputShapeValues, subTest.axis, subTest.expectedShapeValue);
        }, `${subTest.name} / ${subTest.operandType} / ${deviceType} / ${executionType}`);
      }
    });
  } else {
    DeviceTypeArray.forEach(deviceType => {
      promise_setup(async () => {
        [context, builder] = await createContextAndBuilder({deviceType});
      });
      for (const subTest of targetTests) {
        promise_test(async () => {
          await testConcat(subTest.operandType, subTest.inputShapeValues, subTest.axis, subTest.expectedShapeValue);
        }, `${subTest.name} / ${subTest.operandType} / ${deviceType} / ${executionType}`);
      }
    });
  }
});