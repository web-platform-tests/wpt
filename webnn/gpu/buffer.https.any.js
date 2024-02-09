// META: title=test WebNN API buffer operations
// META: global=window,dedicatedworker
// META: script=../resources/utils.js
// META: timeout=long

'use strict';

// https://webmachinelearning.github.io/webnn/#api-mlbuffer

testWebNNBuffer("create", createBuffer, 4, 'gpu');