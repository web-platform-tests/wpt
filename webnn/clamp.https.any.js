// META: title=test WebNN API clamp operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-clamp

const inputData = [
  0.58585083,  1.1363881,   0.67161655,  -0.9741674,  -1.6196846,
  0.572627,    1.9026182,   -0.7756641,  -0.18808974, -1.0357478,
  1.1778295,   -2.305167,   -2.2636602,  0.3750199,   -0.08234365,
  -0.47962302, -0.3010948,  0.5369879,   -0.413804,   -1.096925,
  -0.9273629,  0.88833886,  -0.52474195, -1.3852776,  0.10217833,
  0.50499475,  1.3289608,   0.21790339,  -0.65971124, 0.47400787,
  0.7271749,   -0.03890531, -0.04459939, 0.2601329,   -0.06985649,
  0.2501139,   -1.0219133,  -1.1504377,  -0.83611137, 0.64221096,
  0.25879756,  1.040239,    -0.18669093, -1.1436414,  1.1445535,
  -0.01876706, 1.283455,    0.59794647,  2.1886187,   -0.21977298,
  0.90072393,  0.8913641,   -0.55512637, -0.17248231, -1.4617383,
  -1.5487962,  0.1265688,   0.7930071,   0.63802403,  0.3400246,
];
// expected data by clamping input data within a range [-1, 1]
const expected = [
  0.58585083,  1.,          0.67161655,  -0.9741674,  -1.,
  0.572627,    1.,          -0.7756641,  -0.18808974, -1.,
  1.,          -1.,         -1.,         0.3750199,   -0.08234365,
  -0.47962302, -0.3010948,  0.5369879,   -0.413804,   -1.,
  -0.9273629,  0.88833886,  -0.52474195, -1.,         0.10217833,
  0.50499475,  1.,          0.21790339,  -0.65971124, 0.47400787,
  0.7271749,   -0.03890531, -0.04459939, 0.2601329,   -0.06985649,
  0.2501139,   -1.,         -1.,         -0.83611137, 0.64221096,
  0.25879756,  1.,          -0.18669093, -1.,         1.,
  -0.01876706, 1.,          0.59794647,  1.,          -0.21977298,
  0.90072393,  0.8913641,   -0.55512637, -0.17248231, -1.,
  -1.,         0.1265688,   0.7930071,   0.63802403,  0.3400246,
];
// expected data by clamping input data with specified minValu=0.
const expectedByDefaultMaxValue = [
  0.58585083,  1.1363881,   0.67161655,  0.,          0.,
  0.572627,    1.9026182,   0.,          0.,          0.,
  1.1778295,   0.,          0.,          0.3750199,   0.,
  0.,          0.,          0.5369879,   0.,          0.,
  0.,          0.88833886,  0.,          0.,          0.10217833,
  0.50499475,  1.3289608,   0.21790339,  0.,          0.47400787,
  0.7271749,   0.,          0.,          0.2601329,   0.,
  0.2501139,   0.,          0.,          0.,          0.64221096,
  0.25879756,  1.040239,    0.,          0.,          1.1445535,
  0.,          1.283455,    0.59794647,  2.1886187,   0.,
  0.90072393,  0.8913641,   0.,          0.,          0.,
  0.,          0.1265688,   0.7930071,   0.63802403,  0.3400246,
];
// expected data by clamping input data with specified maxValu=0.
const expectedByDefaultMinValue = [
  0.,          0.,          0.,          -0.9741674,  -1.6196846,
  0.,          0.,          -0.7756641,  -0.18808974, -1.0357478,
  0.,          -2.305167,   -2.2636602,  0.,          -0.08234365,
  -0.47962302, -0.3010948,  0.,          -0.413804,   -1.096925,
  -0.9273629,  0.,          -0.52474195, -1.3852776,  0.,
  0.,          0.,          0.,          -0.65971124, 0.,
  0.,          -0.03890531, -0.04459939, 0.,          -0.06985649,
  0.,          -1.0219133,  -1.1504377,  -0.83611137, 0.,
  0.,          0.,          -0.18669093, -1.1436414,  0.,
  -0.01876706, 0.,          0.,          0.,          -0.21977298,
  0.,          0.,          -0.55512637, -0.17248231, -1.4617383,
  -1.5487962,  0.,          0.,          0.,          0.,
];
let context;
let builder;

