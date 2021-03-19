// META: global=window,worker,jsshell
// META: script=../resources/rs-utils.js
// META: script=../resources/test-utils.js
// META: script=../resources/recording-streams.js
'use strict';

test(() => {

  const rs = new ReadableStream({ type: 'bytes' });
  const result = rs.tee();

  assert_true(Array.isArray(result), 'return value should be an array');
  assert_equals(result.length, 2, 'array should have length 2');
  assert_equals(result[0].constructor, ReadableStream, '0th element should be a ReadableStream');
  assert_equals(result[1].constructor, ReadableStream, '1st element should be a ReadableStream');

}, 'ReadableStream teeing with byte source: rs.tee() returns an array of two ReadableStreams');
