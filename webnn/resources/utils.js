'use strict';

const ExecutionArray = ['async', 'sync'];

// https://webmachinelearning.github.io/webnn/#enumdef-mldevicetype
const DeviceTypeArray = ['cpu', 'gpu'];

// Refer to precision metrics on https://github.com/webmachinelearning/webnn/issues/265#issuecomment-1256242643
const PrecisionMetrics = {
  concat: {ULP: {float32: 0, float16: 0}},
};

const TypedArrayDict = {
  float32: Float32Array,
};

/**
 * Get bitwise of the given value.
 * @param {Number} value
 * @param {String} dataType A data type string, like "float32", "int8",
 *     more data type strings, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 * @return {Number} A 64-bit signed integer.
 */
function getBitwise(value, dataType) {
  const buffer = new ArrayBuffer(8);
  const int64Array = new BigInt64Array(buffer);
  int64Array[0] = value < 0 ? ~BigInt(0) : BigInt(0);
  let typedArray;

  if (dataType === "float32") {
    typedArray = new Float32Array(buffer);
  } else {
    throw new AssertionError(`Data type ${dataType} is not supported`);
  }

  typedArray[0] = value;

  return int64Array[0];
}

/**
 * Assert that each array property in ``actual`` is a number being close enough to the corresponding
 * property in ``expected`` by the acceptable ULP distance ``nulp`` with given ``dataType`` data type.
 *
 * @param {Array} actual - Array of test values.
 * @param {Array} expected - Array of values expected to be close to the values in ``actual``.
 * @param {Number} nulp - A BigInt value indicates acceptable ULP distance.
 * @param {String} [dataType="float32"] - A data type string, default "float32",
 *     more data type strings, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 */
function assert_array_approx_equals_ulp(actual, expected, nulp, dataType) {
  /*
    * Test if two primitive arrays are equal within acceptable ULP distance
    */
  assert_true(actual.length === expected.length,
              `assert_array_approx_equals_ulp actual length ${actual.length} should be equal to expected length ${expected.length}`);
  let actualBitwise, expectedBitwise, distance;
  for (let i = 0; i < actual.length; i++) {
    actualBitwise = getBitwise(actual[i], dataType);
    expectedBitwise = getBitwise(expected[i], dataType);
    distance = actualBitwise - expectedBitwise;
    distance = distance >= 0 ? distance : -distance;
    assert_true(distance <= nulp,
                `actual ${actual[i]} should be close enough to expected ${expected[i]} by the acceptable ${nulp} ULP distance, while they have ${distance} ULP distance`);
  }
}

function sizeOfShape(array) {
  return array.reduce((accumulator, currentValue) => accumulator * currentValue, 1);
}

/**
 * Get JSON information from specified test data file.
 * @param {String} file - file URL
 * @returns {Object}
 */
function loadTestData(file) {
  function loadJSON(file) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", file, false);
    xmlhttp.overrideMimeType("application/json");
    xmlhttp.send();
    if (xmlhttp.status == 200 && xmlhttp.readyState == 4) {
      return xmlhttp.responseText;
    } else {
      throw new Error(`Failed to load ${file}`);
    }
  }

  const json = loadJSON(file);
  return JSON.parse(json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m));
}