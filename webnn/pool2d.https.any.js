// META: title=test WebNN API pooling operations
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-pool2d

let context;
let builder;

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
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 4, 4]});
      const windowDimensions = [3, 3];
      const y = builder.maxPool2d(x, {windowDimensions});
      const inputs = {
        'x': new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 2, 2]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [11, 12, 15, 16];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 4, 4, 1]});
      const windowDimensions = [3, 3];
      const layout = 'nhwc';
      const y = builder.maxPool2d(x, {windowDimensions, layout});
      const inputs = {
        'x': new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 2, 2, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [11, 12, 15, 16];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 4, 4]});
      const windowDimensions = [2, 2];
      const dilations = [2, 2];
      const y = builder.maxPool2d(x, {windowDimensions, dilations});
      const inputs = {
        'x': new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 2, 2]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [11, 12, 15, 16];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d dilations default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 4, 4, 1]});
      const windowDimensions = [2, 2];
      const dilations = [2, 2];
      const layout = 'nhwc';
      const y = builder.maxPool2d(x, {windowDimensions, dilations, layout});
      const inputs = {
        'x': new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 2, 2, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [11, 12, 15, 16];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d dilations nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 5, 5]});
      const windowDimensions = [5, 5];
      const padding = [2, 2, 2, 2];
      const y = builder.maxPool2d(x, {windowDimensions, padding});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 5, 5]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        13, 14, 15, 15, 15, 18, 19, 20, 20, 20, 23, 24, 25,
        25, 25, 23, 24, 25, 25, 25, 23, 24, 25, 25, 25,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d pads default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 1]});
      const windowDimensions = [5, 5];
      const padding = [2, 2, 2, 2];
      const layout = 'nhwc';
      const y = builder.maxPool2d(x, {windowDimensions, padding, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 5, 5, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        13, 14, 15, 15, 15, 18, 19, 20, 20, 20, 23, 24, 25,
        25, 25, 23, 24, 25, 25, 25, 23, 24, 25, 25, 25,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d pads nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 5, 5]});
      const windowDimensions = [5, 5];
      const autoPad = 'same-upper';
      const y = builder.maxPool2d(x, {windowDimensions, autoPad});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 5, 5]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        13, 14, 15, 15, 15, 18, 19, 20, 20, 20, 23, 24, 25,
        25, 25, 23, 24, 25, 25, 25, 23, 24, 25, 25, 25,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad same-upper default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [2, 1, 2, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const y = builder.maxPool2d(x, {windowDimensions, autoPad, padding, strides, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        9,
        11,
        13,
        14,
        23,
        25,
        27,
        28,
        37,
        39,
        41,
        42,
        44,
        46,
        48,
        49,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad explicit nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const outputSizes = [3, 3];
      const y = builder.maxPool2d(x, {windowDimensions, autoPad, padding, strides, layout, outputSizes});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 3, 3, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        17,
        19,
        21,
        31,
        33,
        35,
        45,
        47,
        49,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad explicit outputSizes=[3,3] nhwc   / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const outputSizes = [4, 4];
      const y = builder.maxPool2d(x, {windowDimensions, autoPad, padding, strides, layout, outputSizes});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        17,
        19,
        21,
        21,
        31,
        33,
        35,
        35,
        45,
        47,
        49,
        49,
        45,
        47,
        49,
        49,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad explicit outputSizes=[4,4] nhwc   / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const roundingType = 'floor';
      const y = builder.maxPool2d(x, {windowDimensions, autoPad, padding, strides, layout, roundingType});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 3, 3, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        17,
        19,
        21,
        31,
        33,
        35,
        45,
        47,
        49,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad explicit roundingType=floor nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const roundingType = 'ceil';
      const y = builder.maxPool2d(x, {windowDimensions, autoPad, padding, strides, layout, roundingType});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        17,
        19,
        21,
        21,
        31,
        33,
        35,
        35,
        45,
        47,
        49,
        49,
        45,
        47,
        49,
        49,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad explicit roundingType=ceil nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const strides = [2, 2];
      const autoPad = 'same-lower';
      const layout = 'nhwc';
      const y = builder.maxPool2d(x, {windowDimensions, autoPad, strides, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        9,
        11,
        13,
        14,
        23,
        25,
        27,
        28,
        37,
        39,
        41,
        42,
        44,
        46,
        48,
        49,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad same-lower nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 1]});
      const windowDimensions = [5, 5];
      const autoPad = 'same-upper';
      const layout = 'nhwc';
      const y = builder.maxPool2d(x, {windowDimensions, autoPad, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 5, 5, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        13, 14, 15, 15, 15, 18, 19, 20, 20, 20, 23, 24, 25,
        25, 25, 23, 24, 25, 25, 25, 23, 24, 25, 25, 25,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d autoPad same-upper nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 5, 5]});
      const windowDimensions = [2, 2];
      const strides = [2, 2];
      const y = builder.maxPool2d(x, {windowDimensions, strides});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 2, 2]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [7, 9, 17, 19];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d strides default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 1]});
      const windowDimensions = [2, 2];
      const strides = [2, 2];
      const layout = 'nhwc';
      const y = builder.maxPool2d(x, {windowDimensions, strides, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 2, 2, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [7, 9, 17, 19];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.maxPool2d, 'float32');
    }, `maxPool2d strides nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 4, 4]});
      const windowDimensions = [3, 3];
      const y = builder.averagePool2d(x, {windowDimensions});
      const inputs = {
        'x': new Float32Array(
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 2, 2]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [6, 7, 10, 11];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 4, 4, 1]});
      const windowDimensions = [3, 3];
      const layout = 'nhwc';
      const y = builder.averagePool2d(x, {windowDimensions, layout});
      const inputs = {
        'x': new Float32Array(
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 2, 2, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [6, 7, 10, 11];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 1]});
      const windowDimensions = [5, 5];
      const padding = [2, 2, 2, 2];
      const layout = 'nhwc';
      const y = builder.averagePool2d(x, {windowDimensions, padding, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 5, 5, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        7,    7.5, 8,    8.5, 9,    9.5, 10,   10.5, 11,   11.5, 12,   12.5, 13,
        13.5, 14,  14.5, 15,  15.5, 16,  16.5, 17,   17.5, 18,   18.5, 19,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d pads default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 1]});
      const windowDimensions = [5, 5];
      const padding = [2, 2, 2, 2];
      const layout = 'nhwc';
      const y = builder.averagePool2d(x, {windowDimensions, padding, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 5, 5, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        7,    7.5, 8,    8.5, 9,    9.5, 10,   10.5, 11,   11.5, 12,   12.5, 13,
        13.5, 14,  14.5, 15,  15.5, 16,  16.5, 17,   17.5, 18,   18.5, 19,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d pads nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 5, 5]});
      const windowDimensions = [5, 5];
      const autoPad = 'same-upper';
      const y = builder.averagePool2d(x, {windowDimensions, autoPad});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 5, 5]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        7,    7.5, 8,    8.5, 9,    9.5, 10,   10.5, 11,   11.5, 12,   12.5, 13,
        13.5, 14,  14.5, 15,  15.5, 16,  16.5, 17,   17.5, 18,   18.5, 19,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad same-upper default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 1]});
      const windowDimensions = [5, 5];
      const autoPad = 'same-upper';
      const layout = 'nhwc';
      const y = builder.averagePool2d(x, {windowDimensions, autoPad, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 5, 5, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        7,    7.5, 8,    8.5, 9,    9.5, 10,   10.5, 11,   11.5, 12,   12.5, 13,
        13.5, 14,  14.5, 15,  15.5, 16,  16.5, 17,   17.5, 18,   18.5, 19,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad same-upper nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [2, 1, 2, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const y = builder.averagePool2d(x, {windowDimensions, autoPad, padding, strides, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        5,
        6,
        8,
        9.5,
        12,
        13,
        15,
        16.5,
        26,
        27,
        29,
        30.5,
        36.5,
        37.5,
        39.5,
        41,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad explicit nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const outputSizes = [3, 3];
      const y = builder.averagePool2d(x, {windowDimensions, autoPad, padding, strides, layout, outputSizes});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 3, 3, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        9,
        10.5,
        12.5,
        19.5,
        21,
        23,
        33.5,
        35,
        37,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad explicit outputSizes=[3,3] nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const outputSizes = [4, 4];
      const y = builder.averagePool2d(x, {windowDimensions, autoPad, padding, strides, layout, outputSizes});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        9,
        10.5,
        12.5,
        13.5,
        19.5,
        21,
        23,
        24,
        33.5,
        35,
        37,
        38,
        40.5,
        42,
        44,
        45,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad explicit outputSizes=[4,4] nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const roundingType = 'floor';
      const y = builder.averagePool2d(x, {windowDimensions, autoPad, padding, strides, layout, roundingType});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 3, 3, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        9,
        10.5,
        12.5,
        19.5,
        21,
        23,
        33.5,
        35,
        37,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad explicit roundingType=floor nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const padding = [1, 1, 1, 1];
      const strides = [2, 2];
      const autoPad = 'explicit';
      const layout = 'nhwc';
      const roundingType = 'ceil';
      const y = builder.averagePool2d(x, {windowDimensions, autoPad, padding, strides, layout, roundingType});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        9,
        10.5,
        12.5,
        13.5,
        19.5,
        21,
        23,
        24,
        33.5,
        35,
        37,
        38,
        40.5,
        42,
        44,
        45,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad explicit roundingType=ceil nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 7, 7, 1]});
      const windowDimensions = [4, 4];
      const strides = [2, 2];
      const autoPad = 'same-lower';
      const layout = 'nhwc';
      const y =
          builder.averagePool2d(x, {windowDimensions, autoPad, strides, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 4, 4, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        5,
        6,
        8,
        9.5,
        12,
        13,
        15,
        16.5,
        26,
        27,
        29,
        30.5,
        36.5,
        37.5,
        39.5,
        41,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d autoPad same-lower nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 1, 5, 5]});
      const windowDimensions = [2, 2];
      const strides = [2, 2];
      const y = builder.averagePool2d(x, {windowDimensions, strides});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 2, 2, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [4, 6, 14, 16];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d strides default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 1]});
      const windowDimensions = [2, 2];
      const strides = [2, 2];
      const layout = 'nhwc';
      const y = builder.averagePool2d(x, {windowDimensions, strides, layout});
      const inputs = {
        'x': new Float32Array([
          1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13,
          14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 2, 2, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [4, 6, 14, 16];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `averagePool2d strides nhwc  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 3, 5, 5]});
      const y = builder.averagePool2d(x);
      const inputs = {
        'x': new Float32Array([
          -1.1289884,  0.34016284,  0.497431,    2.1915932,   0.42038894,
          -0.18261199, -0.15769927, -0.26465914, 0.03877424,  0.39492005,
          -0.33410737, 0.74918455,  -1.3542547,  -0.0222946,  0.7094626,
          -0.09399617, 0.790736,    -0.75826526, 0.27656242,  0.46543223,
          -1.2342638,  1.1549494,   0.24823844,  0.75670505,  -1.7108902,
          -1.4767597,  -1.4969662,  -0.31936142, 0.5327554,   -0.06070877,
          0.31212643,  2.2274113,   1.2775147,   0.59886885,  -1.5765078,
          0.18522178,  0.22655599,  0.88869494,  0.38609484,  -0.05860576,
          -0.72732115, -0.0046324,  -1.3593693,  -0.6295078,  1.384531,
          0.06825881,  0.19907428,  0.20298219,  -0.8399954,  1.3583295,
          0.02117888,  -1.0636739,  -0.30460566, -0.92678875, -0.09120782,
          -0.88333017, -0.9641269,  0.6065926,   -0.5830042,  -0.81138134,
          1.3569402,   1.2891295,   0.2508177,   0.20211531,  0.8832168,
          -0.19886094, -0.61088,    0.682026,    -0.5253442,  1.5022339,
          1.0256356,   1.0642492,   -0.4169051,  -0.8740329,  1.1494869,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 3, 1, 1]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        0.07170040239999997,
        0.05194737240000002,
        0.07117922839999995,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `global averagePool2d default  / ${deviceType} / ${executionType}`);

    promise_test(async () => {
      const x = builder.input('x', {type: 'float32', dimensions: [1, 5, 5, 3]});
      const layout = 'nhwc';
      const y = builder.averagePool2d(x, {layout});
      const inputs = {
        'x': new Float32Array([
          -1.1289884,  -1.4767597,  0.02117888,  0.34016284,  -1.4969662,
          -1.0636739,  0.497431,    -0.31936142, -0.30460566, 2.1915932,
          0.5327554,   -0.92678875, 0.42038894,  -0.06070877, -0.09120782,
          -0.18261199, 0.31212643,  -0.88333017, -0.15769927, 2.2274113,
          -0.9641269,  -0.26465914, 1.2775147,   0.6065926,   0.03877424,
          0.59886885,  -0.5830042,  0.39492005,  -1.5765078,  -0.81138134,
          -0.33410737, 0.18522178,  1.3569402,   0.74918455,  0.22655599,
          1.2891295,   -1.3542547,  0.88869494,  0.2508177,   -0.0222946,
          0.38609484,  0.20211531,  0.7094626,   -0.05860576, 0.8832168,
          -0.09399617, -0.72732115, -0.19886094, 0.790736,    -0.0046324,
          -0.61088,    -0.75826526, -1.3593693,  0.682026,    0.27656242,
          -0.6295078,  -0.5253442,  0.46543223,  1.384531,    1.5022339,
          -1.2342638,  0.06825881,  1.0256356,   1.1549494,   0.19907428,
          1.0642492,   0.24823844,  0.20298219,  -0.4169051,  0.75670505,
          -0.8399954,  -0.8740329,  -1.7108902,  1.3583295,   1.1494869,
        ]),
      };
      const outputs = {y: new Float32Array(sizeOfShape([1, 1, 1, 3]))};
      let graph;
      if (isSync) {
        graph = builder.build({y});
        context.compute(graph, inputs, outputs);
      } else {
        graph = await builder.buildAsync({y});
        await context.computeAsync(graph, inputs, outputs);
      }
      const expected = [
        0.07170040239999997,
        0.05194737240000002,
        0.07117922839999995,
      ];
      assert_array_approx_equals_ulp(outputs.y, expected, ULPTolerance.float32.averagePool2d, 'float32');
    }, `global averagePool2d nhwc  / ${deviceType} / ${executionType}`);
  });
});