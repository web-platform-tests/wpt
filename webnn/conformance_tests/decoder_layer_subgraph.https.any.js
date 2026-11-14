// META: title=test WebNN API decoder layer subgraphs
// META: global=window
// META: variant=?cpu
// META: variant=?gpu
// META: variant=?npu
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-softmax-method
// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-matmul
// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-reduce
// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-cast
// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-slice
// https://www.w3.org/TR/webnn/#api-mlgraphbuilder-concat
//
// Small composed graphs cut from a transformer decoder layer, each crossing a
// boundary between operations where single-operation tests pass and the
// composition fails on some implementations:
//
// 1. Masked attention: an additive causal mask is added to scaled scores and
//    the sum goes into softmax. The float32 mask uses the largest finite
//    float32, -3.4028234663852886e38 (an additive mask table), the float16
//    mask uses -1e4. One float16 graph feeds the mask as float32 and casts it
//    to float16 inside the graph. Masked entries have probability exactly 0;
//    the first row of each head attends to one slot, so its output is the
//    first value row exactly.
// 2. Grouped-query attention as a rank-5 product: the query is
//    [1, kvHeads = 1, groups = 2, 4, 4] and the single key/value head
//    [1, 1, 1, 4, 4] broadcasts over the group dimension in matmul and the
//    mask [1, 1, 1, 4, 4] in add. The result reshaped to [1, 2, 4, 4] equals
//    the rank-4 attention output exactly: the same real numbers are computed.
// 3. RMSNorm decomposed as mul, reduceMean, add epsilon, sqrt, div, mul
//    weight. The float16 variant casts the float16 input to float32 before
//    the statistics and the normalized float32 result back to float16: three
//    of its rows have sums of squares above the float16 maximum 65504 (one
//    square alone is 65536), so statistics kept in float16 overflow while the
//    declared float32 statistics are finite and exact.
// 4. A key cache carried across turns: slice at [0, 0, 1, 0] drops the oldest
//    slot and concat along the slot axis appends the new key. Two chained
//    turns in one graph; a third graph scores a query against the carried
//    cache (transpose, matmul, mul).
//
// Shapes: hidden 8, 4 slots, 2 query heads sharing 1 key/value head, head size
// 4, so the softmax scale 1 / sqrt(4) = 0.5 is exact. Every input is a
// hand-written dyadic value exactly representable in float16 and float32, and
// every attention score is an exact multiple of 1/16 below 8, so the only
// inexact operations are softmax, the probability-weighted sum, and the
// RMSNorm statistics, root, quotient and product.
//
// References: the composed graph evaluated in binary64 (numpy float64) without
// rounding any intermediate, rounded once to the output dtype with round to
// nearest even; cross-checked with mpmath at 50 digits (both roundings agree
// element for element). See derive_references.py next to this file's
// submission notes.
//
// Tolerance: the shared getPrecisionTolerance sums one allowance per operator
// (matmul 2 * K, softmax 3 * N + 3, reduceMean R + 2, add and mul 1, data
// movement and cast 0). It has no entry for sqrt and div, whose standalone
// files keep 1 and 2 ULP locally; this file adds those two entries and
// otherwise uses the shared sum, so each graph's budget is:
//   attention (rank 4 and rank 5): 0 + 8 + 1 + 1 + 15 + 8 (+ 0) = 33 ULP
//   RMSNorm:  (0) + 1 + 10 + 1 + 1 + 2 + 1 (+ 0) = 16 ULP
//   carry, two turns: 0 ULP (slice and concat only)
//   carry then scores: 0 + 0 + 0 + 8 + 1 = 9 ULP (applied to both outputs)
// For float16 outputs the same counts apply in float16 ULP.

const getDecoderLayerSubgraphPrecisionTolerance =
    (graphResources, intermediateOperands) => {
      const localToleranceDict = {sqrt: 1, div: 2};
      let toleranceValue =
          getPrecisionTolerance(graphResources, intermediateOperands).value;
      graphResources.operators.forEach(op => {
        toleranceValue += localToleranceDict[op.name] ?? 0;
      });
      return {metricType: 'ULP', value: toleranceValue};
    };

