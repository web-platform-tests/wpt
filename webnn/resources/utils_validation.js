'use strict';

// https://webmachinelearning.github.io/webnn/#enumdef-mloperanddatatype
const operandDataTypeArray = [
  'float32',
  'float16',
  'int32',
  'uint32',
  'int64',
  'uint64',
  'int8',
  'uint8'
];

const unsignedLongType = 'unsigned long';

const dimensions0D = [];
const dimensions1D = [2];
const dimensions2D = [2, 3];
const dimensions3D = [2, 3, 4];
const dimensions4D = [2, 3, 4, 5];
const dimensions5D = [2, 3, 4, 5, 6];

const adjustOffsetArray = [
  // Decrease 1
  -1,
  // Increase 1
  1
];

const dimensionsArray = [
  dimensions0D,
  dimensions1D,
  dimensions2D,
  dimensions3D,
  dimensions4D,
  dimensions5D
];

const notUnsignedLongAxisArray = [
  // String
  'abc',
  // BigInt
  BigInt(100),
  // Object
  {
    value: 1
  },
  // Array Object
  [0, 1],
  // Date Object
  new Date("2024-01-01"),
];

function getRank(inputDimensions) {
  return inputDimensions.length;
}

function getAxisArray(inputDimensions) {
  return Array.from({length: inputDimensions.length}, (_, i) => i);
}

function getAxesArrayContainSameValues(inputDimensions) {
  // TODO
  // Current this function returns an array containing each element which has all same value
  // For example axes: [0, 1, 2] for 3D input tensor
  // this function returns
  // [
  //   // two values are same
  //   [0, 0],
  //   [1, 1],
  //   [2, 2],
  //   // three values are same
  //   [0, 0, 0],
  //   [1, 1, 1]
  //   [2, 2, 2]
  // ]
  // while it should return
  // [
  //   // two values are same
  //   [0, 0],
  //   [1, 1],
  //   [2, 2],
  //   [0, 0, 1],
  //   [0, 0, 2],
  //   [0, 1, 0],
  //   [0, 2, 0],
  //   [1, 0, 0],
  //   [2, 0, 0],
  //   [1, 1, 0],
  //   [1, 1, 2],
  //   [1, 0, 1],
  //   [1, 2, 1],
  //   [0, 1, 1],
  //   [2, 1, 1],
  //   [2, 2, 0],
  //   [2, 2, 1],
  //   [2, 0, 2],
  //   [2, 1, 2],
  //   [0, 2, 2],
  //   [1, 2, 2],
  //   // three (all) values are same
  //   [0, 0, 0],
  //   [1, 1, 1]
  //   [2, 2, 2]
  // ]
  const axesArrayContainSameValues = [];
  const length = inputDimensions.length;
  if (length >= 2) {
    const validAxesArrayFull = getAxisArray(inputDimensions);
    for (let index = 0; index < length; index++) {
      axesArrayContainSameValues.push(new Array(2).fill(validAxesArrayFull[index]));
      if (length > 2) {
        axesArrayContainSameValues.push(new Array(3).fill(validAxesArrayFull[index]));
      }
    }
  }
  return axesArrayContainSameValues;
}

function getOutsideValueArray(type) {
  let range, outsideValueArray;
  switch (type) {
    case 'unsigned long':
      // https://webidl.spec.whatwg.org/#idl-unsigned-long
      // The unsigned long type is an unsigned integer type that has values in the range [0, 4294967295].
      range = [0, 4294967295];
      break;
    default:
      throw new Error(`Unsupport ${tyep}`);
  }
  outsideValueArray = [range[0] - 1, range[1] + 1];
  return outsideValueArray;
}

let context, builder;

promise_setup(async () => {
  context = await navigator.ml.createContext();
  builder = new MLGraphBuilder(context);
});


/**
 * Validate options.axes by given operation and input rank for
 * argMin/Max / layerNormalization / Reduction operations / resample2d operations
 * @param {(String[]|String)} operationName - An operation name array or an operation name
 * @param {Number} [inputRank]
 */
