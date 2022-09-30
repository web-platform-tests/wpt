// META: title=test WebNN API conv2d operation
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-conv2d

let context;
let builder;

async function testConv2d(syncFlag, input, filter, expected, options = {}, bias = undefined, activation = undefined, fusion = false, activationOptions = {}) {
  const x = builder.input('x', {type: 'float32', dimensions: input.shape});
  const w = builder.constant({type: 'float32', dimensions: filter.shape}, filter.data);
  let b;

  if (bias !== undefined) {
    b = builder.constant({type: 'float32', dimensions: bias.shape}, bias.data);
  }

  if (fusion) {
    if (b !== undefined) {
      options.bias = b;
    }
    if (activation !== undefined) {
      options.activation = createActivation(builder, activation, undefined, activationOptions);
    }
  }

  let y = builder.conv2d(x, w, options);

  if (!fusion) {
    if (b !== undefined) {
      if (options.inputLayout === undefined || options.inputLayout === 'nchw') {
        b = builder.reshape(b, [1, -1, 1, 1]);
      }
      y = builder.add(y, b);
    }
    if (activation !== undefined) {
      y = createActivation(builder, activation, y, activationOptions);
    }
  }

  const inputs = {'x': input.data};
  const outputs = {'y': new Float32Array(sizeOfShape(expected.shape))};
  let graph;

  if (syncFlag) {
    graph = builder.build({y});
    context.compute(graph, inputs, outputs);
  } else {
    graph = await builder.buildAsync({y});
    await context.computeAsync(graph, inputs, outputs);
  }

  assert_array_approx_equals_ulp(outputs.y, expected.data, ULPTolerance.float32.conv2d, 'float32');
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
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const options = {padding: [1, 1, 1, 1]};
      const expected = {
        shape: [1, 1, 5, 5],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        autoPad: 'explicit',
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [
          54,  63,  72,
          99,  108, 117,
          144, 153, 162,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding explicit autoPad default padding  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        autoPad: 'explicit',
      };
      const expected = {
        shape: [1, 1, 5, 5],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding explicit autoPad  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nchw',
        filterLayout: 'oihw',
      };
      const expected = {
        shape: [1, 1, 5, 5],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nchw oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      const expected = {
        shape: [1, 1, 5, 5],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      const expected = {
        shape: [1, 1, 5, 5],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      const expected = {
        shape: [1, 1, 5, 5],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      const expected = {
        shape: [1, 5, 5, 1],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      const expected = {
        shape: [1, 5, 5, 1],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      const expected = {
        shape: [1, 5, 5, 1],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      const expected = {
        shape: [1, 5, 5, 1],
        data: [
          12,  21, 27, 33,  24,  33,  54,  63, 72,  51,  63,  99, 108,
          117, 81, 93, 144, 153, 162, 111, 72, 111, 117, 123, 84,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with padding nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      await testConv2d(isSync, input, filter, expected);
    }, `conv2d without padding default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      const options = {
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d without padding nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      const options = {
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d without padding nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      const options = {
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d without padding nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d without padding nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d without padding nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d without padding nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const options = {
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [54., 63., 72., 99., 108., 117., 144., 153., 162.],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d without padding nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 7, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 4, 3],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 7, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 4, 3],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 7, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 4, 3],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 7, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 4, 3],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 7, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 4, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 7, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 4, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 7, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 4, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 7, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 4, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 123., 198., 141., 112., 177., 124.],
      };
      const options = {
        padding: [1, 1, 1, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and padding nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 4, 2],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [4, 2, 1, 1],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 4, 2, 1],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 4, 2, 1],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 4, 2],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [4, 2, 1, 1],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 4, 2, 1],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 4, 2, 1],
        data: new Float32Array(8).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [33, 45, 27, 104, 120, 66, 72, 80, 43],
      };
      const options = {
        padding: [1, 2, 0, 1],
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with strides=2 and asymetric padding nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 3, 3, 1],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-lower',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-lower nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 3, 3],
        data: [12., 27., 24., 63., 108., 81., 72., 117., 84.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 4, 4],
        data: new Float32Array([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 2, 2],
        data: [45., 39., 66., 50.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 4, 4],
        data: new Float32Array([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 2, 2],
        data: [45., 39., 66., 50.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 4, 4],
        data: new Float32Array([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 2, 2],
        data: [45., 39., 66., 50.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 4, 4, 1],
        data: new Float32Array([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 2, 2, 1],
        data: [45., 39., 66., 50.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 4, 4, 1],
        data: new Float32Array([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 2, 2, 1],
        data: [45., 39., 66., 50.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 4, 4, 1],
        data: new Float32Array([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 2, 2, 1],
        data: [45., 39., 66., 50.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 4, 4, 1],
        data: new Float32Array([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 2, 2, 1],
        data: [45., 39., 66., 50.],
      };
      const options = {
        autoPad: 'same-upper',
        strides: [2, 2],
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d with autopad same-upper nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 4, 2, 2],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          10,
          20,
          30,
          40,
          0,
          0,
          0,
          0,
        ]),
      };
      const filter = {
        shape: [4, 1, 2, 2],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
          10.0,
          20.0,
          30.0,
          40.0,
          50.0,
          50.0,
          50.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 4, 1, 1],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {groups: 4};
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 4, 1, 1],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 4, 2, 2],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          10,
          20,
          30,
          40,
          0,
          0,
          0,
          0,
        ]),
      };
      const filter = {
        shape: [2, 2, 1, 4],
        data: new Float32Array([
          0.25,
          0.0,
          10.0,
          50.0,
          0.25,
          1.0,
          20.0,
          50.0,
          0.25,
          0.0,
          30.0,
          50.0,
          0.25,
          1.0,
          40.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 4, 1, 1],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {
        groups: 4,
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [4],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 4, 2, 2],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          10,
          20,
          30,
          40,
          0,
          0,
          0,
          0,
        ]),
      };
      const filter = {
        shape: [4, 2, 2, 1],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
          10.0,
          20.0,
          30.0,
          40.0,
          50.0,
          50.0,
          50.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 4, 1, 1],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {
        groups: 4,
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 4, 1, 1],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 4, 2, 2],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          10,
          20,
          30,
          40,
          0,
          0,
          0,
          0,
        ]),
      };
      const filter = {
        shape: [1, 2, 2, 4],
        data: new Float32Array([
          0.25,
          0.0,
          10.0,
          50.0,
          0.25,
          1.0,
          20.0,
          50.0,
          0.25,
          0.0,
          30.0,
          50.0,
          0.25,
          1.0,
          40.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 4, 1, 1],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {
        groups: 4,
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 4, 1, 1],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 2, 2, 4],
        data: new Float32Array([
          10,
          21,
          10,
          0,
          10,
          22,
          20,
          0,
          10,
          23,
          30,
          0,
          10,
          24,
          40,
          0,
        ]),
      };
      const filter = {
        shape: [4, 1, 2, 2],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
          10.0,
          20.0,
          30.0,
          40.0,
          50.0,
          50.0,
          50.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 1, 1, 4],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {
        groups: 4,
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 1, 4],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 2, 2, 4],
        data: new Float32Array([
          10,
          21,
          10,
          0,
          10,
          22,
          20,
          0,
          10,
          23,
          30,
          0,
          10,
          24,
          40,
          0,
        ]),
      };
      const filter = {
        shape: [2, 2, 1, 4],
        data: new Float32Array([
          0.25,
          0.0,
          10.0,
          50.0,
          0.25,
          1.0,
          20.0,
          50.0,
          0.25,
          0.0,
          30.0,
          50.0,
          0.25,
          1.0,
          40.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 1, 1, 4],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {
        groups: 4,
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 1, 4],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 2, 2, 4],
        data: new Float32Array([
          10,
          21,
          10,
          0,
          10,
          22,
          20,
          0,
          10,
          23,
          30,
          0,
          10,
          24,
          40,
          0,
        ]),
      };
      const filter = {
        shape: [4, 2, 2, 1],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
          10.0,
          20.0,
          30.0,
          40.0,
          50.0,
          50.0,
          50.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 1, 1, 4],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {
        groups: 4,
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 1, 4],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      // It is based on Android NNAPI CTS: V1_2/depthwise_conv2d_v1_2.mod.py
      const input = {
        shape: [1, 2, 2, 4],
        data: new Float32Array([
          10,
          21,
          10,
          0,
          10,
          22,
          20,
          0,
          10,
          23,
          30,
          0,
          10,
          24,
          40,
          0,
        ]),
      };
      const filter = {
        shape: [1, 2, 2, 4],
        data: new Float32Array([
          0.25,
          0.0,
          10.0,
          50.0,
          0.25,
          1.0,
          20.0,
          50.0,
          0.25,
          0.0,
          30.0,
          50.0,
          0.25,
          1.0,
          40.0,
          50.0,
        ]),
      };
      const bias = {
        shape: [4],
        data: new Float32Array([6000, 7000, 8000, 9000]),
      };
      let expected = {
        shape: [1, 1, 1, 4],
        data: [6010, 7046, 11000, 9000],
      };
      const options = {
        groups: 4,
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options, bias);
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 1, 4],
        data: [6, 6, 6, 6],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused depthwise conv2d nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 4, 2, 2],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          10,
          20,
          30,
          40,
          0,
          0,
          0,
          0,
        ]),
      };
      const filter = {
        shape: [4, 1, 2, 2],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
          10.0,
          20.0,
          30.0,
          40.0,
          50.0,
          50.0,
          50.0,
          50.0,
        ]),
      };
      let expected = {
        shape: [1, 4, 1, 1],
        data: [10, 46, 3000, 0],
      };
      const options = {
        groups: 4,
        inputLayout: 'nchw',
        filterLayout: 'oihw',
      };
      await testConv2d(isSync, input, filter, expected, options);
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu', true);

      expected = {
        shape: [1, 4, 1, 1],
        data: [6, 6, 6, 0],
      };
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu6', true);
    }, `depthwise conv2d nchw oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 2, 3, 3],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29,
        ]),
      };
      const filter = {
        shape: [2, 1, 2, 2],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
        ]),
      };
      let expected = {
        shape: [1, 2, 3, 3],
        data: [
          10,
          10,
          5,
          10,
          10,
          5,
          5,
          5,
          2.5,
          47,
          49,
          0,
          53,
          55,
          0,
          28,
          29,
          0,
        ],
      };
      const options = {
        groups: 2,
        padding: [0, 1, 0, 1],
        autoPad: 'explicit',
      };
      await testConv2d(isSync, input, filter, expected, options);
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu', true);

      expected = {
        shape: [1, 2, 3, 3],
        data: [
          6,
          6,
          5,
          6,
          6,
          5,
          5,
          5,
          2.5,
          6,
          6,
          0,
          6,
          6,
          0,
          6,
          6,
          0,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu6', true);
    }, `fused depthwise conv2d explicit autoPad  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 2, 3, 3],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29,
        ]),
      };
      const filter = {
        shape: [2, 1, 2, 2],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
        ]),
      };
      let expected = {
        shape: [1, 2, 3, 3],
        data: [
          10,
          10,
          5,
          10,
          10,
          5,
          5,
          5,
          2.5,
          47,
          49,
          0,
          53,
          55,
          0,
          28,
          29,
          0,
        ],
      };
      const options = {
        groups: 2,
        autoPad: 'same-upper',
      };
      await testConv2d(isSync, input, filter, expected, options);
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu', true);

      expected = {
        shape: [1, 2, 3, 3],
        data: [
          6,
          6,
          5,
          6,
          6,
          5,
          5,
          5,
          2.5,
          6,
          6,
          0,
          6,
          6,
          0,
          6,
          6,
          0,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu6', true);
    }, `fused depthwise conv2d same-upper autoPad  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 2, 3, 3],
        data: new Float32Array([
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          21,
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29,
        ]),
      };
      const filter = {
        shape: [2, 1, 2, 2],
        data: new Float32Array([
          0.25,
          0.25,
          0.25,
          0.25,
          0.0,
          1.0,
          0.0,
          1.0,
        ]),
      };
      let expected = {
        shape: [1, 2, 3, 3],
        data: [
          2.5,
          5,
          5,
          5,
          10,
          10,
          5,
          10,
          10,
          21,
          22,
          23,
          45,
          47,
          49,
          51,
          53,
          55,
        ],
      };
      const options = {
        groups: 2,
        autoPad: 'same-lower',
      };
      await testConv2d(isSync, input, filter, expected, options);
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu', true);

      expected = {
        shape: [1, 2, 3, 3],
        data: [
          2.5,
          5,
          5,
          5,
          6,
          6,
          5,
          6,
          6,
          6,
          6,
          6,
          6,
          6,
          6,
          6,
          6,
          6,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, undefined, 'relu6', true);
    }, `fused depthwise conv2d same-lower autoPad  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
      };
      let expected = {
        shape: [1, 1, 5, 5],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 5, 5],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);

      expected = {
        shape: [1, 1, 5, 5],
        data: [
          -8.800000131130219,
          -7.900000117719173,
          -7.300000108778477,
          -6.70000009983778,
          -7.600000113248825,
          -6.70000009983778,
          -4.6000000685453415,
          -3.7000000551342964,
          -2.8000000417232513,
          -4.90000007301569,
          -3.7000000551342964,
          -0.10000000149011612,
          8,
          17,
          -1.9000000283122063,
          -0.7000000104308128,
          44,
          53,
          62,
          11,
          -2.8000000417232513,
          11,
          17,
          23,
          -1.600000023841858,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'leakyRelu', true, {alpha: 0.10000000149011612});
      expected = {
        shape: [1, 1, 5, 5],
        data: [
          6.054601895401186e-39,
          4.906094730649281e-35,
          1.9792598779469048e-32,
          7.984904245686979e-30,
          9.854154686111257e-34,
          7.984904245686979e-30,
          1.0530617357553813e-20,
          8.533047625744066e-17,
          6.914400106935423e-13,
          5.242885663363465e-22,
          8.533047625744066e-17,
          0.2689414213699951,
          0.9996646498695336,
          0.9999999586006244,
          5.602796406145939e-9,
          0.0009110511944006454,
          1,
          1,
          1,
          0.999983298578152,
          6.914400106935423e-13,
          0.999983298578152,
          0.9999999586006244,
          0.9999999998973812,
          1.12535162055095e-7,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'sigmoid', true);
    }, `fused conv2d with padding default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nchw',
        filterLayout: 'hwio',
      };
      let expected = {
        shape: [1, 1, 5, 5],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 5, 5],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused conv2d with padding nchw hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nchw',
        filterLayout: 'ohwi',
      };
      let expected = {
        shape: [1, 1, 5, 5],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 5, 5],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused conv2d with padding nchw ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nchw',
        filterLayout: 'ihwo',
      };
      let expected = {
        shape: [1, 1, 5, 5],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 1, 5, 5],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused conv2d with padding nchw ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'oihw',
      };
      let expected = {
        shape: [1, 5, 5, 1],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 5, 5, 1],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);

      expected = {
        shape: [1, 5, 5, 1],
        data: [
          -8.800000131130219,
          -7.900000117719173,
          -7.300000108778477,
          -6.70000009983778,
          -7.600000113248825,
          -6.70000009983778,
          -4.6000000685453415,
          -3.7000000551342964,
          -2.8000000417232513,
          -4.90000007301569,
          -3.7000000551342964,
          -0.10000000149011612,
          8,
          17,
          -1.9000000283122063,
          -0.7000000104308128,
          44,
          53,
          62,
          11,
          -2.8000000417232513,
          11,
          17,
          23,
          -1.600000023841858,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'leakyRelu', true, {alpha: 0.10000000149011612});
      expected = {
        shape: [1, 5, 5, 1],
        data: [
          6.054601895401186e-39,
          4.906094730649281e-35,
          1.9792598779469048e-32,
          7.984904245686979e-30,
          9.854154686111257e-34,
          7.984904245686979e-30,
          1.0530617357553813e-20,
          8.533047625744066e-17,
          6.914400106935423e-13,
          5.242885663363465e-22,
          8.533047625744066e-17,
          0.2689414213699951,
          0.9996646498695336,
          0.9999999586006244,
          5.602796406145939e-9,
          0.0009110511944006454,
          1,
          1,
          1,
          0.999983298578152,
          6.914400106935423e-13,
          0.999983298578152,
          0.9999999586006244,
          0.9999999998973812,
          1.12535162055095e-7,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'sigmoid', true);
    }, `fused conv2d with padding nhwc oihw  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [3, 3, 1, 1],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'hwio',
      };
      let expected = {
        shape: [1, 5, 5, 1],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 5, 5, 1],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused conv2d with padding nhwc hwio  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'ohwi',
      };
      let expected = {
        shape: [1, 5, 5, 1],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 5, 5, 1],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused conv2d with padding nhwc ohwi  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array(9).fill(1),
      };
      const bias = {
        shape: [1],
        data: new Float32Array([-100]),
      };
      const options = {
        padding: [1, 1, 1, 1],
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      let expected = {
        shape: [1, 5, 5, 1],
        data: [
          0.,  0., 0., 0.,  0.,  0.,  0.,  0., 0.,  0.,  0.,  0., 8.,
          17., 0., 0., 44., 53., 62., 11., 0., 11., 17., 23., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu');
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu', true);

      expected = {
        shape: [1, 5, 5, 1],
        data: [
          0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 6.,
          6., 0., 0., 6., 6., 6., 6., 0., 6., 6., 6., 0.,
        ],
      };
      await testConv2d(isSync, input, filter, expected, options, bias, 'relu6', true);
    }, `fused conv2d with padding nhwc ihwo  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 1, 5, 5],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 3, 3],
        data: new Float32Array(9).fill(1),
      };
      const expected = {
        shape: [1, 1, 1, 1],
        data: [108],
      };
      const options = {
        dilations: [2, 2],
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d input=1x1x5x5 dilations=2  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 5, 5, 1],
        data: new Float32Array([
          0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        ]),
      };
      const filter = {
        shape: [1, 1, 2, 2],
        data: new Float32Array(4).fill(1),
      };
      const expected = {
        shape: [1, 1, 1, 1],
        data: [48],
      };
      const options = {
        dilations: [4, 4],
        inputLayout: 'nhwc',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d input=1x5x5x1 dilations=4 nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const input = {
        shape: [1, 65, 65, 1],
        data: new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18,
          19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
          37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54,
          55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,
          8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
          26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
          44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
          62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14,
          15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
          33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50,
          51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,
          4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
          22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
          40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
          58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10,
          11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
          29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
          57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
          65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
          36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53,
          54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,
          7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
          43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
          61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
          32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49,
          50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,
          3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
          39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56,
          57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,
          10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
          28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
          46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
          64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16,
          17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52,
          53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,
          6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
          24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
          42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
          60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
          31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48,
          49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,
          2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
          38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55,
          56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,
          9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
          27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
          45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
          63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15,
          16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
          34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51,
          52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,
          5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
          23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
          41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
          59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11,
          12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
          30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57,
          48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18,
          19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
          37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54,
          55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,
          8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
          26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
          44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
          62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14,
          15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
          33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50,
          51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,
          4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
          22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
          40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
          58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10,
          11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
          29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
          57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
          65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
          36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53,
          54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,
          7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
          43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
          61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
          32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49,
          50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,
          3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
          39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56,
          57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,
          10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
          28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
          46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
          64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16,
          17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52,
          53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,
          6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
          24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
          42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
          60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
          31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48,
          49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,
          2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
          38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55,
          56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,
          9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
          27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
          45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
          63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15,
          16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
          34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51,
          52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,
          5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
          23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
          41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
          59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11,
          12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
          30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57,
          48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18,
          19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
          37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54,
          55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,
          8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
          26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
          44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
          62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14,
          15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
          33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50,
          51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,
          4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
          22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
          40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
          58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10,
          11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
          29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
          57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
          65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
          36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53,
          54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,
          7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
          43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
          61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
          32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49,
          50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,
          3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
          39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56,
          57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,
          10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
          28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
          46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
          64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16,
          17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52,
          53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,
          6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
          24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
          42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
          60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
          31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48,
          49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,
          2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
          38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55,
          56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,
          9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
          27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
          45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
          63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15,
          16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
          34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51,
          52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,
          5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
          23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
          41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
          59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11,
          12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
          30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57,
          48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18,
          19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
          37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54,
          55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,
          8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
          26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
          44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
          62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14,
          15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
          33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50,
          51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,
          4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
          22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
          40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
          58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10,
          11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
          29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
          57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
          65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
          36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53,
          54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,
          7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
          43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
          61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
          32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49,
          50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,
          3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
          39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56,
          57, 58, 59, 60, 61, 62, 63, 64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,
          10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
          28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
          46, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
          64, 65, 1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16,
          17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 48, 49, 50, 51, 52,
          53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
        ]),
      };
      const filter = {
        shape: [1, 3, 3, 1],
        data: new Float32Array([
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
        ]),
      };
      const expected = {
        shape: [1, 57, 57, 1],
        data: new Float32Array([
          15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,
          57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,
          99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138,
          151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180,
          183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,
          54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,
          96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135,
          138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177,
          180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,
          51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,
          93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132,
          135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174,
          177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,
          48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,
          90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139,
          132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171,
          174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,
          45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,
          87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126,
          139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168,
          171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,
          42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,
          84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123,
          126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165,
          168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,
          39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,
          81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120,
          123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162,
          165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,
          36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,
          78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117,
          120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159,
          162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,
          33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,
          75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114,
          117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156,
          159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,
          30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,
          72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111,
          114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163,
          156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,
          27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,
          69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108,
          111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150,
          163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,
          24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,
          66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105,
          108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147,
          150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,
          21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,
          63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102,
          105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144,
          147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,
          18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,
          60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,
          102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151,
          144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183,
          15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,
          57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,
          99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138,
          151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180,
          183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,
          54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,
          96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135,
          138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177,
          180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,
          51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,
          93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132,
          135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174,
          177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,
          48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,
          90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139,
          132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171,
          174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,
          45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,
          87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126,
          139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168,
          171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,
          42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,
          84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123,
          126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165,
          168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,
          39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,
          81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120,
          123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162,
          165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,
          36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,
          78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117,
          120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159,
          162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,
          33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,
          75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114,
          117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156,
          159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,
          30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,
          72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111,
          114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163,
          156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,
          27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,
          69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108,
          111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150,
          163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,
          24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,
          66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105,
          108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147,
          150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,
          21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,
          63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102,
          105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144,
          147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,
          18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,
          60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,
          102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151,
          144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183,
          15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,
          57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,
          99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138,
          151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180,
          183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,
          54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,
          96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135,
          138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177,
          180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,
          51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,
          93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132,
          135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174,
          177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,
          48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,
          90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139,
          132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171,
          174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,
          45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,
          87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126,
          139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168,
          171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,
          42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,
          84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123,
          126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165,
          168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,
          39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,
          81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120,
          123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162,
          165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,
          36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,
          78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117,
          120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159,
          162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,
          33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,
          75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114,
          117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156,
          159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,
          30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,
          72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111,
          114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163,
          156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,
          27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,
          69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108,
          111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150,
          163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,
          24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,
          66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105,
          108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147,
          150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,
          21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,
          63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102,
          105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144,
          147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,
          18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,
          60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,
          102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151,
          144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183,
          15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,
          57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,
          99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138,
          151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180,
          183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,
          54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,
          96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135,
          138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177,
          180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,
          51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,
          93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132,
          135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174,
          177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,
          48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,
          90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139,
          132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171,
          174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,  42,
          45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,
          87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123, 126,
          139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165, 168,
          171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,  39,
          42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,
          84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120, 123,
          126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162, 165,
          168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,  36,
          39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,
          81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117, 120,
          123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159, 162,
          165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,  33,
          36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,
          78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114, 117,
          120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156, 159,
          162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,  30,
          33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,
          75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111, 114,
          117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163, 156,
          159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,  27,
          30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,
          72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108, 111,
          114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150, 163,
          156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,  24,
          27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,
          69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105, 108,
          111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147, 150,
          163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,  21,
          24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,  63,
          66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102, 105,
          108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144, 147,
          150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,  18,
          21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,  60,
          63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102,
          105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151, 144,
          147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 15,
          18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,  57,
          60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,
          102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138, 151,
          144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183,
          15,  18,  21,  24,  27,  30,  33,  36,  39,  42,  45,  48,  51,  54,
          57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,
          99,  102, 105, 108, 111, 114, 117, 120, 123, 126, 139, 132, 135, 138,
          151, 144, 147, 150, 163, 156, 159, 162, 165, 168, 171, 174, 177, 180,
          183,
        ]),
      };
      const options = {
        dilations: [4, 4],
        inputLayout: 'nhwc',
        filterLayout: 'ihwo',
      };
      await testConv2d(isSync, input, filter, expected, options);
    }, `conv2d input=1x65x65x1 dilations=4 nhwc  / ${deviceType} / ${executionType}`);
  });
});