// Shape [1, 2, 4, 4]: two query heads, 4 slots, head size 4.
const attentionQuery = [
  1.0, -0.5, 0.25, 0.75, -1.25, 0.5, 1.0, -0.25, 0.5, 1.5, -0.75, 0.25, -0.25,
  -1.0, 0.5, 1.25, 0.75, 0.25, -1.0, 0.5, 1.25, -0.75, 0.25, -1.5, -0.5, 1.0,
  0.75, 0.25, 0.25, -1.25, -0.5, 1.0
];

// Shape [1, 1, 4, 4]: the single shared key head, slots by head size.
const attentionKey = [
  0.5, 1.0, -0.25, 0.75, -1.0, 0.25, 0.5, -0.5, 0.75, -0.75, 1.25, 0.25, 0.25,
  0.5, -1.0, 1.5
];

// Shape [1, 1, 4, 4]: the single shared value head.
const attentionValue = [
  1.0, 0.5, -0.5, 0.25, -0.25, 1.25, 0.75, -1.0, 0.5, -0.75, 1.0, 0.5, 0.75,
  0.25, -1.25, 1.0
];

// Shape [1, 1, 4, 4]: 0 on and below the diagonal, the largest finite float32
// above it.
const causalMaskFloat32 = [
  0.0, -3.4028234663852886e38, -3.4028234663852886e38, -3.4028234663852886e38,
  0.0, 0.0, -3.4028234663852886e38, -3.4028234663852886e38, 0.0, 0.0, 0.0,
  -3.4028234663852886e38, 0.0, 0.0, 0.0, 0.0
];

// Shape [1, 1, 4, 4]: 0 on and below the diagonal, -1e4 above it.
const causalMaskFloat16 = [
  0.0, -10000.0, -10000.0, -10000.0, 0.0, 0.0, -10000.0, -10000.0, 0.0, 0.0,
  0.0, -10000.0, 0.0, 0.0, 0.0, 0.0
];

// Shape [1, 2, 4, 4] (rank-4 graphs) and the reshaped rank-5 result.
const attentionOutputFloat32 = [
  1.0, 0.5, -0.5, 0.25, 0.021671900525689125, 1.0869969129562378,
  0.4783281087875366, -0.7283281087875366, 0.7207164764404297,
  0.4985322058200836, -0.11165975034236908, 0.052509013563394547,
  0.5341713428497314, 0.047430649399757385, 0.0819656103849411,
  0.36670738458633423, 1.0, 0.5, -0.5, 0.25, 0.25916674733161926,
  0.9444999694824219, 0.24083325266838074, -0.49083325266838074,
  0.3740961253643036, 0.515402615070343, 0.3582521080970764,
  -0.2016427218914032, 0.6151391863822937, 0.10420692712068558,
  -0.23674827814102173, 0.5055254101753235
];

const attentionOutputFloat16 = [
  1.0, 0.5, -0.5, 0.25, 0.02166748046875, 1.0869140625, 0.478271484375,
  -0.728515625, 0.720703125, 0.49853515625, -0.11163330078125,
  0.052520751953125, 0.5341796875, 0.04742431640625, 0.08197021484375,
  0.36669921875, 1.0, 0.5, -0.5, 0.25, 0.25927734375, 0.9443359375,
  0.2408447265625, -0.49072265625, 0.3740234375, 0.515625, 0.358154296875,
  -0.20166015625, 0.615234375, 0.10418701171875, -0.2366943359375,
  0.50537109375
];

// Shape [1, 4, 8].
const rmsNormInputFloat32 = [
  1.0, -0.5, 0.25, 0.75, -1.25, 0.5, 1.0, -0.25, 2.0, -1.5, 0.125, -0.375,
  1.75, -2.0, 0.625, 0.875, -0.125, 0.25, -0.5, 1.0, -2.0, 3.0, -1.5, 0.375,
  0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5
];

// Shape [8].
const rmsNormWeightFloat32 = [1.0, 1.25, 0.75, 1.5, 0.5, 1.0, 2.0, 0.25];

const rmsNormOutputFloat32 = [
  1.2977546453475952, -0.8110966682434082, 0.2433290034532547,
  1.4599740505218506, -0.8110966682434082, 0.6488773226737976,
  2.5955092906951904, -0.0811096653342247, 1.4791944026947021,
  -1.386744737625122, 0.06933723390102386, -0.4160234034061432,
  0.647147536277771, -1.4791944026947021, 0.9244964718818665,
  0.16178688406944275, -0.08646722137928009, 0.21616806089878082,
  -0.25940167903900146, 1.0376067161560059, -0.6917377710342407,
  2.0752134323120117, -2.0752134323120117, 0.06485041975975037,
  0.999969482421875, 1.2499618530273438, 0.7499771118164062,
  1.4999542236328125, -0.4999847412109375, -0.999969482421875,
  -1.99993896484375, -0.24999237060546875
];