function validateOptionsAxes(operationName, inputRank) {
  let operationNameArray;
  if (typeof operationName === 'string') {
    operationNameArray = [operationName];
  } else if (Array.isArray(operationName)) {
    operationNameArray = operationName;
  }
  const outsideAxisArray = getOutsideValueArray(unsignedLongType);
  for (let subOperationName of operationNameArray) {
    // TypeError is expected if any of options.axes elements is not an unsigned long interger
    promise_test(async t => {
      if (inputRank === undefined) {
        // argMin/Max / layerNormalization / Reduction operations
        for (let dataType of operandDataTypeArray) {
          for (let dimensions of dimensionsArray) {
            const rank = getRank(dimensions);
            if (rank >= 1) {
              const input = builder.input('input', {dataType, dimensions});
              for (let outsideAxis of outsideAxisArray) {
                assert_throws_js(TypeError, () => builder[subOperationName](input, {axes: outsideAxis}));
              }
              for (let axis of notUnsignedLongAxisArray) {
                assert_false(typeof axis === 'number' && Number.isInteger(axis), `[${subOperationName}]  any of options.axes elements should be of 'unsigned long'`);
                assert_throws_js(TypeError, () => builder[subOperationName](input, {axes: [axis]}));
              }
            }
          }
        }
      } else {
        // resample2d
        for (let dataType of operandDataTypeArray) {
          const input = builder.input('input', {dataType, dimensions: dimensionsArray[inputRank]});
          for (let outsideAxis of outsideAxisArray) {
            assert_throws_js(TypeError, () => builder[subOperationName](input, {axes: outsideAxis}));
          }
          for (let axis of notUnsignedLongAxisArray) {
            assert_false(typeof axis === 'number' && Number.isInteger(axis), `[${subOperationName}]  any of options.axes elements should be of 'unsigned long'`);
            assert_throws_js(TypeError, () => builder[subOperationName](input, {axes: [axis]}));
          }
        }
      }
    }, `[${subOperationName}] TypeError is expected if any of options.axes elements is not an unsigned long interger`);
    // DataError is expected if any of options.axes elements is greater or equal to the size of input
    promise_test(async t => {
      if (inputRank === undefined) {
        // argMin/Max / layerNormalization / Reduction operations
        for (let dataType of operandDataTypeArray) {
          for (let dimensions of dimensionsArray) {
            const rank = getRank(dimensions);
            if (rank >= 1) {
              const input = builder.input('input', {dataType, dimensions});
              assert_throws_dom('DataError', () => builder[subOperationName](input, {axes: [rank]}));
              assert_throws_dom('DataError', () => builder[subOperationName](input, {axes: [rank + 1]}));
            }
          }
        }
      } else {
        // resample2d
        for (let dataType of operandDataTypeArray) {
          const input = builder.input('input', {dataType, dimensions: dimensionsArray[inputRank]});
          assert_throws_dom('DataError', () => builder[subOperationName](input, {axes: [inputRank]}));
          assert_throws_dom('DataError', () => builder[subOperationName](input, {axes: [inputRank + 1]}));
        }
      }
    }, `[${subOperationName}] DataError is expected if any of options.axes elements is greater or equal to the size of input`);
    // DataError is expected if two or more values are same in the axes sequence
    promise_test(async t => {
      if (inputRank === undefined) {
        // argMin/Max / layerNormalization / Reduction operations
        for (let dataType of operandDataTypeArray) {
          for (let dimensions of dimensionsArray) {
            const rank = getRank(dimensions);
            if (rank >= 2) {
              const input = builder.input('input', {dataType, dimensions});
              const axesArrayContainSameValues = getAxesArrayContainSameValues(dimensions);
              for (let axes of axesArrayContainSameValues) {
                assert_throws_dom('DataError', () => builder[subOperationName](input, {axes}));
              }
            }
          }
        }
      } else {
        // resample2d
        for (let dataType of operandDataTypeArray) {
          const dimensions = dimensionsArray[inputRank];
          const input = builder.input('input', {dataType, dimensions});
          const axesArrayContainSameValues = getAxesArrayContainSameValues(dimensions);
          for (let axes of axesArrayContainSameValues) {
            assert_throws_dom('DataError', () => builder[subOperationName](input, {axes}));
          }
        }
      }
    }, `[${subOperationName}] DataError is expected if two or more values are same in the axes sequence`);
  }
}
