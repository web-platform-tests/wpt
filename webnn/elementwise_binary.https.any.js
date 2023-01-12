// META: title=test WebNN API element-wise binary operations
// META: global=window,dedicatedworker
// META: script=./resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-binary

testWebNNOperation('add', '/webnn/resources/test_data/add.json', buildOperationWithTwoInputs);
testWebNNOperation('sub', '/webnn/resources/test_data/sub.json', buildOperationWithTwoInputs);
testWebNNOperation('mul', '/webnn/resources/test_data/mul.json', buildOperationWithTwoInputs);
testWebNNOperation('div', '/webnn/resources/test_data/div.json', buildOperationWithTwoInputs);
testWebNNOperation('max', '/webnn/resources/test_data/max.json', buildOperationWithTwoInputs);
testWebNNOperation('min', '/webnn/resources/test_data/min.json', buildOperationWithTwoInputs);
testWebNNOperation('pow', '/webnn/resources/test_data/pow.json', buildOperationWithTwoInputs);