// Shape [1, 4, 8]: the sums of squares of rows 0 to 2 are 281600, 67520 and
// 66901.25, all above the float16 maximum; row 3 sums to 12.75.
const rmsNormInputFloat16 = [
  192.0, -224.0, 160.0, -128.0, 240.0, -176.0, 208.0, -144.0, 96.0, 112.0,
  -80.0, 64.0, -48.0, 120.0, -104.0, 88.0, -256.0, 32.0, 16.0, -8.0, 4.0, 2.0,
  1.0, 0.5, 1.5, -0.75, 0.25, 2.0, -1.0, 0.5, 1.25, -1.75
];

// Shape [8], float32: multiplies the float32 normalized values before the
// cast back to float16.
const rmsNormWeightForFloat16Graph =
    [1.0, 0.75, 1.25, 0.5, 1.5, 2.0, 0.25, 1.0];

const rmsNormOutputFloat16 = [
  1.0234375, -0.8955078125, 1.06640625, -0.341064453125, 1.9189453125,
  -1.8759765625, 0.277099609375, -0.767578125, 1.044921875, 0.91455078125,
  -1.0888671875, 0.348388671875, -0.78369140625, 2.61328125, -0.282958984375,
  0.9580078125, -2.798828125, 0.262451171875, 0.21875, -0.043731689453125,
  0.06561279296875, 0.043731689453125, 0.0027332305908203125,
  0.005466461181640625, 1.1884765625, -0.445556640625, 0.24755859375,
  0.7919921875, -1.1884765625, 0.7919921875, 0.24755859375, -1.3857421875
];

// Shape [1, 1, 4, 4]: four key slots of head size 4, oldest first.
const kvCache = [
  0.5, -1.0, 1.5, -2.0, 1.25, 0.25, -0.75, 1.75, -1.5, 2.0, 0.75, -0.25, 0.125,
  -0.625, 1.0, 0.375
];

// Shape [1, 1, 1, 4].
const kvNewKey1 = [2.25, -1.125, 0.875, -0.5];
const kvNewKey2 = [-0.375, 1.625, -2.25, 1.125];
const kvQuery = [1.0, -0.5, 0.25, 0.75];

// Slots 1, 2, 3 of kvCache followed by kvNewKey1.
const kvCacheAfterOneTurn = [
  1.25, 0.25, -0.75, 1.75, -1.5, 2.0, 0.75, -0.25, 0.125, -0.625, 1.0, 0.375,
  2.25, -1.125, 0.875, -0.5
];

// Slots 2, 3 of kvCache, kvNewKey1, kvNewKey2.
const kvCacheAfterTwoTurns = [
  -1.5, 2.0, 0.75, -0.25, 0.125, -0.625, 1.0, 0.375, 2.25, -1.125, 0.875, -0.5,
  -0.375, 1.625, -2.25, 1.125
];

// kvQuery against each slot of kvCacheAfterOneTurn, times 0.5; exact.
const kvScoresAfterOneTurn = [1.125, -1.25, 0.484375, 1.328125];

// Fresh descriptor and operator objects per test: the harness may annotate
// descriptors and replaces operand names inside option dictionaries.
const scaleConstant = (dataType) => ({
  'data': [0.5],
  'descriptor': {shape: [], dataType},
  'constant': true
});

const attentionInputs = (dataType, maskResource) => ({
  'query': {
    'data': attentionQuery,
    'descriptor': {shape: [1, 2, 4, 4], dataType}
  },
  'key': {'data': attentionKey, 'descriptor': {shape: [1, 1, 4, 4], dataType}},
  'value': {
    'data': attentionValue,
    'descriptor': {shape: [1, 1, 4, 4], dataType}
  },
  'mask': maskResource,
  'scale': scaleConstant(dataType)
});

