// META: title=test WebNN API sigmoid operation on negative tails
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-sigmoid-method
// Compute the sigmoid function of the input tensor. The calculation follows the
// expression 1 / (exp(-x) + 1).
//
// MLOperand sigmoid(MLOperand input);
//
// Float32 inputs deep in the negative tail, where exp(-x) overflows float32 and
// the correctly rounded result is subnormal or zero. References were computed
// at 60 decimal digits and rounded once to binary32 (round to nearest even,
// including the subnormal range); see derive_references.py. The allowance is
// the existing sigmoid float32 entry in utils.js (34 ULP). The harness measures
// ULP distance on the binary32 bit pattern, so for a subnormal result the
// distance to zero is its integer bit pattern:
//
//   x     expected                class      units above zero
//   -80   1.8048513285848406e-35  normal     (exponent 2^-116; not flushable)
//   -88   6.054601485195952e-39   subnormal  4320708
//   -90   8.194008692231508e-40   subnormal  584744
//   -95   5.521115949439779e-42   subnormal  3940
//   -100  3.783505853677006e-44   subnormal  27
//   -104  0                       zero       0 (exact value is 0.485 quanta)
//
// Flushing the -88, -90 or -95 results to zero is outside the 34 ULP allowance.
// A zero result at -100 is within the allowance and is not a failure; at -104
// zero is the correctly rounded value.

const sigmoidTailInput = [
  -80.0, -88.0, -90.0, -95.0, -100.0, -104.0, -6.5, -0.5, 0.0, 0.75, 3.5, 12.0
];

const sigmoidTailOutput = [
  1.8048513285848406e-35, 6.054601485195952e-39, 8.194008692231508e-40,
  5.521115949439779e-42,  3.783505853677006e-44, 0.0,
  0.0015011822106316686,  0.3775406777858734,    0.5,
  0.6791787147521973,     0.970687747001648,     0.9999938607215881
];

const sigmoidNegativeTailTests = [
  {
    'name': 'sigmoid float32 1D tensor negative tails',
    'graph': {
      'inputs': {
        'sigmoidInput': {
          'data': sigmoidTailInput,
          'descriptor': {shape: [12], dataType: 'float32'}
        }
      },
      'operators': [{
        'name': 'sigmoid',
        'arguments': [{'input': 'sigmoidInput'}],
        'outputs': 'sigmoidOutput'
      }],
      'expectedOutputs': {
        'sigmoidOutput': {
          'data': sigmoidTailOutput,
          'descriptor': {shape: [12], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name': 'sigmoid float32 1D constant tensor negative tails',
    'graph': {
      'inputs': {
        'sigmoidInput': {
          'data': sigmoidTailInput,
          'descriptor': {shape: [12], dataType: 'float32'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'sigmoid',
        'arguments': [{'input': 'sigmoidInput'}],
        'outputs': 'sigmoidOutput'
      }],
      'expectedOutputs': {
        'sigmoidOutput': {
          'data': sigmoidTailOutput,
          'descriptor': {shape: [12], dataType: 'float32'}
        }
      }
    }
  },
  {
    'name': 'sigmoid float32 2D tensor negative tails',
    'graph': {
      'inputs': {
        'sigmoidInput': {
          'data': sigmoidTailInput,
          'descriptor': {shape: [2, 6], dataType: 'float32'}
        }
      },
      'operators': [{
        'name': 'sigmoid',
        'arguments': [{'input': 'sigmoidInput'}],
        'outputs': 'sigmoidOutput'
      }],
      'expectedOutputs': {
        'sigmoidOutput': {
          'data': sigmoidTailOutput,
          'descriptor': {shape: [2, 6], dataType: 'float32'}
        }
      }
    }
  },
  {
    // Subnormal result 4320708 units above zero: must not be flushed.
    'name': 'sigmoid float32 0D tensor negative tail -88',
    'graph': {
      'inputs': {
        'sigmoidInput': {
          'data': [-88.0],
          'descriptor': {shape: [], dataType: 'float32'}
        }
      },
      'operators': [{
        'name': 'sigmoid',
        'arguments': [{'input': 'sigmoidInput'}],
        'outputs': 'sigmoidOutput'
      }],
      'expectedOutputs': {
        'sigmoidOutput': {
          'data': [6.054601485195952e-39],
          'descriptor': {shape: [], dataType: 'float32'}
        }
      }
    }
  },
  {
    // Subnormal result 27 units above zero: a zero result passes at 34 ULP.
    'name': 'sigmoid float32 0D tensor negative tail -100',
    'graph': {
      'inputs': {
        'sigmoidInput': {
          'data': [-100.0],
          'descriptor': {shape: [], dataType: 'float32'}
        }
      },
      'operators': [{
        'name': 'sigmoid',
        'arguments': [{'input': 'sigmoidInput'}],
        'outputs': 'sigmoidOutput'
      }],
      'expectedOutputs': {
        'sigmoidOutput': {
          'data': [3.783505853677006e-44],
          'descriptor': {shape: [], dataType: 'float32'}
        }
      }
    }
  }
];

webnn_conformance_test(
    sigmoidNegativeTailTests, buildAndExecuteGraph, getPrecisionTolerance);
