// META: global=window,worker
// META: script=../resources/test-utils.js
// META: script=../resources/rs-utils.js
'use strict';

test(() => {
  new ReadableStream({ type: 'owning' }); // ReadableStream constructed with 'owning' type
}, 'ReadableStream can be constructed with owning type');

test(() => {
  let startCalled = false;

  const source = {
    start(controller) {
      assert_equals(this, source, 'source is this during start');
      assert_true(controller instanceof ReadableStreamDefaultController, 'default controller');
      startCalled = true;
    },
    type: 'owning'
  };

  new ReadableStream(source);
  assert_true(startCalled);
}, 'ReadableStream of type owning should call start with a ReadableStreamDefaultController');

promise_test(async () => {
  const uint8Array = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const buffer = uint8Array.buffer;
  buffer.test = 1;
  const source = {
    start(controller) {
      assert_equals(buffer.byteLength, 8);
      controller.enqueue(buffer, { transfer : [ buffer ] });
      assert_equals(buffer.byteLength, 0);
      assert_equals(buffer.test, 1);
    },
    type: 'owning'
  };

  const stream = new ReadableStream(source);
  const reader = stream.getReader();

  const chunk = await reader.read();

  assert_not_equals(chunk.value, buffer);
  assert_equals(chunk.value.byteLength, 8);
  assert_equals(chunk.value.test, undefined);
}, 'ReadableStream of type owning should transfer enqueued chunks');
