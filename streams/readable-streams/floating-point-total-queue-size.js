'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
}

promise_test(() => {
  const { reader, controller } = setupTestStream();

  controller.enqueue(2);
  assert_equals(controller.desiredSize, 0 - 2, 'desiredSize must be -2 after enqueueing such a chunk');

  controller.enqueue(Number.MAX_SAFE_INTEGER);
  assert_equals(controller.desiredSize, 0 - Number.MAX_SAFE_INTEGER - 2,
    'desiredSize must be calculated using floating-point arithmetic (adding a second chunk)');

  return reader.read().then(() => {
    assert_equals(controller.desiredSize, 0 - Number.MAX_SAFE_INTEGER - 2 + 2,
      'desiredSize must be calculated using floating-point arithmetic (subtracting a chunk)');

    return reader.read();
  }).then(() => {
    assert_equals(controller.desiredSize, 0 - Number.MAX_SAFE_INTEGER - 2 + 2 + Number.MAX_SAFE_INTEGER,
      'desiredSize must be calculated using floating-point arithmetic (subtracting a second chunk)');
  });
}, 'Floating point arithmetic must manifest near NUMBER.MAX_SAFE_INTEGER (total ends up positive)');

promise_test(() => {
  const { reader, controller } = setupTestStream();

  controller.enqueue(1e-16);
  assert_equals(controller.desiredSize, 0 - 1e-16, 'desiredSize must be -1e16 after enqueueing such a chunk');

  controller.enqueue(1);
  assert_equals(controller.desiredSize, 0 - 1e-16 - 1,
    'desiredSize must be calculated using floating-point arithmetic (adding a second chunk)');

  return reader.read().then(() => {
    assert_equals(controller.desiredSize, 0 - 1e-16 - 1 + 1e-16,
      'desiredSize must be calculated using floating-point arithmetic (subtracting a chunk)');

    return reader.read();
  }).then(() => {
    assert_equals(controller.desiredSize, 0 - 1e-16 - 1 + 1e-16 + 1,
      'desiredSize must be calculated using floating-point arithmetic (subtracting a second chunk)');
  });
}, 'Floating point arithmetic must manifest near 0 (total ends up positive)');

promise_test(() => {
  const { reader, controller } = setupTestStream();

  controller.enqueue(2e-16);
  assert_equals(controller.desiredSize, 0 - 2e-16, 'desiredSize must be -2e16 after enqueueing such a chunk');

  controller.enqueue(1);
  assert_equals(controller.desiredSize, 0 - 2e-16 - 1,
    'desiredSize must be calculated using floating-point arithmetic (adding a second chunk)');

  return reader.read().then(() => {
    assert_equals(controller.desiredSize, 0 - 2e-16 - 1 + 2e-16,
      'desiredSize must be calculated using floating-point arithmetic (subtracting a chunk)');

    return reader.read();
  }).then(() => {
    assert_equals(controller.desiredSize, 0 - 2e-16 - 1 + 2e-16 + 1,
      'desiredSize must be calculated using floating-point arithmetic (subtracting a second chunk)');
  });
}, 'Floating point arithmetic must manifest near 0 (total ends up zero)');

function setupTestStream() {
  const strategy = {
    size(x) {
      return x;
    },
    highWaterMark: 0
  };

  let controller;
  const rs = new ReadableStream({
    start(c) {
      controller = c;
    }
  }, strategy);

  return { reader: rs.getReader(), controller };
}
