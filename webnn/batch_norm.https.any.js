// META: title=test WebNN API batchNormalization operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-batchnorm

let context;
let builder;

async function testBatchNorm(syncFlag, input, mean, variance, expected, scale = undefined, bias = undefined, options = {}, activation = undefined) {
  const x = builder.input('input', {type: 'float32', dimensions: input.shape});
  const m = builder.constant({type: 'float32', dimensions: mean.shape}, mean.data);
  const v = builder.constant({type: 'float32', dimensions: variance.shape}, variance.data);

  if (scale !== undefined) {
    options.scale = builder.constant({type: 'float32', dimensions: scale.shape}, scale.data);
  }

  if (bias !== undefined) {
    options.bias = builder.constant({type: 'float32', dimensions: bias.shape}, bias.data);
  }

  if (activation !== undefined) {
    options.activation = createActivation(builder, activation);
  }

  const output = builder.batchNormalization(x, m, v, options);
  const inputs = {'input': input.data};
  const outputs = {'output': new Float32Array(sizeOfShape(input.shape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({output});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({output});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.output, expected, ULPTolerance.float32.batchNormalization, 'float32');
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
      const input = {
        shape: [1, 2, 1, 3],
        data: new Float32Array([-1, 0, 1, 2, 3, 4]),
      };
      const mean = {
        shape: [2],
        data: new Float32Array([0, 3]),
      };
      const variance = {
        shape: [2],
        data: new Float32Array([1.0, 1.5]),
      };
      const scale = {
        shape: [2],
        data: new Float32Array([1.0, 1.5]),
      };
      const bias = {
        shape: [2],
        data: new Float32Array([0, 1]),
      };
      let expected = [
        -0.9999950000374997,
        0,
        0.9999950000374997,
        -0.22474078892909666,
        1,
        2.224740788929097,
      ];
      await testBatchNorm(isSync, input, mean, variance, expected, scale, bias);

      expected = [
        0,
        0,
        0.9999950000374997,
        0,
        1,
        2.224740788929097,
      ];
      await testBatchNorm(isSync, input, mean, variance, expected, scale, bias, {}, 'relu');

      let expectedScale = [
        -0.9999950000374997,
        0,
        0.9999950000374997,
        -1.2247407889290967,
        0,
        1.2247407889290967,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedScale, scale);

      expectedScale = [
        0,
        0,
        0.9999950000374997,
        0,
        0,
        1.2247407889290967,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedScale, scale, undefined, {}, 'relu');

      let expectedBias = [
        -0.9999950000374997,
        0,
        0.9999950000374997,
        0.18350614071393556,
        1,
        1.8164938592860644,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedBias, undefined, bias);

      expectedBias = [
        0,
        0,
        0.9999950000374997,
        0.18350614071393556,
        1,
        1.8164938592860644,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedBias, undefined, bias, {}, 'relu');
    }, `batchNormalization nchw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [3, 1, 2],
        data: new Float32Array([-1, 0, 1, 2, 3, 4]),
      };
      const mean = {
        shape: [3],
        data: new Float32Array([0, 3, 6]),
      };
      const variance = {
        shape: [3],
        data: new Float32Array([1.0, 1.5, 2.0]),
      };
      const scale = {
        shape: [3],
        data: new Float32Array([1.0, 1.5, 2.0]),
      };
      const bias = {
        shape: [3],
        data: new Float32Array([0, 1, 2]),
      };
      const expected = [
        -0.9995003746877732,
        0,
        -1.4486736542238683,
        -0.22433682711193415,
        -2.241580424529414,
        -0.8277202830196093,
      ];
      await testBatchNorm(isSync, input, mean, variance, expected, scale, bias, {epsilon: 1e-3, axis: 0});
    }, `batchNormalization 3D input axis=0  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [2, 1, 3],
        data: new Float32Array([-1, 0, 1, 2, 3, 4]),
      };
      const mean = {
        shape: [3],
        data: new Float32Array([0, 3, 6]),
      };
      const variance = {
        shape: [3],
        data: new Float32Array([1.0, 1.5, 2.0]),
      };
      const scale = {
        shape: [3],
        data: new Float32Array([1.0, 1.5, 2.0]),
      };
      const bias = {
        shape: [3],
        data: new Float32Array([0, 1, 2]),
      };
      const expected = [
        -0.9995003746877732,
        -2.6730104813358024,
        -5.069300707549023,
        1.9990007493755464,
        1,
        -0.8277202830196093,
      ];
      await testBatchNorm(isSync, input, mean, variance, expected, scale, bias, {epsilon: 1e-3, axis: 2});
    }, `batchNormalization 3D input axis=2  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 3, 2],
        data: new Float32Array([-1, 2, 0, 3, 1, 4]),
      };
      const mean = {
        shape: [2],
        data: new Float32Array([0, 3]),
      };
      const variance = {
        shape: [2],
        data: new Float32Array([1.0, 1.5]),
      };
      const scale = {
        shape: [2],
        data: new Float32Array([1.0, 1.5]),
      };
      const bias = {
        shape: [2],
        data: new Float32Array([0, 1]),
      };
      let expected = [
        -0.9999950000374997,
        -0.22474078892909666,
        0,
        1,
        0.9999950000374997,
        2.224740788929097,
      ];
      await testBatchNorm(isSync, input, mean, variance, expected, scale, bias, {axis: 3});

      expected = [
        0,
        0,
        0,
        1,
        0.9999950000374997,
        2.224740788929097,
      ];
      await testBatchNorm(isSync, input, mean, variance, expected, scale, bias, {axis: 3}, 'relu');

      let expectedScale = [
        -0.9999950000374997,
        -1.2247407889290967,
        0,
        0,
        0.9999950000374997,
        1.2247407889290967,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedScale, scale, undefined, {axis: 3});

      expectedScale = [
        0,
        0,
        0,
        0,
        0.9999950000374997,
        1.2247407889290967,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedScale, scale, undefined, {axis: 3}, 'relu');

      let expectedBias = [
        -0.9999950000374997,
        0.18350614071393556,
        0,
        1,
        0.9999950000374997,
        1.8164938592860644,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedBias, undefined, bias, {axis: 3});

      expectedBias = [
        0,
        0.18350614071393556,
        0,
        1,
        0.9999950000374997,
        1.8164938592860644,
      ];
      await testBatchNorm(isSync, input, mean, variance, expectedBias, undefined, bias, {axis: 3}, 'relu');
    }, `batchNormalization nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 2, 1, 3],
        data: new Float32Array([-1, 0, 1, 2, 3, 4]),
      };
      const mean = {
        shape: [2],
        data: new Float32Array([0, 3]),
      };
      const variance = {
        shape: [2],
        data: new Float32Array([1.0, 1.5]),
      };

      const expected = [
        -0.9999950000374997,
        0,
        0.9999950000374997,
        -0.8164938592860644,
        0,
        0.8164938592860644,
      ];
    }, `batchNormalization without options  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [2, 3, 4, 5],
        data: new Float32Array([
          2.6973534,   -1.1874187,  -0.18637535, -1.7081367,  0.03293341,
          1.4802791,   -0.68332213, 1.618039,    -1.6412221,  -0.52998835,
          1.5229957,   -0.92798537, -0.35554567, 0.717948,    0.50108916,
          1.0521007,   -0.68065745, 1.3121722,   0.50907123,  1.5093223,
          -0.540522,   -0.80794656, -0.17974755, -1.8922086,  2.0955374,
          0.46592507,  -0.2936382,  -0.43420887, -0.11036888, -1.2171484,
          -1.9003569,  0.32063156,  0.38756344,  0.4720109,   -0.4177193,
          -0.7655141,  -1.2207903,  0.52860916,  0.22583283,  1.2220219,
          -0.0248001,  0.6148501,   1.0967597,   0.8798244,   -0.6854243,
          -0.8442876,  1.6188551,   -0.6460473,  0.76349306,  2.630077,
          -0.85050315, 0.37401453,  0.08842833,  -0.5043717,  -0.7495827,
          -0.98900026, 0.79681706,  -0.3573076,  0.8644746,   1.196009,
          0.35148722,  0.39926755,  -0.21630785, 1.731195,    1.8644739,
          -0.60227305, -1.0833911,  -0.6197943,  -0.05721893, -0.23889631,
          -0.24901256, 1.3885167,   -0.67789817, -0.3381054,  0.33224156,
          0.79065573,  1.1667213,   -0.47722074, 0.4234017,   0.2317288,
          -0.18525974, -0.17303231, 0.41841915,  0.13230574,  0.1261528,
          1.253214,    1.9984859,   -1.7275336,  0.6593169,   -1.3704892,
          0.63530993,  -0.33128706, -1.2268444,  0.87340677,  1.4801403,
          0.09598545,  0.30467814,  -0.15848571, -0.16779709, 1.1372787,
          0.3292992,   -0.2240395,  0.88280654,  1.3370756,   0.2533313,
          0.84305125,  -1.6560661,  -0.09365056, -1.301057,   -0.1476929,
          -1.2850751,  -1.286735,   -1.9894414,  -0.5574838,  -0.392564,
          -0.92764777, -0.79910755, 0.9099533,   0.9825949,   -0.8327678,
        ]),
      };
      const mean = {
        shape: [3],
        data: new Float32Array([0.3432895, 1.0855169, 1.8725895]),
      };
      const variance = {
        shape: [3],
        data: new Float32Array([0.601868, 0.86580527, 0.38809904]),
      };
      const scale = {
        shape: [3],
        data: new Float32Array([0.17215693, -0.7909758, 0.12456307]),
      };
      const bias = {
        shape: [3],
        data: new Float32Array([0.5280557, -1.4475446, 0.1760742]),
      };
      const expected = [
        1.0461560510143535,
        0.1911657558822769,
        0.411483017030364,
        0.07656216394941046,
        0.4597501628527534,
        0.7782930494872715,
        0.3021111766340805,
        0.8086122997615323,
        0.09128923985758142,
        0.33585804528975194,
        0.7876944448589689,
        0.24826382332973346,
        0.37425072177567253,
        0.6105134023421119,
        0.5627854536128674,
        0.6840562790509362,
        0.3026976397472274,
        0.7412947998229634,
        0.5645422085033447,
        0.7846850986217833,
        -0.07321674022185398,
        0.15281046195449766,
        -0.3781432568821488,
        1.069228592462868,
        -2.3012137908767087,
        -0.9238656685427483,
        -0.2818828948064065,
        -0.16307258341183895,
        -0.4367820994432674,
        0.4986678021352766,
        1.076115534527926,
        -0.8010636134148209,
        -0.857634429396731,
        -0.9290094112409543,
        -0.1770095657600239,
        0.11694655246443442,
        0.50174593552589,
        -0.9768462529874629,
        -0.7209397395575678,
        -1.5629186076568993,
        -0.1985106893011581,
        -0.07223019353030338,
        0.022908967224644028,
        -0.01991865517616051,
        -0.32893189685213553,
        -0.36029487662419535,
        0.12598165594057448,
        -0.32115804313963925,
        -0.04288492531707169,
        0.32561827430846624,
        -0.361521957824965,
        -0.1197762353807654,
        -0.17615699930660242,
        -0.2931882793427495,
        -0.34159812373655585,
        -0.38886422038289215,
        -0.03630606199291739,
        -0.2641547115300692,
        -0.022949030768919576,
        0.042502880912016094,
        0.5298599167884727,
        0.5403757765085855,
        0.4048952439640776,
        0.8335165359291996,
        0.8628495735212578,
        0.31994907678513007,
        0.21406094410345505,
        0.31609286635039624,
        0.439908747758301,
        0.39992380327596644,
        0.3976973417614982,
        0.7580972800988877,
        0.30330492315042945,
        0.37808910951390895,
        0.5256241850390062,
        0.6265154745180018,
        0.7092828555654802,
        0.34747154365875904,
        0.5456874044497102,
        0.5035025696328053,
        -0.3734843546348592,
        -0.38381897682777666,
        -0.8837136713424404,
        -0.6418906556574361,
        -0.6366901915962482,
        -1.5892821663854055,
        -2.2191858761181757,
        0.9300453045913626,
        -1.087320417271379,
        0.6282714256898352,
        -1.0670297294533582,
        -0.25006208339353875,
        0.5068628600323595,
        -1.268269146626674,
        -1.7810802446517826,
        -0.6111927514300393,
        -0.7875797849745898,
        -0.39611376119305164,
        -0.38824378406828464,
        -1.4912936664044165,
        -0.12860398848856922,
        -0.2378447662843086,
        -0.019329917585430262,
        0.07035241521171431,
        -0.14360166077049882,
        -0.027178453755221377,
        -0.520557144088695,
        -0.2121032281964033,
        -0.45047082948867634,
        -0.22277233060240123,
        -0.44731566396952194,
        -0.44764336338231037,
        -0.5863724884155747,
        -0.30367373267244635,
        -0.2711150715379228,
        -0.37675193955506403,
        -0.3513753779467118,
        -0.013970572256729707,
        0.0003704179619681558,
        -0.35802062414185254,
      ];
      await testBatchNorm(isSync, input, mean, variance, expected, scale, bias, {epsilon: 1e-2});
    }, `batchNormalization with epsilon  / ${deviceType} / ${executionType}`);
  });
});