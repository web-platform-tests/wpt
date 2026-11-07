// META: title=test WebNN API quantizeLinear rounding and saturation boundaries
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// Boundary cases for the quantizeLinear operation that the general
// quantizeLinear tests do not reach: quotients that land exactly on a
// rounding tie, results that clamp to the extremes of the output data
// type, and zero points that sit on an extreme of the output data type.
//
// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-quantizelinear
// The operation follows the expression:
//    output = clamp(roundEven(input / scale) + zeroPoint, min, max)
// where roundEven rounds halves to the nearest even value and [min, max]
// is the range of the output data type.
//
// Every input and scale below is a dyadic rational that is exactly
// representable in the input data type, so each quotient is exact and
// each expected output follows from the expression above with no
// rounding ambiguity.
//
// MLOperand quantizeLinear(
//     MLOperand input, MLOperand scale, MLOperand zeroPoint,
//     optional MLOperatorOptions options = {});

// The tolerance is 0 ULP, as for the data movement and logical operators
// in resources/utils.js: every expected output here is an exact integer.
// A nonzero allowance would defeat the purpose of the tie tests, because
// rounding a tie the wrong way changes the result by exactly 1.
const getQuantizeLinearBoundariesPrecisionTolerance = (graphResources) => {
  const toleranceValueDict = {int8: 0, uint8: 0};
  const expectedDataType =
      getExpectedDataTypeOfSingleOutput(graphResources.expectedOutputs);
  return {metricType: 'ULP', value: toleranceValueDict[expectedDataType]};
};

const quantizeLinearBoundariesTests = [
  {
    'name': 'quantizeLinear float32 1D tensor rounding ties to even with ' +
        'int8 zeroPoint',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [0.5, 1.5, 2.5, 3.5, -0.5, -1.5, -2.5, -3.5],
          'descriptor': {shape: [8], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [0, 2, 2, 4, 0, -2, -2, -4],
          'descriptor': {shape: [8], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D constant tensor rounding ties to ' +
        'even with int8 zeroPoint',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [0.5, 1.5, 2.5, 3.5, -0.5, -1.5, -2.5, -3.5],
          'descriptor': {shape: [8], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [0, 2, 2, 4, 0, -2, -2, -4],
          'descriptor': {shape: [8], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor rounding ties to even with ' +
        'uint8 zeroPoint',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [0.5, 1.5, 2.5, 3.5, 254.5, 255.5],
          'descriptor': {shape: [6], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'uint8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [0, 2, 2, 4, 254, 255],
          'descriptor': {shape: [6], dataType: 'uint8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor rounding ties to even ' +
        'through a scale of 2 with int8 zeroPoint',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [1, 3, 5, 7, -1, -3, -5, -7],
          'descriptor': {shape: [8], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [2],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [0, 2, 2, 4, 0, -2, -2, -4],
          'descriptor': {shape: [8], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor saturating with ' +
        'per-element scales and int8 zeroPoint',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [300, -300, 9],
          'descriptor': {shape: [3], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [2, 2, 4],
          'descriptor': {shape: [3], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0, 0, 127],
          'descriptor': {shape: [3], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [127, -128, 127],
          'descriptor': {shape: [3], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor saturating to the int8 ' +
        'range extremes',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [
            126.5, 127.5, 128, 300, 1073741824, -128.5, -129, -300,
            -1073741824
          ],
          'descriptor': {shape: [9], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [126, 127, 127, 127, 127, -128, -128, -128, -128],
          'descriptor': {shape: [9], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor saturating to the uint8 ' +
        'range extremes',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [-0.5, -0.75, -1, -300, 255.25, 255.5, 256, 300],
          'descriptor': {shape: [8], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'uint8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [0, 0, 0, 0, 255, 255, 255, 255],
          'descriptor': {shape: [8], dataType: 'uint8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor saturating through a scale ' +
        'of 0.5 with uint8 zeroPoint',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [127.75, 128, -1],
          'descriptor': {shape: [3], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [0.5],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'uint8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [255, 255, 0],
          'descriptor': {shape: [3], dataType: 'uint8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor with int8 zeroPoint at the ' +
        'maximum of the int8 range',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [0.5, 1, -1, -300, 300],
          'descriptor': {shape: [5], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [127],
          'descriptor': {shape: [1], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [127, 127, 126, -128, 127],
          'descriptor': {shape: [5], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor with int8 zeroPoint at the ' +
        'minimum of the int8 range',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [-0.5, -1, 1, 300, -300],
          'descriptor': {shape: [5], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [-128],
          'descriptor': {shape: [1], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [-128, -128, -127, 127, -128],
          'descriptor': {shape: [5], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 1D tensor with uint8 zeroPoint at ' +
        'the maximum of the uint8 range',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [0.5, 1, -1, -300],
          'descriptor': {shape: [4], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [255],
          'descriptor': {shape: [1], dataType: 'uint8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [255, 255, 254, 0],
          'descriptor': {shape: [4], dataType: 'uint8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float32 0D tensor saturating to the maximum ' +
        'of the int8 range',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [300],
          'descriptor': {shape: [], dataType: 'float32'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [], dataType: 'float32'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [127],
          'descriptor': {shape: [], dataType: 'int8'}
        }
      }
    }
  },
  {
    'name': 'quantizeLinear float16 1D tensor rounding ties to even and ' +
        'saturating with int8 zeroPoint',
    'graph': {
      'inputs': {
        'quantizeLinearInput': {
          'data': [0.5, 1.5, 2.5, -2.5, 127.5, -128.5, 2048, -2048],
          'descriptor': {shape: [8], dataType: 'float16'},
          'constant': false
        },
        'quantizeLinearScale': {
          'data': [1],
          'descriptor': {shape: [1], dataType: 'float16'},
          'constant': true
        },
        'quantizeLinearZeroPoint': {
          'data': [0],
          'descriptor': {shape: [1], dataType: 'int8'},
          'constant': true
        }
      },
      'operators': [{
        'name': 'quantizeLinear',
        'arguments': [
          {'input': 'quantizeLinearInput'}, {'scale': 'quantizeLinearScale'},
          {'zeroPoint': 'quantizeLinearZeroPoint'}
        ],
        'outputs': 'quantizeLinearOutput'
      }],
      'expectedOutputs': {
        'quantizeLinearOutput': {
          'data': [0, 2, 2, -2, 127, -128, 127, -128],
          'descriptor': {shape: [8], dataType: 'int8'}
        }
      }
    }
  }
];

webnn_conformance_test(
    quantizeLinearBoundariesTests, buildAndExecuteGraph,
    getQuantizeLinearBoundariesPrecisionTolerance);
