// META: title=test WebNN API concat operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-concat

const testConcat = async (operandType, syncFlag, inputShapeValues, axis, expectedShapeValue) => {
  const inputs = [];
  const namedInputs = {};
  const TestTypedArray = TypedArrayDict[operandType];
  for (let i = 0; i < inputShapeValues.length; i++) {
    inputs.push(builder.input('input' + i, {type: operandType, dimensions: inputShapeValues[i].shape}));
    namedInputs['input' + i] = new TestTypedArray(inputShapeValues[i].data);
  }
  const outputOperand = builder.concat(inputs, axis);
  const outputs = {'outputOperand': new TestTypedArray(sizeOfShape(expectedShapeValue.shape))};
  let graph;
  if (syncFlag) {
    graph = builder.buildSync({outputOperand});
    context.computeSync(graph, namedInputs, outputs);
  } else {
    graph = await builder.build({outputOperand});
    await context.compute(graph, namedInputs, outputs);
  }
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
      if (isSync) {
        context = navigator.ml.createContextSync({deviceType});
      } else {
        context = await navigator.ml.createContext({deviceType});
      }
      builder = new MLGraphBuilder(context);
    });

    for (const test of tests) {
      const operandType = test.type;
      promise_test(async () => {
        const inputShapeValues = [];
        const inputShapes = test.inputs.shape;
        const inputDataCategory = test.inputs.data;
        const expectedDataCategory = test.expected.data;
        let pos = 0;
        for (const shape of inputShapes) {
          const size = sizeOfShape(shape);
          inputShapeValues.push({shape, data: inputsData[inputDataCategory].slice(pos, pos + size)});
          pos += size;
        }
        const expectedShapeValue = {shape: test.expected.shape, data: expectedData[expectedDataCategory]};
        await testConcat(operandType, isSync, inputShapeValues, test.axis, expectedShapeValue);
      }, `${test.name} / ${operandType} / ${deviceType} / ${executionType}`);
    }
  });
});