// transpose(key) -> matmul -> mul scale -> add mask -> softmax -> matmul value.
// `maskOperand` names the operand added to the scaled scores.
const attentionOperators = (maskOperand) => [
  {
    'name': 'transpose',
    'arguments':
        [{'input': 'key'}, {'options': {'permutation': [0, 1, 3, 2]}}],
    'outputs': 'keyTransposed'
  },
  {
    'name': 'matmul',
    'arguments': [{'a': 'query'}, {'b': 'keyTransposed'}],
    'outputs': 'scores'
  },
  {
    'name': 'mul',
    'arguments': [{'a': 'scores'}, {'b': 'scale'}],
    'outputs': 'scaledScores'
  },
  {
    'name': 'add',
    'arguments': [{'a': 'scaledScores'}, {'b': maskOperand}],
    'outputs': 'maskedScores'
  },
  {
    'name': 'softmax',
    'arguments': [{'input': 'maskedScores'}, {'axis': 3}],
    'outputs': 'probabilities'
  },
  {
    'name': 'matmul',
    'arguments': [{'a': 'probabilities'}, {'b': 'value'}],
    'outputs': 'output'
  }
];

const attentionExpectedOutputs = (dataType, data) => ({
  'output': {'data': data, 'descriptor': {shape: [1, 2, 4, 4], dataType}}
});

const groupedQueryInputs = (dataType, maskData) => ({
  'query5': {
    'data': attentionQuery,
    'descriptor': {shape: [1, 1, 2, 4, 4], dataType}
  },
  'key5': {
    'data': attentionKey,
    'descriptor': {shape: [1, 1, 1, 4, 4], dataType}
  },
  'value5': {
    'data': attentionValue,
    'descriptor': {shape: [1, 1, 1, 4, 4], dataType}
  },
  'mask5': {
    'data': maskData,
    'descriptor': {shape: [1, 1, 1, 4, 4], dataType},
    'constant': true
  },
  'scale': scaleConstant(dataType)
});

const groupedQueryOperators = () => [
  {
    'name': 'transpose',
    'arguments':
        [{'input': 'key5'}, {'options': {'permutation': [0, 1, 2, 4, 3]}}],
    'outputs': 'key5Transposed'
  },
  {
    'name': 'matmul',
    'arguments': [{'a': 'query5'}, {'b': 'key5Transposed'}],
    'outputs': 'scores5'
  },
  {
    'name': 'mul',
    'arguments': [{'a': 'scores5'}, {'b': 'scale'}],
    'outputs': 'scaledScores5'
  },
  {
    'name': 'add',
    'arguments': [{'a': 'scaledScores5'}, {'b': 'mask5'}],
    'outputs': 'maskedScores5'
  },
  {
    'name': 'softmax',
    'arguments': [{'input': 'maskedScores5'}, {'axis': 4}],
    'outputs': 'probabilities5'
  },
  {
    'name': 'matmul',
    'arguments': [{'a': 'probabilities5'}, {'b': 'value5'}],
    'outputs': 'context5'
  },
  {
    'name': 'reshape',
    'arguments': [{'input': 'context5'}, {'newShape': [1, 2, 4, 4]}],
    'outputs': 'output'
  }
];

const epsilonConstant = () => ({
  'data': [1.52587890625e-05],
  'descriptor': {shape: [], dataType: 'float32'},
  'constant': true
});

// mul -> reduceMean over the hidden axis -> add epsilon -> sqrt -> div -> mul
// weight, with `source` naming the operand that is both squared and divided
// and `outputOperand` the weighted result.
const rmsNormOperators = (source, outputOperand) => [
  {
    'name': 'mul',
    'arguments': [{'a': source}, {'b': source}],
    'outputs': 'squares'
  },
  {
    'name': 'reduceMean',
    'arguments': [
      {'input': 'squares'},
      {'options': {'axes': [2], 'keepDimensions': true}}
    ],
    'outputs': 'meanSquares'
  },
  {
    'name': 'add',
    'arguments': [{'a': 'meanSquares'}, {'b': 'epsilon'}],
    'outputs': 'variance'
  },
  {
    'name': 'sqrt',
    'arguments': [{'input': 'variance'}],
    'outputs': 'rootMeanSquare'
  },
  {
    'name': 'div',
    'arguments': [{'a': source}, {'b': 'rootMeanSquare'}],
    'outputs': 'normalized'
  },
  {
    'name': 'mul',
    'arguments': [{'a': 'normalized'}, {'b': 'weight'}],
    'outputs': outputOperand
  }
];

