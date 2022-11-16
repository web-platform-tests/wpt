// META: title=test WebNN API concat operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-concat

const concatTests = () => {
  const resources = loadTestData('/webnn/resources/test_data/concat.json');
  const tests = resources.tests;
  const inputsData = resources.inputsData;
  const expectedData = resources.expectedData;
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
    const expected = {shape: test.expected.shape, data: {outputOperand: expectedData[expectedDataSource]}};
    targetTests.push({name: test.name, operandType: test.type, inputShapeValues, axis: test.axis, expected});
  }
  return targetTests;
};

const buildGraph = (builder, resources) => {
  const inputShapeValues = resources.inputShapeValues;
  const operandType = resources.operandType;
  const TestTypedArray = TypedArrayDict[operandType];
  const inputOperands = [];
  const inputs = {};
  for (let i = 0; i < inputShapeValues.length; i++) {
    inputOperands.push(builder.input('input' + i, {type: operandType, dimensions: inputShapeValues[i].shape}));
    inputs['input' + i] = new TestTypedArray(inputShapeValues[i].data);
  }
  const outputOperand = builder.concat(inputOperands, resources.axis);
  const outputs = {'outputOperand': new TestTypedArray(sizeOfShape(resources.expected.shape))};
  return [{outputOperand}, inputs, outputs];
};

testWebNNOperation('concat', concatTests(), buildGraph);