// META: title=test WebNN API slice operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-slice

const inputShape = [1, 3, 4, 5];
const inputData = [
  1.3165863e+00,  4.1239005e-02,  4.6697399e-01,  -6.6145003e-02,
  -3.7128052e-01, -1.0660021e+00, 7.5784922e-01,  3.5759725e-02,
  1.9211160e+00,  -8.1603736e-01, 1.1800343e-01,  -1.8293047e+00,
  -2.1316205e-01, -3.6369815e-01, 6.4205879e-01,  7.1544610e-02,
  6.8498695e-01,  1.0001093e+00,  -5.6261641e-01, -7.3343945e-01,
  1.6827687e+00,  1.2653192e+00,  5.8872145e-01,  3.1535852e-01,
  3.5038650e-01,  3.5865438e-01,  -3.6469769e-01, -8.7751287e-01,
  2.7995768e-01,  -1.6042528e+00, 8.6336482e-01,  -1.7991974e+00,
  -6.8652731e-01, 1.3729302e-03,  -7.7775210e-01, 1.0199220e-01,
  4.2299256e-01,  1.1432177e-01,  -5.0116669e-02, 1.5525131e+00,
  -8.7060851e-01, 4.5739245e-01,  1.3543987e-01,  -1.5927458e-02,
  9.1792661e-01,  -4.5001405e-01, 1.9954188e-01,  -5.1338053e-01,
  -4.1026011e-01, -1.2718531e+00, 4.2538303e-01,  -1.5449624e-01,
  -3.4380481e-01, 7.8374326e-01,  1.7837452e+00,  9.6105379e-01,
  -4.8783422e-01, -9.4987392e-01, -8.8750905e-01, -9.8019439e-01,
];
const expectedData1 = [
  4.1239005e-02,  4.6697399e-01,  -6.6145003e-02, -3.7128052e-01,
  7.5784922e-01,  3.5759725e-02,  1.9211160e+00,  -8.1603736e-01,
  -1.8293047e+00, -2.1316205e-01, -3.6369815e-01, 6.4205879e-01,
  1.2653192e+00,  5.8872145e-01,  3.1535852e-01,  3.5038650e-01,
  -3.6469769e-01, -8.7751287e-01, 2.7995768e-01,  -1.6042528e+00,
  -1.7991974e+00, -6.8652731e-01, 1.3729302e-03,  -7.7775210e-01,
];
const expectedData2 = [
  4.1239005e-02,  4.6697399e-01,  -6.6145003e-02, -3.7128052e-01,
  7.5784922e-01,  3.5759725e-02,  1.9211160e+00,  -8.1603736e-01,
  -1.8293047e+00, -2.1316205e-01, -3.6369815e-01, 6.4205879e-01,
  6.8498695e-01,  1.0001093e+00,  -5.6261641e-01, -7.3343945e-01,
  1.2653192e+00,  5.8872145e-01,  3.1535852e-01,  3.5038650e-01,
  -3.6469769e-01, -8.7751287e-01, 2.7995768e-01,  -1.6042528e+00,
  -1.7991974e+00, -6.8652731e-01, 1.3729302e-03,  -7.7775210e-01,
  4.2299256e-01,  1.1432177e-01,  -5.0116669e-02, 1.5525131e+00,
];
let context;
let builder;

const testSlice = async (syncFlag, inputShape, inputData, starts, sizes, axes, expectedShape, expected) => {
  const x = builder.input('x', {type: 'float32', dimensions: inputShape});
  const y = builder.slice(x, starts, sizes, {axes});
  const inputs = {'x': new Float32Array(inputData)};
  const outputs = {'y': new Float32Array(sizeOfShape(expectedShape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.slice, 'float32');
};

const tests = [
  {
    starts: [0, 0, 0, 1],
    sizes: [1, 2, 3, 4],
    axes: undefined,
    expectedShape: [1, 2, 3, 4],
    expected: expectedData1,
    name:'default axes options',
  },
  {
    starts: [-1, -3, -4, -4],
    sizes: [1, 2, 3, 4],
    axes: undefined,
    expectedShape: [1, 2, 3, 4],
    expected: expectedData1,
    name:'negative starts',
  },
  {
    starts: [0, 0, 1],
    sizes: [1, 2, 4],
    axes: [0, 1, 3],
    expectedShape: [1, 2, 4, 4],
    expected: expectedData2,
    name: 'axes options',
  },
  {
    starts: [0, 0, 1],
    sizes: [1, 2, 4],
    axes: [-4, -3, -1],
    expectedShape: [1, 2, 4, 4],
    expected: expectedData2,
    name: 'negative axes options',
  },
  {
    starts: [0, 0, -4, 1],
    sizes: [1, 2, -1, 4],
    axes: [0, 1, 2, 3],
    expectedShape: [1, 2, 4, 4],
    expected: expectedData2,
    name: 'sizes having special value of -1',
  }
];

for (let i = 0; i < tests.length; i++) {
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
        await testSlice(isSync, inputShape, inputData, tests[i].starts, tests[i].sizes, tests[i].axes, tests[i].expectedShape, tests[i].expected, true);
      }, `test slice with ${tests[i].name} / ${deviceType} / ${executionType}`);
    });
  });
}
