// META: title=test WebNN API element-wise logical operations
// META: global=window,dedicatedworker
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlgraphbuilder-logical

if (navigator.ml) {
  testWebNNOperation(
      [
        'equal',
        'greater',
        'greaterOrEqual',
        'lesser',
        'lesserOrEqual',
      ],
      buildOperationWithTwoInputs);
  testWebNNOperation('logicalNot', buildOperationWithSingleInput);
} else {
  test(
      () => assert_not_equals(
          navigator.ml, undefined, 'ml property is defined on navigator'));
}