const kvCarryInputs = (dataType, extra) => Object.assign(
    {
      'cache': {'data': kvCache, 'descriptor': {shape: [1, 1, 4, 4], dataType}},
      'newKey1':
          {'data': kvNewKey1, 'descriptor': {shape: [1, 1, 1, 4], dataType}}
    },
    extra);

const kvCarryTurn = (cacheOperand, newKeyOperand, keptOperand, outputOperand) =>
    [
      {
        'name': 'slice',
        'arguments': [
          {'input': cacheOperand}, {'starts': [0, 0, 1, 0]},
          {'sizes': [1, 1, 3, 4]}
        ],
        'outputs': keptOperand
      },
      {
        'name': 'concat',
        'arguments': [{'inputs': [keptOperand, newKeyOperand]}, {'axis': 2}],
        'outputs': outputOperand
      }
    ];

const decoderLayerSubgraphTests = [
  {
    'name': 'attention float32 runtime mask of the largest finite float32',
    'graph': {
      'inputs': attentionInputs('float32', {
        'data': causalMaskFloat32,
        'descriptor': {shape: [1, 1, 4, 4], dataType: 'float32'}
      }),
      'operators': attentionOperators('mask'),
      'expectedOutputs':
          attentionExpectedOutputs('float32', attentionOutputFloat32)
    }
  },
  {
    'name': 'attention float32 constant mask of the largest finite float32',
    'graph': {
      'inputs': attentionInputs('float32', {
        'data': causalMaskFloat32,
        'descriptor': {shape: [1, 1, 4, 4], dataType: 'float32'},
        'constant': true
      }),
      'operators': attentionOperators('mask'),
      'expectedOutputs':
          attentionExpectedOutputs('float32', attentionOutputFloat32)
    }
  },
  {
    'name': 'attention float16 constant mask -1e4',
    'graph': {
      'inputs': attentionInputs('float16', {
        'data': causalMaskFloat16,
        'descriptor': {shape: [1, 1, 4, 4], dataType: 'float16'},
        'constant': true
      }),
      'operators': attentionOperators('mask'),
      'expectedOutputs':
          attentionExpectedOutputs('float16', attentionOutputFloat16)
    }
  },
  {
    // The mask table arrives as float32 rows and is cast to float16 inside
    // the graph before the add.
    'name': 'attention float16 float32 mask -1e4 cast to float16 in graph',
    'graph': {
      'inputs': attentionInputs('float16', {
        'data': causalMaskFloat16,
        'descriptor': {shape: [1, 1, 4, 4], dataType: 'float32'}
      }),
      'operators': [
        {
          'name': 'cast',
          'arguments': [{'input': 'mask'}, {'type': 'float16'}],
          'outputs': 'maskFloat16'
        },
        ...attentionOperators('maskFloat16')
      ],
      'expectedOutputs':
          attentionExpectedOutputs('float16', attentionOutputFloat16)
    }
  },
  {
    'name': 'grouped-query attention rank 5 float32 mask of the largest ' +
        'finite float32',
    'graph': {
      'inputs': groupedQueryInputs('float32', causalMaskFloat32),
      'operators': groupedQueryOperators(),
      'expectedOutputs':
          attentionExpectedOutputs('float32', attentionOutputFloat32)
    }
  },
  {
    'name': 'grouped-query attention rank 5 float16 mask -1e4',
    'graph': {
      'inputs': groupedQueryInputs('float16', causalMaskFloat16),
      'operators': groupedQueryOperators(),
      'expectedOutputs':
          attentionExpectedOutputs('float16', attentionOutputFloat16)
    }
  },
  {
    'name': 'rmsNorm decomposed float32',
    'graph': {
      'inputs': {
        'x': {
          'data': rmsNormInputFloat32,
          'descriptor': {shape: [1, 4, 8], dataType: 'float32'}
        },
        'weight': {
          'data': rmsNormWeightFloat32,
          'descriptor': {shape: [8], dataType: 'float32'},
          'constant': true
        },
        'epsilon': epsilonConstant()
      },
      'operators': [
        {
          'name': 'identity',
          'arguments': [{'input': 'x'}],
          'outputs': 'hidden'
        },
        ...rmsNormOperators('hidden', 'output')
      ],
      'expectedOutputs': {
        'output': {
          'data': rmsNormOutputFloat32,
          'descriptor': {shape: [1, 4, 8], dataType: 'float32'}
        }
      }
    }
  },
  {
    // Float16 activations around float32 statistics: the input is widened
    // before squaring and the weighted float32 result narrowed at the end.
    'name': 'rmsNorm decomposed float16 input and output with float32 ' +
        'statistics',
    'graph': {
      'inputs': {
        'x': {
          'data': rmsNormInputFloat16,
          'descriptor': {shape: [1, 4, 8], dataType: 'float16'}
        },
        'weight': {
          'data': rmsNormWeightForFloat16Graph,
          'descriptor': {shape: [8], dataType: 'float32'},
          'constant': true
        },
        'epsilon': epsilonConstant()
      },
      'operators': [
        {
          'name': 'cast',
          'arguments': [{'input': 'x'}, {'type': 'float32'}],
          'outputs': 'hidden'
        },
        ...rmsNormOperators('hidden', 'scaled'),
        {
          'name': 'cast',
          'arguments': [{'input': 'scaled'}, {'type': 'float16'}],
          'outputs': 'output'
        }
      ],
      'expectedOutputs': {
        'output': {
          'data': rmsNormOutputFloat16,
          'descriptor': {shape: [1, 4, 8], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name': 'key cache sliding carry two turns float16',
    'graph': {
      'inputs': kvCarryInputs('float16', {
        'newKey2': {
          'data': kvNewKey2,
          'descriptor': {shape: [1, 1, 1, 4], dataType: 'float16'}
        }
      }),
      'operators': [
        ...kvCarryTurn('cache', 'newKey1', 'kept1', 'cache1'),
        ...kvCarryTurn('cache1', 'newKey2', 'kept2', 'output')
      ],
      'expectedOutputs': {
        'output': {
          'data': kvCacheAfterTwoTurns,
          'descriptor': {shape: [1, 1, 4, 4], dataType: 'float16'}
        }
      }
    }
  },
  {
    'name': 'key cache sliding carry two turns float32',
    'graph': {
      'inputs': kvCarryInputs('float32', {
        'newKey2': {
          'data': kvNewKey2,
          'descriptor': {shape: [1, 1, 1, 4], dataType: 'float32'}
        }
      }),
      'operators': [
        ...kvCarryTurn('cache', 'newKey1', 'kept1', 'cache1'),
        ...kvCarryTurn('cache1', 'newKey2', 'kept2', 'output')
      ],
      'expectedOutputs': {
        'output': {
          'data': kvCacheAfterTwoTurns,
          'descriptor': {shape: [1, 1, 4, 4], dataType: 'float32'}
        }
      }
    }
  },
  {
    // The carried cache is both a graph output and the key operand of the
    // next score product.
    'name': 'key cache sliding carry then attention scores float16',
    'graph': {
      'inputs': kvCarryInputs('float16', {
        'query': {
          'data': kvQuery,
          'descriptor': {shape: [1, 1, 1, 4], dataType: 'float16'}
        },
        'scale': scaleConstant('float16')
      }),
      'operators': [
        ...kvCarryTurn('cache', 'newKey1', 'kept1', 'newCache'),
        {
          'name': 'transpose',
          'arguments': [
            {'input': 'newCache'}, {'options': {'permutation': [0, 1, 3, 2]}}
          ],
          'outputs': 'newCacheTransposed'
        },
        {
          'name': 'matmul',
          'arguments': [{'a': 'query'}, {'b': 'newCacheTransposed'}],
          'outputs': 'rawScores'
        },
        {
          'name': 'mul',
          'arguments': [{'a': 'rawScores'}, {'b': 'scale'}],
          'outputs': 'scores'
        }
      ],
      'expectedOutputs': {
        'newCache': {
          'data': kvCacheAfterOneTurn,
          'descriptor': {shape: [1, 1, 4, 4], dataType: 'float16'}
        },
        'scores': {
          'data': kvScoresAfterOneTurn,
          'descriptor': {shape: [1, 1, 1, 4], dataType: 'float16'}
        }
      }
    }
  }
];

webnn_conformance_test(
    decoderLayerSubgraphTests, buildAndExecuteGraph,
    getDecoderLayerSubgraphPrecisionTolerance);
