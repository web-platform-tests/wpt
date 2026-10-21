// META: title=test WebNN API matmul with independent constant weight branches
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-matmul
// Compute the matrix product of two input tensors.
// MLOperand matmul(MLOperand a, MLOperand b);
//
// One runtime input X of shape [2, 32] passes through one identity and feeds four
// independent matmuls against
// constant weights of shapes [32, 2], [32, 3], [32, 5] and [32, 2]. The two
// [32, 2] weights hold different values and every element of output1 differs
// from output4, so a misbound or aliased branch is visible. X holds multiples
// of 1/16 in [-2, 2) and the weights multiples of 1/8 in [-2, 2], so every
// product is a multiple of 2^-7 with magnitude at most 4 and every partial sum
// of at most 32 products has magnitude below 2^7: all are exactly representable
// in float32, whatever the accumulation order, and the expected outputs are the
// exact rational dot products. Generated with MINSTD seeds 20261022 (X) and
// 20261023..20261026 (weights); see derive_references.py.

// Each output is an independent matmul over the same K = 32. The allowance is
// the existing per-matmul 2 * K from utils.js, applied to every output. It is
// not multiplied by the number of branches: the generic getPrecisionTolerance
// would sum the four matmul entries into 8 * K.
const getMatmulBranchesPrecisionTolerance = (graphResources) => {
  const shapeX = graphResources.inputs['inputX'].descriptor.shape;
  const tolerance = shapeX[shapeX.length - 1] * 2;
  return {metricType: 'ULP', value: tolerance};
};

const inputX = [
  -1.4375, -0.5,    -1.625,  0.0625,  1.5625,  -1.625,  -1.125,  0.375,
  1.3125,  0.25,    -0.8125, -0.375,  0.125,   -0.1875, 1.8125,  0.3125,
  0.5,     1.0625,  -1.9375, -0.5,    -1.75,   1.9375,  -0.125,  -1.5625,
  -1.75,   -1.8125, 1.0,     0.75,    -0.5625, -2.0,    1.625,   1.625,
  -0.375,  -1.75,   1.125,   0.1875,  -1.25,   -1.4375, 1.1875,  0.6875,
  -1.9375, -0.5625, 0.1875,  1.1875,  -1.8125, 1.3125,  -1.9375, 1.625,
  -1.75,   -0.25,   -0.3125, -0.125,  1.25,    -1.5,    -1.375,  0.125,
  -1.0,    -1.5625, -1.375,  0.5,     -1.3125, -0.9375, -1.375,  -1.0
];

const weight1 = [
  -1.75,  -0.25,  -1.75,  -0.375, -1.625, -2.0,   -1.375, 0.5,    -0.75,
  -0.875, 1.375,  0.875,  -1.875, -1.0,   0.375,  0.375,  -1.25,  0.625,
  1.875,  0.875,  0.25,   0.375,  0.0,    -0.875, 0.0,    0.25,   0.875,
  -2.0,   1.125,  1.0,    1.625,  -0.375, -2.0,   0.0,    -1.0,   -0.25,
  0.625,  -2.0,   2.0,    1.375,  -2.0,   1.625,  0.25,   0.0,    1.875,
  -1.375, 0.75,   -1.375, -0.875, 0.625,  1.125,  -1.75,  -1.875, 1.75,
  1.625,  -0.25,  -0.875, 0.625,  -0.75,  -1.875, 1.125,  -0.375, 0.375,
  -0.625
];

const weight2 = [
  1.375,  -0.625, -0.375, 1.5,    -2.0,   0.375,  1.5,    1.125,  1.625,
  1.5,    -0.375, -1.5,   1.875,  -0.75,  0.75,   -2.0,   -1.875, -0.75,
  1.25,   -0.375, 1.25,   1.25,   -0.625, 0.125,  -0.5,   0.25,   2.0,
  1.625,  -0.125, -0.25,  -1.0,   -2.0,   0.5,    -1.25,  -0.875, 1.125,
  -0.125, -1.375, -0.375, 1.625,  0.25,   1.125,  -1.125, 1.75,   -0.5,
  -0.875, 2.0,    1.75,   0.375,  -1.5,   -1.375, -1.625, 0.25,   1.0,
  -1.25,  -0.625, 0.125,  1.25,   -0.125, -1.625, 0.25,   -2.0,   1.875,
  -0.25,  1.5,    -1.0,   2.0,    -0.25,  0.75,   1.0,    1.875,  -0.5,
  1.875,  -1.0,   -0.375, -1.625, -0.75,  1.875,  0.625,  1.5,    -0.5,
  0.375,  1.375,  1.375,  -0.875, -0.375, -1.625, 1.625,  -1.125, -0.375,
  0.75,   -0.25,  -2.0,   -0.875, -1.125, -1.25
];

