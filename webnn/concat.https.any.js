// META: title=test WebNN API concat operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-concat

const testConcat = async (operandType, syncFlag, inputShapeValues, axis, expectedShapeValue) => {
  const TestTypedArray = TypedArrayDict[operandType];
  const inputOperands = [];
  const inputs = {};
  for (let i = 0; i < inputShapeValues.length; i++) {
    inputOperands.push(builder.input('input' + i, {type: operandType, dimensions: inputShapeValues[i].shape}));
    inputs['input' + i] = new TestTypedArray(inputShapeValues[i].data);
  }
  const outputOperand = builder.concat(inputOperands, axis);
  const outputs = {'outputOperand': new TestTypedArray(sizeOfShape(expectedShapeValue.shape))};
  await buildAndCompute(syncFlag, context, builder, {outputOperand}, inputs, outputs);
  assert_array_approx_equals_ulp(outputs.outputOperand, expectedShapeValue.data, PrecisionMetrics.concat.ULP[operandType], operandType);
};

const testsDict = loadTestData('/webnn/resources/test_data/concat.json');
const tests = testsDict.tests;
const inputsData = testsDict.inputsData;
const expectedData = testsDict.expectedData;
let context;
let builder;

ExecutionArray.forEach(executionType => {
  const isSync = executionType === 'sync';
  if (self.GLOBAL.isWindow() && isSync) {
    return;
  }

  DeviceTypeArray.forEach(deviceType => {
    promise_setup(async () => {
      [context, builder] = await createContextAndBuilder(isSync, {deviceType});
    });

    for (const test of tests) {
      const operandType = test.type;
      promise_test(async () => {
        const inputShapeValues = [];
        const inputShapes = test.inputs.shape;
        const inputDataCategory = test.inputs.data;
        const expectedDataCategory = test.expected.data;
        let position = 0;
        for (const shape of inputShapes) {
          const size = sizeOfShape(shape);
          inputShapeValues.push({shape, data: inputsData[inputDataCategory].slice(position, position + size)});
          position += size;
        }
        const expectedShapeValue = {shape: test.expected.shape, data: expectedData[expectedDataCategory]};
        await testConcat(operandType, isSync, inputShapeValues, test.axis, expectedShapeValue);
      }, `${test.name} / ${operandType} / ${deviceType} / ${executionType}`);
    }
  });
});