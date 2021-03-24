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

promise_test(async t => {

  const rs = new ReadableStream({
    type: 'bytes',
    start(c) {
      c.enqueue(new Uint8Array([0x01]));
      c.enqueue(new Uint8Array([0x02]));
      c.close();
    }
  });

  const [branch1, branch2] = rs.tee();
  const reader1 = branch1.getReader({ mode: 'byob' });
  const reader2 = branch2.getReader({ mode: 'byob' });

  reader2.closed.then(t.unreached_func('branch2 should not be closed'));

  {
    const result = await reader1.read(new Uint8Array(1));
    assert_equals(result.done, false, 'done');

    const view = result.value;
    assert_equals(view.constructor, Uint8Array, 'value.constructor');
    assert_equals(view.buffer.byteLength, 1, 'value.buffer.byteLength');
    assert_equals(view.byteOffset, 0, 'value.byteOffset');
    assert_equals(view.byteLength, 1, 'value.byteLength');
    assert_equals(view[0], 0x01);
  }

  {
    const result = await reader1.read(new Uint8Array(1));
    assert_equals(result.done, false, 'done');

    const view = result.value;
    assert_equals(view.constructor, Uint8Array, 'value.constructor');
    assert_equals(view.buffer.byteLength, 1, 'value.buffer.byteLength');
    assert_equals(view.byteOffset, 0, 'value.byteOffset');
    assert_equals(view.byteLength, 1, 'value.byteLength');
    assert_equals(view[0], 0x02);
  }

  {
    const result = await reader1.read(new Uint8Array(1));
    assert_equals(result.done, true, 'done');

    const view = result.value;
    assert_equals(view.constructor, Uint8Array, 'value.constructor');
    assert_equals(view.buffer.byteLength, 1, 'value.buffer.byteLength');
    assert_equals(view.byteOffset, 0, 'value.byteOffset');
    assert_equals(view.byteLength, 0, 'value.byteLength');
  }

  {
    const result = await reader2.read(new Uint8Array(1));
    assert_equals(result.done, false, 'done');

    const view = result.value;
    assert_equals(view.constructor, Uint8Array, 'value.constructor');
    assert_equals(view.buffer.byteLength, 1, 'value.buffer.byteLength');
    assert_equals(view.byteOffset, 0, 'value.byteOffset');
    assert_equals(view.byteLength, 1, 'value.byteLength');
    assert_equals(view[0], 0x01);
  }

  await reader1.closed;

}, 'ReadableStream teeing with byte source: should be able to read one branch to the end without affecting the other');