const weight3 = [
  0.375,  -1.0,   1.0,    -0.75,  1.75,   -1.25,  0.125,  1.75,   0.0,
  -0.25,  2.0,    0.125,  1.375,  -0.5,   1.0,    -0.125, 1.625,  2.0,
  0.625,  -1.5,   -1.75,  -1.875, -1.25,  1.0,    -1.0,   0.25,   -1.0,
  1.25,   -1.375, -1.625, 0.375,  0.375,  -1.0,   1.625,  -0.875, -1.625,
  -0.875, -0.625, 1.25,   1.875,  -1.625, 0.5,    1.75,   -0.5,   1.375,
  -0.375, -0.875, 0.625,  1.625,  0.5,    0.25,   -1.5,   -1.875, 0.125,
  0.0,    -1.125, 1.0,    1.75,   0.5,    -1.375, -0.75,  0.5,    -0.75,
  0.0,    -0.75,  0.75,   -1.625, -1.75,  -0.875, -0.25,  1.375,  1.625,
  -1.5,   1.5,    0.0,    1.0,    0.625,  -2.0,   -2.0,   1.125,  -1.375,
  1.75,   0.5,    -0.375, 1.75,   -1.625, -0.625, 0.125,  -0.125, 1.0,
  2.0,    -1.625, 1.875,  1.875,  -0.25,  1.875,  -1.5,   0.125,  1.625,
  -0.625, 1.125,  1.375,  -1.125, 0.0,    -0.5,   1.0,    1.375,  0.75,
  -1.75,  -1.875, -1.25,  -0.375, -0.25,  0.375,  1.0,    1.375,  -0.5,
  1.0,    -1.25,  -1.125, 1.125,  -1.75,  0.0,    -1.875, -0.75,  0.875,
  -1.625, -2.0,   0.375,  0.625,  1.75,   0.375,  1.75,   1.25,   -1.375,
  1.875,  0.875,  0.375,  -2.0,   -1.625, -1.375, 1.375,  -0.875, -2.0,
  1.25,   -1.375, -1.25,  1.25,   0.125,  -0.875, -0.5,   -1.875, 0.125,
  -2.0,   2.0,    -1.875, 0.625,  0.0,    0.0,    -1.125
];

// Same shape as weight1, different contents.
const weight4 = [
  -0.625, -1.375, -1.625, 1.125,  1.375,  1.25,   -1.125, -1.875, -1.625,
  -2.0,   0.25,   1.875,  1.0,    -0.25,  1.375,  1.625,  1.0,    0.625,
  0.125,  1.375,  -0.625, -0.875, -1.875, 1.875,  -1.5,   0.25,   0.0,
  0.75,   1.5,    1.25,   1.75,   -1.25,  1.625,  0.5,    -0.75,  -0.125,
  -1.5,   0.0,    -1.25,  2.0,    0.75,   0.0,    0.375,  1.25,   -1.0,
  0.125,  0.375,  -0.375, -1.25,  -1.625, 1.875,  -1.375, 0.125,  -0.625,
  1.25,   -1.5,   2.0,    -1.75,  1.125,  -1.125, -1.625, -1.25,  0.875,
  0.375
];

const output1 = [7.3671875, 13.28125, 2.03125, -4.875];
const output2 =
    [-6.296875, 18.1015625, -9.6484375, 0.7109375, 10.953125, 16.78125];
const output3 = [
  -16.765625, 15.9375, -4.875, -0.1875, 3.0703125, 14.25, 2.9140625,
  -9.5234375, 2.3984375, -1.3359375
];
const output4 = [-0.7578125, 4.4296875, 2.7421875, 1.7734375];

