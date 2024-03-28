// META: title=test WebNN API buffer operations
// META: global=window,dedicatedworker
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlbuffer

if (navigator.ml) {
  testCreateWebNNBuffer('create', 4);
  testDestroyWebNNBuffer('destroyTwice');
} else {
  test(
      () => assert_not_equals(
          navigator.ml, undefined, 'ml property is defined on navigator'));
}
