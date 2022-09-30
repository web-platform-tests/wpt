// META: title=test WebNN API tanh operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-tanh

let context;
let builder;

async function testTanh(syncFlag, input, expected, shape) {
  const x = builder.input('x', {type: 'float32', dimensions: shape});
  const y = builder.tanh(x);
  const inputs = {'x': new Float32Array(input)};
  const outputs = {'y': new Float32Array(sizeOfShape(shape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.tanh, 'float32');
}

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
      await testTanh(isSync, [-1, 0, 1], [-0.7615941559557649, 0, 0.7615941559557649], [3]);
    }, `tanh 1D  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testTanh(isSync,
        [
          0.15102264,  -1.1556778,  -0.0657572,  -0.04362043, 1.13937,
          0.5458485,   -1.1451102,  0.3929889,   0.56226826,  -0.68606883,
          0.46685237,  -0.53841704, 0.7025275,   -1.5314125,  0.28699,
          0.84823394,  -0.18585628, -0.319641,   0.41442505,  0.88782656,
          1.0844846,   -0.56016934, 0.531165,    0.73836696,  1.0364187,
          -0.07221687, -0.9580888,  1.8173703,   -1.5682113,  -1.272829,
          2.331454,    0.2967249,   0.21472701,  -0.9332915,  2.3962052,
          0.498327,    0.53040606,  1.6241137,   0.8147571,   -0.6471784,
          0.8489049,   -0.33946696, -0.67703784, -0.07758674, 0.7667829,
          0.58996105,  0.7728692,   -0.47817922, 2.1541011,   -1.1611695,
          2.1465113,   0.64678246,  1.239878,    -0.10861816, 0.07814338,
          -1.026162,   -0.8464255,  0.53589034,  0.93667775,  1.2927296,
        ],
        [
          0.14988485243804905,
          -0.8196262968070427,
          -0.06566258539315876,
          -0.04359278490025841,
          0.81420184519224,
          0.4974022861162581,
          -0.8161277031478561,
          0.37393406888200575,
          0.5096584488637819,
          -0.5954506103157979,
          0.43565258419537356,
          -0.491788789926786,
          0.6059696311244674,
          -0.9106660002679733,
          0.279362062510579,
          0.6901457130337738,
          -0.18374545679834775,
          -0.30918227539202525,
          0.3922234692633119,
          0.7103185679032363,
          0.7948562387257937,
          -0.5081030654144844,
          0.48627111897365854,
          0.628157503380644,
          0.776469901729632,
          -0.07209158770240355,
          -0.7434231595576823,
          0.9485755721878665,
          -0.916740776910177,
          -0.854562546243227,
          0.9812985744347655,
          0.2883125958646078,
          0.21148657183129607,
          -0.7321248135617321,
          0.9835515078926846,
          0.4608004134276178,
          0.485691423797799,
          0.9252187290148373,
          0.6722061563570123,
          -0.569767419642911,
          0.6904969313562962,
          -0.3270014357504291,
          -0.5895903065238024,
          -0.07743143093124916,
          0.6450548687979449,
          0.5298675936947264,
          0.6485947437799567,
          -0.4447842241322541,
          0.9734419663341614,
          -0.8214206480085401,
          0.973041226248526,
          0.5694999552658558,
          0.8454207971475833,
          -0.10819301066972077,
          0.07798470962146853,
          -0.7723644708905993,
          -0.6891974525265244,
          0.4898708088154638,
          0.7336921191412772,
          0.8598397504927623,
        ],
        [3, 4, 5]);
    }, `tanh 3D  / ${deviceType} / ${executionType}`);
  });
});