// Fresh descriptor objects per test: the harness may annotate descriptors.
const branchInputs = () => ({
  'inputX':
      {'data': inputX, 'descriptor': {shape: [2, 32], dataType: 'float32'}},
  'weight1': {
    'data': weight1,
    'descriptor': {shape: [32, 2], dataType: 'float32'},
    'constant': true
  },
  'weight2': {
    'data': weight2,
    'descriptor': {shape: [32, 3], dataType: 'float32'},
    'constant': true
  },
  'weight3': {
    'data': weight3,
    'descriptor': {shape: [32, 5], dataType: 'float32'},
    'constant': true
  },
  'weight4': {
    'data': weight4,
    'descriptor': {shape: [32, 2], dataType: 'float32'},
    'constant': true
  }
});

const branchMatmul = (index, outputName) => ({
  'name': 'matmul',
  'arguments': [{'a': 'activation'}, {'b': `weight${index}`}],
  'outputs': outputName
});

const matmulConstantWeightBranchTests = [
  {
    'name': 'matmul float32 four constant weight branches',
    'graph': {
      'inputs': branchInputs(),
      'operators': [
        {
          'name': 'identity',
          'arguments': [{'input': 'inputX'}],
          'outputs': 'activation'
        },
        branchMatmul(1, 'output1'), branchMatmul(2, 'output2'),
        branchMatmul(3, 'output3'), branchMatmul(4, 'output4')
      ],
      'expectedOutputs': {
        'output1': {
          'data': output1,
          'descriptor': {shape: [2, 2], dataType: 'float32'}
        },
        'output2': {
          'data': output2,
          'descriptor': {shape: [2, 3], dataType: 'float32'}
        },
        'output3': {
          'data': output3,
          'descriptor': {shape: [2, 5], dataType: 'float32'}
        },
        'output4': {
          'data': output4,
          'descriptor': {shape: [2, 2], dataType: 'float32'}
        }
      }
    }
  },
  {
    // The fourth branch passes through a zero-loss reshape before the output.
    'name':
        'matmul float32 four constant weight branches one reshaped',
    'graph': {
      'inputs': branchInputs(),
      'operators': [
        {
          'name': 'identity',
          'arguments': [{'input': 'inputX'}],
          'outputs': 'activation'
        },
        branchMatmul(1, 'output1'), branchMatmul(2, 'output2'),
        branchMatmul(3, 'output3'), branchMatmul(4, 'matmul4'),
        {
          'name': 'reshape',
          'arguments': [{'input': 'matmul4'}, {'newShape': [4]}],
          'outputs': 'output4'
        }
      ],
      'expectedOutputs': {
        'output1': {
          'data': output1,
          'descriptor': {shape: [2, 2], dataType: 'float32'}
        },
        'output2': {
          'data': output2,
          'descriptor': {shape: [2, 3], dataType: 'float32'}
        },
        'output3': {
          'data': output3,
          'descriptor': {shape: [2, 5], dataType: 'float32'}
        },
        'output4': {
          'data': output4,
          'descriptor': {shape: [4], dataType: 'float32'}
        }
      }
    }
  },
  {
    // Output declaration order differs from operator order.
    'name':
        'matmul float32 four constant weight branches permuted outputs',
    'graph': {
      'inputs': branchInputs(),
      'operators': [
        {
          'name': 'identity',
          'arguments': [{'input': 'inputX'}],
          'outputs': 'activation'
        },
        branchMatmul(1, 'output1'), branchMatmul(2, 'output2'),
        branchMatmul(3, 'output3'), branchMatmul(4, 'output4')
      ],
      'expectedOutputs': {
        'output3': {
          'data': output3,
          'descriptor': {shape: [2, 5], dataType: 'float32'}
        },
        'output1': {
          'data': output1,
          'descriptor': {shape: [2, 2], dataType: 'float32'}
        },
        'output4': {
          'data': output4,
          'descriptor': {shape: [2, 2], dataType: 'float32'}
        },
        'output2': {
          'data': output2,
          'descriptor': {shape: [2, 3], dataType: 'float32'}
        }
      }
    }
  }
];

webnn_conformance_test(
    matmulConstantWeightBranchTests, buildAndExecuteGraph,
    getMatmulBranchesPrecisionTolerance);
