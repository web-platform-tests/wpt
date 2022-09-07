// META: title=test WebNN API concat operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-concat

let context;
let builder;

const testConcat = async (syncFlag, tensors, expected) => {
  const inputs = [];
  const namedInputs = {};

  for (let i = 0; i < tensors.length; i++) {
    inputs.push(builder.input('input' + i, tensors[i].desc));
    namedInputs['input' + i] = new Float32Array(tensors[i].value);
  }

  const output = builder.concat(inputs, expected.axis);
  const outputs = {
    'output': new Float32Array(sizeOfShape(expected.shape)),
  };
  let graph;

  if (syncFlag) {
    graph = builder.build({output});
    context.compute(graph, namedInputs, outputs);
  } else {
    graph = await builder.buildAsync({output});
    await context.computeAsync(graph, namedInputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.output, expected.value, ULPTolerance.float32.concat, 'float32');
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
      const tensors = [
        {desc: {type: 'float32', dimensions: [2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [3., 4.]},
      ];
      const expected = {axis: 0, shape: [4], value: [1., 2., 3., 4.]};
      await testConcat(isSync, tensors, expected);
    }, `test concat two 1D tensors / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [3., 4.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [5., 6.]},
      ];
      const expected = {axis: 0, shape: [6], value: [1., 2., 3., 4., 5., 6.]};
      await testConcat(isSync, tensors, expected);
    }, `test concat three 1D tensors / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [3., 4.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [5., 6.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [7., 8.]},
      ];
      const expected = {axis: 0, shape: [8], value: [1., 2., 3., 4., 5., 6., 7., 8.]};
      await testConcat(isSync, tensors, expected);
    }, `test concat four 1D tensors / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [3., 4.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [5., 6.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [7., 8.]},
        {desc: {type: 'float32', dimensions: [2]}, value: [9., 10.]},
      ];
      const expected = {
        axis: 0,
        shape: [10],
        value: [1., 2., 3., 4., 5., 6., 7., 8., 9., 10.],
      };
      await testConcat(isSync, tensors, expected);
    }, `test concat five 1D tensors / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [1, 2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
      ];
      const expected = {axis: 0, shape: [3, 2], value: [1., 2., 3., 4., 5., 6.]};
      await testConcat(isSync, tensors, expected);
    }, `test concat two 2D tensors with axis=0 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [1, 2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
        {
          desc: {type: 'float32', dimensions: [3, 2]},
          value: [7., 8., 9., 10., 11., 12.],
        },
      ];
      const expected = {
        axis: 0,
        shape: [6, 2],
        value: [1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11., 12.],
        };
      await testConcat(isSync, tensors, expected);
    }, `test concat three 2D tensors with axis=0 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [1, 2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
        {
          desc: {type: 'float32', dimensions: [3, 2]},
          value: [7., 8., 9., 10., 11., 12.],
        },
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [13., 14., 15., 16.]},
      ];
      const expected = {
        axis: 0,
        shape: [8, 2],
        value: [
          1., 2.,  3.,  4.,  5.,  6.,  7.,  8.,
          9., 10., 11., 12., 13., 14., 15., 16.,
        ]};
      await testConcat(isSync, tensors, expected);
    }, `test concat four 2D tensors with axis=0 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [1, 2]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
        {
          desc: {type: 'float32', dimensions: [3, 2]},
          value: [7., 8., 9., 10., 11., 12.],
        },
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [13., 14., 15., 16.]},
        {desc: {type: 'float32', dimensions: [1, 2]}, value: [17., 18.]},
      ];
      const expected = {
        axis: 0,
        shape: [9, 2],
        value: [
          1.,  2.,  3.,  4.,  5.,  6.,
          7.,  8.,  9.,  10., 11., 12.,
          13., 14., 15., 16., 17., 18.,
        ]};
      await testConcat(isSync, tensors, expected);
    }, `test concat five 2D tensors with axis=0 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
      ];
      const expected = {axis: 1, shape: [2, 3], value: [1, 3., 4., 2, 5., 6.]};
      await testConcat(isSync, tensors, expected);
    }, `test concat two 2D tensors with axis=1 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [7., 8.]},
      ];
      const expected = {axis: 1, shape: [2, 4], value: [1, 3., 4., 7, 2, 5., 6., 8]};
      await testConcat(isSync, tensors, expected);
    }, `test concat three 2D tensors with axis=1 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [7., 8.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [9., 10., 11., 12.]},
      ];
      const expected = {
        axis: 1,
        shape: [2, 6],
        value: [1, 3., 4., 7, 9., 10., 2, 5., 6., 8, 11., 12.],
      };
      await testConcat(isSync, tensors, expected);
    }, `test concat four 2D tensors with axis=1 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [1., 2.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [3., 4., 5., 6.]},
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [7., 8.]},
        {desc: {type: 'float32', dimensions: [2, 2]}, value: [9., 10., 11., 12.]},
        {desc: {type: 'float32', dimensions: [2, 1]}, value: [13., 14.]},
      ];
      const expected = {
        axis: 1,
        shape: [2, 7],
        value: [1, 3., 4., 7, 9., 10., 13, 2, 5., 6., 8, 11., 12., 14],
      };
      await testConcat(isSync, tensors, expected);
    }, `test concat five 2D tensors with axis=1 / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [1., 2., 3., 4., 5., 6., 7., 8.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [9., 10., 11., 12., 13., 14., 15., 16.],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [4, 2, 2],
          value: [1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11., 12., 13., 14., 15., 16.],
        },
        {
          axis: 1,
          shape: [2, 4, 2],
          value: [1., 2., 3., 4., 9., 10., 11., 12., 5., 6., 7., 8., 13., 14., 15., 16.],
        },
        {
          axis: 2,
          shape: [2, 2, 4],
          value: [1., 2., 9., 10., 3., 4., 11., 12., 5., 6., 13., 14., 7., 8., 15., 16.],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat two 3D tensors / ${deviceType} / ${executionType}`);


    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [1., 2., 3., 4., 5., 6., 7., 8.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [9., 10., 11., 12., 13., 14., 15., 16.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [17., 18., 19., 20., 21., 22., 23., 24.],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [6, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            17., 18., 19., 20., 21., 22., 23., 24.,
          ],
        },
        {
          axis: 1,
          shape: [2, 6, 2],
          value: [
            1.,  2.,  3.,  4.,  9.,  10., 11., 12.,
            17., 18., 19., 20., 5.,  6.,  7.,  8.,
            13., 14., 15., 16., 21., 22., 23., 24.,
          ],
        },
        {
          axis: 2,
          shape: [2, 2, 6],
          value: [
            1.,  2.,  9.,  10., 17., 18., 3.,  4.,
            11., 12., 19., 20., 5.,  6.,  13., 14.,
            21., 22., 7.,  8.,  15., 16., 23., 24.,
          ],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat three 3D tensors / ${deviceType} / ${executionType}`);


    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [1., 2., 3., 4., 5., 6., 7., 8.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [9., 10., 11., 12., 13., 14., 15., 16.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [17., 18., 19., 20., 21., 22., 23., 24.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [25., 26., 27., 28., 29., 30., 31., 32.],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [8, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
          ],
        },
        {
          axis: 1,
          shape: [2, 8, 2],
          value: [
            1.,  2.,  3.,  4.,  9.,  10., 11., 12.,
            17., 18., 19., 20., 25., 26., 27., 28.,
            5.,  6.,  7.,  8.,  13., 14., 15., 16.,
            21., 22., 23., 24., 29., 30., 31., 32.,
          ],
        },
        {
          axis: 2,
          shape: [2, 2, 8],
          value: [
            1., 2., 9.,  10., 17., 18., 25., 26.,
            3., 4., 11., 12., 19., 20., 27., 28.,
            5., 6., 13., 14., 21., 22., 29., 30.,
            7., 8., 15., 16., 23., 24., 31., 32.,
          ],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat four 3D tensors / ${deviceType} / ${executionType}`);


    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [1., 2., 3., 4., 5., 6., 7., 8.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [9., 10., 11., 12., 13., 14., 15., 16.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [17., 18., 19., 20., 21., 22., 23., 24.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [25., 26., 27., 28., 29., 30., 31., 32.],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2]},
          value: [33., 34., 35., 36., 37., 38., 39., 40.],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [10, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
            33., 34., 35., 36., 37., 38., 39., 40.,
          ],
        },
        {
          axis: 1,
          shape: [2, 10, 2],
          value: [
            1.,  2.,  3.,  4.,  9.,  10., 11., 12.,
            17., 18., 19., 20., 25., 26., 27., 28.,
            33., 34., 35., 36., 5.,  6.,  7.,  8.,
            13., 14., 15., 16., 21., 22., 23., 24.,
            29., 30., 31., 32., 37., 38., 39., 40.,
          ],
        },
        {
          axis: 2,
          shape: [2, 2, 10],
          value: [
            1.,  2.,  9.,  10., 17., 18., 25., 26.,
            33., 34., 3.,  4.,  11., 12., 19., 20.,
            27., 28., 35., 36., 5.,  6.,  13., 14.,
            21., 22., 29., 30., 37., 38., 7.,  8.,
            15., 16., 23., 24., 31., 32., 39., 40.,
          ],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat five 3D tensors / ${deviceType} / ${executionType}`);


    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            1., 2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9., 10., 11., 12., 13., 14., 15., 16.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
          ],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [4, 2, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
          ],
        },
        {
          axis: 1,
          shape: [2, 4, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            25., 26., 27., 28., 29., 30., 31., 32.,
          ],
        },
        {
          axis: 2,
          shape: [2, 2, 4, 2],
          value: [
            1.,  2.,  3.,  4.,  17., 18., 19., 20.,
            5.,  6.,  7.,  8.,  21., 22., 23., 24.,
            9.,  10., 11., 12., 25., 26., 27., 28.,
            13., 14., 15., 16., 29., 30., 31., 32.,
          ],
        },
        {
          axis: 3,
          shape: [2, 2, 2, 4],
          value: [
            1.,  2.,  17., 18., 3.,  4.,  19., 20.,
            5.,  6.,  21., 22., 7.,  8.,  23., 24.,
            9.,  10., 25., 26., 11., 12., 27., 28.,
            13., 14., 29., 30., 15., 16., 31., 32.,
          ],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat two 4D tensors / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            1., 2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9., 10., 11., 12., 13., 14., 15., 16.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            33., 34., 35., 36., 37., 38., 39., 40.,
            41., 42., 43., 44., 45., 46., 47., 48.,
          ],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [6, 2, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
            33., 34., 35., 36., 37., 38., 39., 40.,
            41., 42., 43., 44., 45., 46., 47., 48.,
          ],
        },
        {
          axis: 1,
          shape: [2, 6, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            33., 34., 35., 36., 37., 38., 39., 40.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            25., 26., 27., 28., 29., 30., 31., 32.,
            41., 42., 43., 44., 45., 46., 47., 48.,
          ],
        },
        {
          axis: 2,
          shape: [2, 2, 6, 2],
          value: [
            1.,  2.,  3.,  4.,  17., 18., 19., 20.,
            33., 34., 35., 36., 5.,  6.,  7.,  8.,
            21., 22., 23., 24., 37., 38., 39., 40.,
            9.,  10., 11., 12., 25., 26., 27., 28.,
            41., 42., 43., 44., 13., 14., 15., 16.,
            29., 30., 31., 32., 45., 46., 47., 48.,
          ],
        },
        {
          axis: 3,
          shape: [2, 2, 2, 6],
          value: [
            1.,  2.,  17., 18., 33., 34., 3.,  4.,
            19., 20., 35., 36., 5.,  6.,  21., 22.,
            37., 38., 7.,  8.,  23., 24., 39., 40.,
            9.,  10., 25., 26., 41., 42., 11., 12.,
            27., 28., 43., 44., 13., 14., 29., 30.,
            45., 46., 15., 16., 31., 32., 47., 48.,
          ],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat three 4D tensors / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            1., 2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9., 10., 11., 12., 13., 14., 15., 16.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            33., 34., 35., 36., 37., 38., 39., 40.,
            41., 42., 43., 44., 45., 46., 47., 48.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            49., 50., 51., 52., 53., 54., 55., 56.,
            57., 58., 59., 60., 61., 62., 63., 64.,
          ],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [8, 2, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
            33., 34., 35., 36., 37., 38., 39., 40.,
            41., 42., 43., 44., 45., 46., 47., 48.,
            49., 50., 51., 52., 53., 54., 55., 56.,
            57., 58., 59., 60., 61., 62., 63., 64.,
          ],
        },
        {
          axis: 1,
          shape: [2, 8, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            33., 34., 35., 36., 37., 38., 39., 40.,
            49., 50., 51., 52., 53., 54., 55., 56.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            25., 26., 27., 28., 29., 30., 31., 32.,
            41., 42., 43., 44., 45., 46., 47., 48.,
            57., 58., 59., 60., 61., 62., 63., 64.,
          ],
        },
        {
          axis: 2,
          shape: [2, 2, 8, 2],
          value: [
            1.,  2.,  3.,  4.,  17., 18., 19., 20.,
            33., 34., 35., 36., 49., 50., 51., 52.,
            5.,  6.,  7.,  8.,  21., 22., 23., 24.,
            37., 38., 39., 40., 53., 54., 55., 56.,
            9.,  10., 11., 12., 25., 26., 27., 28.,
            41., 42., 43., 44., 57., 58., 59., 60.,
            13., 14., 15., 16., 29., 30., 31., 32.,
            45., 46., 47., 48., 61., 62., 63., 64.,
          ],
        },
        {
          axis: 3,
          shape: [2, 2, 2, 8],
          value: [
            1.,  2.,  17., 18., 33., 34., 49., 50.,
            3.,  4.,  19., 20., 35., 36., 51., 52.,
            5.,  6.,  21., 22., 37., 38., 53., 54.,
            7.,  8.,  23., 24., 39., 40., 55., 56.,
            9.,  10., 25., 26., 41., 42., 57., 58.,
            11., 12., 27., 28., 43., 44., 59., 60.,
            13., 14., 29., 30., 45., 46., 61., 62.,
            15., 16., 31., 32., 47., 48., 63., 64.,
          ],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat four 4D tensors / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const tensors = [
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            1., 2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9., 10., 11., 12., 13., 14., 15., 16.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            33., 34., 35., 36., 37., 38., 39., 40.,
            41., 42., 43., 44., 45., 46., 47., 48.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            49., 50., 51., 52., 53., 54., 55., 56.,
            57., 58., 59., 60., 61., 62., 63., 64.,
          ],
        },
        {
          desc: {type: 'float32', dimensions: [2, 2, 2, 2]},
          value: [
            65., 66., 67., 68., 69., 70., 71., 72.,
            73., 74., 75., 76., 77., 78., 79., 80.,
          ],
        },
      ];
      const expected = [
        {
          axis: 0,
          shape: [10, 2, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            25., 26., 27., 28., 29., 30., 31., 32.,
            33., 34., 35., 36., 37., 38., 39., 40.,
            41., 42., 43., 44., 45., 46., 47., 48.,
            49., 50., 51., 52., 53., 54., 55., 56.,
            57., 58., 59., 60., 61., 62., 63., 64.,
            65., 66., 67., 68., 69., 70., 71., 72.,
            73., 74., 75., 76., 77., 78., 79., 80.,
          ],
        },
        {
          axis: 1,
          shape: [2, 10, 2, 2],
          value: [
            1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,
            17., 18., 19., 20., 21., 22., 23., 24.,
            33., 34., 35., 36., 37., 38., 39., 40.,
            49., 50., 51., 52., 53., 54., 55., 56.,
            65., 66., 67., 68., 69., 70., 71., 72.,
            9.,  10., 11., 12., 13., 14., 15., 16.,
            25., 26., 27., 28., 29., 30., 31., 32.,
            41., 42., 43., 44., 45., 46., 47., 48.,
            57., 58., 59., 60., 61., 62., 63., 64.,
            73., 74., 75., 76., 77., 78., 79., 80.,
          ],
        },
        {
          axis: 2,
          shape: [2, 2, 10, 2],
          value: [
            1.,  2.,  3.,  4.,  17., 18., 19., 20.,
            33., 34., 35., 36., 49., 50., 51., 52.,
            65., 66., 67., 68., 5.,  6.,  7.,  8.,
            21., 22., 23., 24., 37., 38., 39., 40.,
            53., 54., 55., 56., 69., 70., 71., 72.,
            9.,  10., 11., 12., 25., 26., 27., 28.,
            41., 42., 43., 44., 57., 58., 59., 60.,
            73., 74., 75., 76., 13., 14., 15., 16.,
            29., 30., 31., 32., 45., 46., 47., 48.,
            61., 62., 63., 64., 77., 78., 79., 80.,
          ],
        },
        {
          axis: 3,
          shape: [2, 2, 2, 10],
          value: [
            1.,  2.,  17., 18., 33., 34., 49., 50.,
            65., 66., 3.,  4.,  19., 20., 35., 36.,
            51., 52., 67., 68., 5.,  6.,  21., 22.,
            37., 38., 53., 54., 69., 70., 7.,  8.,
            23., 24., 39., 40., 55., 56., 71., 72.,
            9.,  10., 25., 26., 41., 42., 57., 58.,
            73., 74., 11., 12., 27., 28., 43., 44.,
            59., 60., 75., 76., 13., 14., 29., 30.,
            45., 46., 61., 62., 77., 78., 15., 16.,
            31., 32., 47., 48., 63., 64., 79., 80.,
          ],
        },
      ];
      for (const test of expected) {
        await testConcat(isSync, tensors, test);
      }
    }, `test concat five 4D tensors / ${deviceType} / ${executionType}`);
  });
});