// META: title=test WebNN API reduction operations
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-reduce

let context;
let builder;

async function testReduce(syncFlag, op, options, input, expected) {
  const x = builder.input('x', {type: 'float32', dimensions: input.shape});
  const y = builder['reduce' + op](x, options);
  const inputs = {'x': new Float32Array(input.values)};
  const outputs = {'y': new Float32Array(sizeOfShape(expected.shape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, expected.values, ULPTolerance.float32['reduce' + op], 'float32');
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
      await testReduce(isSync,
        'Max', {}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [], values: [600.]});
    }, `reduceMax default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [1, 1, 1], values: [600.]});
    }, `reduceMax default axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [0], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [2, 2], values: [500., 100., 600., 400.]});
    }, `reduceMax axes0 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2], values: [200., 100., 300., 400., 600., 6.]});
    }, `reduceMax axes1 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [2], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2], values: [100., 200., 300., 400., 500., 600.]});
    }, `reduceMax axes2 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [-1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2], values: [100., 200., 300., 400., 500., 600.]});
    }, `reduceMax negative axes do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [0], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [1, 2, 2], values: [500., 100., 600., 400.]});
    }, `reduceMax axes0 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 1, 2], values: [200., 100., 300., 400., 600., 6.]});
    }, `reduceMax axes1 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [2], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2, 1], values: [100., 200., 300., 400., 500., 600.]});
    }, `reduceMax axes2 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Max', {axes: [-1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2, 1], values: [100., 200., 300., 400., 500., 600.]});
    }, `reduceMax negative axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [], values: [18.25]});
    }, `reduceMean default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [1, 1, 1], values: [18.25]});
    }, `reduceMean default axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [0], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [2, 2], values: [30., 1., 40., 2.]});
    }, `reduceMean axes0 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [3, 2], values: [12.5, 1.5, 35., 1.5, 57.5, 1.5]});
    }, `reduceMean axes1 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [2], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [3, 2], values: [3., 11., 15.5, 21., 28., 31.]});
    }, `reduceMean axes2 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [-1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [3, 2], values: [3., 11., 15.5, 21., 28., 31.]});
    }, `reduceMean negative axes do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [0], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [1, 2, 2], values: [30., 1., 40., 2.]});
    }, `reduceMean axes0 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [3, 1, 2], values: [12.5, 1.5, 35., 1.5, 57.5, 1.5]});
    }, `reduceMean axes1 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [2], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [3, 2, 1], values: [3., 11., 15.5, 21., 28., 31.]});
    }, `reduceMean axes2 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Mean', {axes: [-1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [5., 1., 20., 2., 30., 1., 40., 2., 55., 1., 60., 2.],
        },
        {shape: [3, 2, 1], values: [3., 11., 15.5, 21., 28., 31.]});
    }, `reduceMean negative axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [], values: [1.]});
    }, `reduceMin default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [1, 1, 1], values: [1.]});
    }, `reduceMin default axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [0], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [2, 2], values: [1., 3., 4., 2.]});
    }, `reduceMin axes0 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2], values: [1., 2., 4., 3., 500., 5.]});
    }, `reduceMin axes1 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [2], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2], values: [1., 2., 3., 4., 5., 6.]});
    }, `reduceMin axes2 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [-1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2], values: [1., 2., 3., 4., 5., 6.]});
    }, `reduceMin negative axes do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [0], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [1, 2, 2], values: [1., 3., 4., 2.]});
    }, `reduceMin axes0 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 1, 2], values: [1., 2., 4., 3., 500., 5.]});
    }, `reduceMin axes1 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [2], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2, 1], values: [1., 2., 3., 4., 5., 6.]});
    }, `reduceMin axes2 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Min', {axes: [-1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [1., 100., 200., 2., 300., 3., 4., 400., 500., 5., 600., 6.],
        },
        {shape: [3, 2, 1], values: [1., 2., 3., 4., 5., 6.]});
    }, `reduceMin negative axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {shape: [], values: [0.]});
    }, `reduceProduct default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {shape: [1, 1, 1], values: [0.]});
    }, `reduceProduct default axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [0], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [2, 2],
          values: [0., 45., 120., 231.],
        });
    }, `reduceProduct axes0 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2],
          values: [0., 3., 24., 35., 80., 99.],
        });
    }, `reduceProduct axes1 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [2], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2],
          values: [0., 6., 20., 42., 72., 110.],
        });
    }, `reduceProduct axes2 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [-1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2],
          values: [0., 6., 20., 42., 72., 110.],
        });
    }, `reduceProduct negative axes do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [0], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [1, 2, 2],
          values: [0., 45., 120., 231.],
        });
    }, `reduceProduct axes0 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 1, 2],
          values: [0., 3., 24., 35., 80., 99.],
        });
    }, `reduceProduct axes1 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [2], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2, 1],
          values: [0., 6., 20., 42., 72., 110.],
        });
    }, `reduceProduct axes2 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Product', {axes: [-1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2, 1],
          values: [0., 6., 20., 42., 72., 110.],
        });
    }, `reduceProduct negative axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {shape: [], values: [66.]});
    }, `reduceSum default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {shape: [1, 1, 1], values: [66.]});
    }, `reduceSum default axes keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [0], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [2, 2],
          values: [12., 15., 18., 21.],
        });
    }, `reduceSum axes0 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2],
          values: [2., 4., 10., 12., 18., 20.],
        });
    }, `reduceSum axes1 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [2], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2],
          values: [1., 5., 9., 13., 17., 21.],
        });
    }, `reduceSum axes2 do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [-1], keepDimensions: false}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2],
          values: [1., 5., 9., 13., 17., 21.],
        });
    }, `reduceSum negative axes do not keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [0], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [1, 2, 2],
          values: [12., 15., 18., 21.],
        });
    }, `reduceSum axes0 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 1, 2],
          values: [2., 4., 10., 12., 18., 20.],
        });
    }, `reduceSum axes1 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [2], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2, 1],
          values: [1., 5., 9., 13., 17., 21.],
        });
    }, `reduceSum axes2 keep dims  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      await testReduce(isSync,
        'Sum', {axes: [-1], keepDimensions: true}, {
          shape: [3, 2, 2],
          values: [0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.],
        },
        {
          shape: [3, 2, 1],
          values: [1., 5., 9., 13., 17., 21.],
        });
    }, `reduceSum negative axes keep dims  / ${deviceType} / ${executionType}`);
  });
});