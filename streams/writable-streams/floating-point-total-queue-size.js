'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
}

promise_test(() => {
  const writer = setupTestStream();

  const writePromises = [
    writer.write(2),
    writer.write(Number.MAX_SAFE_INTEGER)
  ];

  assert_equals(writer.desiredSize, 0 - 2 - Number.MAX_SAFE_INTEGER,
    'desiredSize must be calculated using floating-point arithmetic (after writing two chunks)');

  return Promise.all(writePromises).then(() => {
    assert_equals(writer.desiredSize, 0 - 2 - Number.MAX_SAFE_INTEGER + 2 + Number.MAX_SAFE_INTEGER,
      'desiredSize must be calculated using floating-point arithmetic (after the two chunks have finished writing)');
  });
}, 'Floating point arithmetic must manifest near NUMBER.MAX_SAFE_INTEGER (total ends up positive)');

promise_test(() => {
  const writer = setupTestStream();

  const writePromises = [
    writer.write(1e-16),
    writer.write(1)
  ];

  assert_equals(writer.desiredSize, 0 - 1e-16 - 1,
    'desiredSize must be calculated using floating-point arithmetic (after writing two chunks)');

  return Promise.all(writePromises).then(() => {
    assert_equals(writer.desiredSize, 0 - 1e-16 - 1 + 1e-16 + 1,
      'desiredSize must be calculated using floating-point arithmetic (after the two chunks have finished writing)');
  });
}, 'Floating point arithmetic must manifest near 0 (total ends up positive)');

promise_test(() => {
  const writer = setupTestStream();

  const writePromises = [
    writer.write(2e-16),
    writer.write(1)
  ];

  assert_equals(writer.desiredSize, 0 - 2e-16 - 1,
    'desiredSize must be calculated using floating-point arithmetic (after writing two chunks)');

  return Promise.all(writePromises).then(() => {
    assert_equals(writer.desiredSize, 0 - 2e-16 - 1 + 2e-16 + 1,
      'desiredSize must be calculated using floating-point arithmetic (after the two chunks have finished writing)');
  });
}, 'Floating point arithmetic must manifest near 0 (total ends up zero)');

function setupTestStream() {
  const strategy = {
    size(x) {
      return x;
    },
    highWaterMark: 0
  };

  const ws = new WritableStream({}, strategy);

  return ws.getWriter();
}
