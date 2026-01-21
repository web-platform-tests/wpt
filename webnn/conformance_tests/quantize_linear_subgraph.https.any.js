// META: title=test WebNN API subgraph with quantizeLinear and relu operations
// META: global=window,dedicatedworker
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';


// This is used to validate an issue(crbug.com//376498175) for
// using the operand which has be reshaped inside the dequantizelinear in other
// operation.
//      [input]  [zeroPoint]   [scale]
//          \        |       /    |
//         [quantizeLinear]     [relu]
//               |                 |
//              [outout_0]      [output_1]

const subgraphTests = [{
  'name': 'quantizeLinear + relu',
  'graph': {
    'inputs': {
      'input': {
        'data': [
          0.6124474406242371, 0.8857858777046204, 0.13667134940624237,
          0.5645291209220886, 0.8965172171592712, 0.36792829632759094,
          0.6811466217041016, 0.0479511022567749, 0.33355462551116943,
          0.19882695376873016, 0.41167140007019043, 0.07934240251779556
        ],
        'descriptor': {shape: [1, 1, 4, 3], dataType: 'float32'}
      },
      'scale': {
        'data': [
          0.3804761469364166, -0.5280312299728394, 0.21947036683559418,
          -0.36689770221710205, 0.33974137902259827, -0.4200059771537781
        ],
        'descriptor': {shape: [2, 3], dataType: 'float32'},
      },
      'zeroPoint': {
        'data': [11, 123, 24, 46, 23, 56],
        'descriptor': {shape: [2, 3], dataType: 'int8'},
      }
    },
    'operators': [
      {
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'input'}, {'scale': 'scale'}, {'zeroPoint': 'zeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      },
      {
        'name': 'relu',
        'arguments': [{'input': 'scale'}],
        'outputs': 'reluOutput'
      },
    ],
    'expectedOutputs': {
      'quantizeLinearOutput': {
        'data': [13, 121, 25, 12, 121, 26, 44, 23, 55, 45, 24, 56],
        'descriptor': {shape: [1, 1, 4, 3], dataType: 'int8'}
      },
      'reluOutput': {
        'data': [
          0.3804761469364166, 0, 0.21947036683559418, 0, 0.33974137902259827, 0
        ],
        'descriptor': {shape: [2, 3], dataType: 'float32'}
      }
    }
  }
}];

if (navigator.ml) {
  subgraphTests.forEach((test) => {
    webnn_conformance_test(buildAndExecuteGraph, getPrecisionTolerance, test);
  });
} else {
  test(() => assert_implements(navigator.ml, 'missing navigator.ml'));
}
