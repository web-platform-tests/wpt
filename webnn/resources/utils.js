'use strict';

const ExecutionArray = ['sync', 'async'];

// https://webmachinelearning.github.io/webnn/#enumdef-mldevicetype
const DeviceTypeArray = ['cpu', 'gpu'];

// https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
const TypedArrayDict = {
  float32: Float32Array,
  int32: Int32Array,
  uint32: Uint32Array,
  int8: Int8Array,
  uint8: Uint8Array,
};

const sizeOfShape = (array) => {
  return array.reduce((accumulator, currentValue) => accumulator * currentValue, 1);
}

/**
 * Get JSON information from specified test data file.
 * @param {String} file - A file URL
 * @returns {Object} Test resources
 */
const loadTestData = (file) => {
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

/**
 * Get ULP tolerance of gemm operation.
 * @param {Object} resources - Resources used for building a graph
 * @param {String} [opName] - An operation name
 * @returns {Number} A tolerance number
 */
const getGemmPrecisionTolerance = (resources, opName) => {
  // GEMM : alpha * (A x B) + beta * C
  // An upper bound for the worst serial ordering is bounded by
  // the number of lossy operations, where matrix multiplication
  // is a dot product (mul and add times the number of elements)
  // plus bias operations.
  const shapeA = resources.inputA.shape;
  const options = resources.options;
  const width = options.aTranspose ? shapeA[0] : shapeA[1];
  let tolerance = width * 2;
  // default options.alpha is 1.0
  if (options.alpha !== undefined && options.alpha !== 1.0) {
    tolerance++;
  }
  if (options.c && options.beta !== 0.0) {
    // default options.beta is 1.0
    if (options.beta !== undefined && options.beta !== 1.0) {
      tolerance++;
    }
    tolerance++;
  }
  return tolerance;
};

/**
 * Get ULP tolerance of matmul operation.
 * @param {Object} resources - Resources used for building a graph
 * @param {String} [opName] - An operation name
 * @returns {Number} A tolerance number
 */
const getMatmulPrecisionTolerance = (resources, opName) => {
  // Matmul : Compute the matrix product of two input tensors.
  // If a is 1-D, it is converted to a 2-D tensor by prepending a 1 to its dimensions, [n] -> [1, n]
  const shapeA = resources.inputA.shape;
  const tolerance = shapeA[shapeA.length - 1] * 2;
  return tolerance;
};

// Refer to precision metrics on https://github.com/webmachinelearning/webnn/issues/265#issuecomment-1256242643
const PrecisionMetrics = {
  batchNormalization: {ULP: {float32: 6, float16: 6}},
  clamp: {ULP: {float32: 0, float16: 0}},
  concat: {ULP: {float32: 0, float16: 0}},
  // TODO getConv2dPrecisionTolerance
  // conv2d: {ULP: {float32: getConv2dPrecisionTolerance, float16: getConv2dPrecisionTolerance}},
  // element-wise binary operations
  add: {ULP: {float32: 1, float16: 1}},
  sub: {ULP: {float32: 1, float16: 1}},
  mul: {ULP: {float32: 1, float16: 1}},
  div: {ULP: {float32: 2, float16: 2}},
  max: {ULP: {float32: 0, float16: 0}},
  min: {ULP: {float32: 0, float16: 0}},
  pow: {ULP: {float32: 32, float16: 2}},
  // element-wise unary operations
  abs: {ULP: {float32: 0, float16: 0}},
  ceil: {ULP: {float32: 0, float16: 0}},
  cos: {ATOL: {float32: 1/1024, float16: 1/512}},
  exp: {ULP: {float32: 32, float16: 1}},
  floor: {ULP: {float32: 0, float16: 0}},
  log: {ATOL: {float32: 1/1024, float16: 1/1024}},
  neg: {ULP: {float32: 0, float16: 0}},
  sin: {ATOL: {float32: 1/1024, float16: 1/512}},
  tan: {ATOL: {float32: 1/1024, float16: 1/512}},
  gemm: {ULP: {float32: getGemmPrecisionTolerance, float16: getGemmPrecisionTolerance}},
  leakRelu: {ULP: {float32: 1, float16: 1}},
  matmul: {ULP: {float32: getMatmulPrecisionTolerance, float16: getMatmulPrecisionTolerance}},
  // pooling operations
  // TODO getAveragePool2dPrecisionTolerance
  // averagePool2d: {ULP: {float32: getAveragePool2dPrecisionTolerance, float16: getAveragePool2dPrecisionTolerance}},
  maxPool2d: {ULP: {float32: 0, float16: 0}},
  // reduction operations
  reduceMax: {ULP: {float32: 0, float16: 0}},
  // TODO getReducePrecisionTolerance(resources, opName)
  // using second opName parameter for reduceMean op, IEPOE + 2 ULP
  // reduceMean: {ULP: {float32: getReducePrecisionTolerance, float16: getReducePrecisionTolerance}},
  reduceMin: {ULP: {float32: 0, float16: 0}},
  // reduceProduct: {ULP: {float32: getReducePrecisionTolerance, float16: getReducePrecisionTolerance}},
  // reduceSum: {ULP: {float32: getReducePrecisionTolerance, float16: getReducePrecisionTolerance}},
  relu: {ULP: {float32: 0, float16: 0}},
  reshape: {ULP: {float32: 0, float16: 0}},
  // float32 (leaving a few ULP for roundoff)
  sigmoid: {ULP: {float32: 32+2, float16: 3}},
  slice: {ULP: {float32: 0, float16: 0}},
  // TODO getSoftmaxPrecisionTolerance
  // softmax: {ULP: {float32: getSoftmaxPrecisionTolerance, float16: getSoftmaxPrecisionTolerance}},
  split: {ULP: {float32: 0, float16: 0}},
  squeeze: {ULP: {float32: 0, float16: 0}},
  tanh: {ATOL: {float32: 1/1024, float16: 1/512}},
  transpose: {ULP: {float32: 0, float16: 0}},
};

/**
 * Get precison tolerance value.
 * @param {String} opName - An operation name
 * @param {String} metricType - Value: 'ULP', 'ATOL'
 * @param {String} operandType - Value: 'float32', 'float16', etc.,
 *     more data type strings, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 * @param {Object} resources - Resources used for building a graph
 * @returns {Number} A tolerance number
 */
const getPrecisonTolerance = (opName, metricType, operandType, resources) => {
  let tolerance = PrecisionMetrics[opName][metricType][operandType];
  // If the tolerance is dynamic, then evaluate the function to get the value.
  if (tolerance instanceof Function) {
    tolerance = tolerance(resources, opName);
  }
  return tolerance;
};

/**
 * Get bitwise of the given value.
 * @param {Number} value
 * @param {String} dataType - A data type string, like "float32", "float16",
 *     more data type strings, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 * @return {Number} A 64-bit signed integer.
 */
const getBitwise = (value, dataType) => {
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
};

/**
 * Assert that each array property in ``actual`` is a number being close enough to the corresponding
 * property in ``expected`` by the acceptable ULP distance ``nulp`` with given ``dataType`` data type.
 *
 * @param {Array} actual - Array of test values.
 * @param {Array} expected - Array of values expected to be close to the values in ``actual``.
 * @param {Number} nulp - A BigInt value indicates acceptable ULP distance.
 * @param {String} dataType - A data type string, value: "float32",
 *     more data type strings, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 * @param {String} description - Description of the condition being tested.
 */
const assert_array_approx_equals_ulp = (actual, expected, nulp, dataType, description) => {
  /*
    * Test if two primitive arrays are equal within acceptable ULP distance
    */
  assert_true(actual.length === expected.length,
              `assert_array_approx_equals_ulp: ${description} lengths differ, expected ${expected.length} but got ${actual.length}`);
  let actualBitwise, expectedBitwise, distance;
  for (let i = 0; i < actual.length; i++) {
    actualBitwise = getBitwise(actual[i], dataType);
    expectedBitwise = getBitwise(expected[i], dataType);
    distance = actualBitwise - expectedBitwise;
    distance = distance >= 0 ? distance : -distance;
    assert_true(distance <= nulp,
                `assert_array_approx_equals_ulp: ${description} actual ${actual[i]} should be close enough to expected ${expected[i]} by the acceptable ${nulp} ULP distance, but they have ${distance} ULP distance`);
  }
};

/**
 * Check computed results with expected data.
 * @param {String} opName - An operation name
 * @param {String} operandType - Type value: 'float32', 'float16', etc.,
 *     more type, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 * @param {Object.<String, MLOperand>} namedOutputOperands
 * @param {Object.<MLNamedArrayBufferViews>} outputs - The resources of required outputs
 * @param {Object} resources - Resources used for building a graph
 */
const checkResults = (opName, operandType, namedOutputOperands, outputs, resources) => {
  const metricType = PrecisionMetrics[opName] ? Object.keys(PrecisionMetrics[opName])[0] : 'ULP';
  const description = `test ${opName} ${operandType}`;
  const tolerance = getPrecisonTolerance(opName, metricType, operandType, resources);
  if (metricType === 'ULP') {
    for (let operandName in namedOutputOperands) {
      let outputData = outputs[operandName];
      let expectedData = resources.expected.data[operandName];
      if (typeof expectedData === 'number') {
        outputData = [outputData];
        expectedData = [expectedData];
      }
      assert_array_approx_equals_ulp(outputData, expectedData, tolerance, operandType, description);
    }
  } else if (metricType === 'ATOL') {
    for (let operandName in namedOutputOperands) {
      assert_array_approx_equals(
        outputs[operandName], resources.expected.data[operandName], tolerance, description);
    }
  }
};

/**
 * Build a graph, synchronously compile graph and execute, then check computed results.
 * @param {String} opName - An operation name
 * @param {MLContext} context - A ML context
 * @param {MLGraphBuilder} builder - A ML graph builder
 * @param {String} operandType - Type value: 'float32', 'float16', etc.,
 *     more type, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 * @param {Object} resources - Resources used for building a graph
 * @param {Object} buildGraphFunc - A function for building a graph
 */
const runSync = (opName, context, builder, operandType, resources, buildGraphFunc) => {
  // build a graph
  const [namedOutputOperands, inputs, outputs] = buildGraphFunc(builder, resources);
  // synchronously compile the graph up to the output operand
  const graph = builder.buildSync(namedOutputOperands);
  // synchronously execute the compiled graph.
  context.computeSync(graph, inputs, outputs);
  checkResults(opName, operandType, namedOutputOperands, outputs, resources);
};

/**
 * Build a graph, asynchronously compile graph and execute, then check computed results.
 * @param {String} opName - An operation name
 * @param {MLContext} context - A ML context
 * @param {MLGraphBuilder} builder - A ML graph builder
 * @param {String} operandType - Type value: 'float32', 'float16', etc.,
 *     more type, please see:
 *     https://webmachinelearning.github.io/webnn/#enumdef-mloperandtype
 * @param {Object} resources - Resources used for building a graph
 * @param {Object} buildGraphFunc - A function for building a graph
 */
const run = async (opName, context, builder, operandType, resources, buildGraphFunc) => {
  // build a graph
  const [namedOutputOperands, inputs, outputs] = buildGraphFunc(builder, resources);
  // asynchronously compile the graph up to the output operand
  const graph = await builder.build(namedOutputOperands);
  // asynchronously execute the compiled graph
  await context.compute(graph, inputs, outputs);
  checkResults(opName, operandType, namedOutputOperands, outputs, resources);
};

/**
 * Run WebNN operation tests.
 * @param {String} opName - An operation name
 * @param {Array} tests - A test resources array
 * @param {Object} buildGraphFunc - A function for building a graph
 */
const testWebNNOperation = (opName, tests, buildGraphFunc) => {
  ExecutionArray.forEach(executionType => {
    const isSync = executionType === 'sync';
    if (self.GLOBAL.isWindow() && isSync) {
      return;
    }
    let context;
    let builder;
    if (isSync) {
      // test sync
      DeviceTypeArray.forEach(deviceType => {
        setup(() => {
          context = navigator.ml.createContextSync({deviceType});
          builder = new MLGraphBuilder(context);
        });
        for (const testResources of tests) {
          test(() => {
            runSync(opName, context, builder, testResources.operandType, testResources, buildGraphFunc);
          }, `${testResources.name} / ${testResources.operandType} / ${deviceType} / ${executionType}`);
        }
      });
    } else {
      // test async
      DeviceTypeArray.forEach(deviceType => {
        promise_setup(async () => {
          context = await navigator.ml.createContext({deviceType});
          builder = new MLGraphBuilder(context);
        });
        for (const testResources of tests) {
          promise_test(async () => {
            await run(opName, context, builder, testResources.operandType, testResources, buildGraphFunc);
          }, `${testResources.name} / ${testResources.operandType} / ${deviceType} / ${executionType}`);
        }
      });
    }
  });
}