const testClamp = async (syncFlag, inputShape, inputValue, expected, options = {}) => {
  const x = builder.input('x', {type: 'float32', dimensions: inputShape});
  const y = builder.clamp(x, options);
  const inputs = {'x': new Float32Array(inputValue)};
  const outputs = {'y': new Float32Array(sizeOfShape(inputShape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.clamp, 'float32');
};

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
      // clamp 1D
      await testClamp(isSync, [60], inputData, inputData);
      // clamp 2D
      await testClamp(isSync, [3, 20], inputData, inputData);
      // clamp 3D
      await testClamp(isSync, [3, 4, 5], inputData, inputData);
      // clamp 4D
      await testClamp(isSync, [3, 2, 2, 5], inputData, inputData);
      // clamp 5D
      await testClamp(isSync, [3, 2, 2, 1, 5], inputData, inputData);
    }, `test clamp with default options / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // clamp 1D
      await testClamp(isSync, [60], inputData, expectedByDefaultMaxValue, {minValue: 0.});
      // clamp 2D
      await testClamp(isSync, [3, 20], inputData, expectedByDefaultMaxValue, {minValue: 0.});
      // clamp 3D
      await testClamp(isSync, [3, 4, 5], inputData, expectedByDefaultMaxValue, {minValue: 0.});
      // clamp 4D
      await testClamp(isSync, [3, 2, 2, 5], inputData, expectedByDefaultMaxValue, {minValue: 0.});
      // clamp 5D
      await testClamp(isSync, [3, 2, 2, 1, 5], inputData,expectedByDefaultMaxValue, {minValue: 0.});
    }, `test clamp with specified minValue and default maxValue options / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // clamp 1D
      await testClamp(isSync, [60], inputData, expectedByDefaultMinValue, {maxValue: 0.});
      // clamp 2D
      await testClamp(isSync, [3, 20], inputData, expectedByDefaultMinValue, {maxValue: 0.});
      // clamp 3D
      await testClamp(isSync, [3, 4, 5], inputData, expectedByDefaultMinValue, {maxValue: 0.});
      // clamp 4D
      await testClamp(isSync, [3, 2, 2, 5], inputData, expectedByDefaultMinValue, {maxValue: 0.});
      // clamp 5D
      await testClamp(isSync, [3, 2, 2, 1, 5], inputData,expectedByDefaultMinValue, {maxValue: 0.});
    }, `test clamp with specified maxValue and default minValue options / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // clamp 1D
      await testClamp(isSync, [3], [-2., 0., 2.], [-1., 0., 1.], {minValue: -1., maxValue: 1.});
      await testClamp(isSync, [3], [-1., 0., 1.], [-1., 0., 1.], {minValue: -5., maxValue: 5.});
      await testClamp(isSync, [3], [-6., 0., 6.], [-5., 0., 5.], {minValue: -5., maxValue: 5.});
      await testClamp(isSync, [3], [-1., 0., 6.], [-1., 0., 5.], {minValue: -5., maxValue: 5.});
      await testClamp(isSync, [60], inputData, expected, {minValue: -1., maxValue: 1.});
      // clamp 2D
      await testClamp(isSync, [3, 20], inputData, expected, {minValue: -1., maxValue: 1.});
      // clamp 3D
      await testClamp(isSync, [3, 4, 5], inputData, expected, {minValue: -1., maxValue: 1.});
      // clamp 4D
      await testClamp(isSync, [3, 2, 2, 5], inputData, expected, {minValue: -1., maxValue: 1.});
      // clamp 5D
      await testClamp(isSync, [3, 2, 2, 1, 5], inputData, expected, {minValue: -1., maxValue: 1.});
    }, `test clamp with specified minValue and maxValue options / ${deviceType} / ${executionType}`);
  });
});