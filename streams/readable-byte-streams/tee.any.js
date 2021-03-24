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

promise_test(async () => {

  let pullCount = 0;
  const rs = new ReadableStream({
    type: 'bytes',
    pull(c) {
      ++pullCount;
      if (pullCount === 1) {
        c.enqueue(new Uint8Array([0x01]));
      }
    }
  });

  const [branch1, branch2] = rs.tee();
  const reader1 = branch1.getReader();
  const reader2 = branch2.getReader();

  const [result1, result2] = await Promise.all([reader1.read(), reader2.read()]);
  assert_equals(result1.done, false, 'reader1 done');
  assert_equals(result2.done, false, 'reader2 done');

  const view1 = result1.value;
  const view2 = result2.value;
  assert_equals(view1.constructor, Uint8Array, 'reader1 value.constructor');
  assert_equals(view2.constructor, Uint8Array, 'reader2 value.constructor');
  assert_equals(view1.buffer.byteLength, 1, 'reader1 value.buffer.byteLength');
  assert_equals(view1.buffer.byteLength, 1, 'reader2 value.buffer.byteLength');
  assert_array_equals([...view1], [0x01], `reader1 value`);
  assert_array_equals([...view2], [0x01], `reader2 value`);

  assert_not_equals(view1.buffer, view2.buffer, 'chunks should have different buffers');

}, 'ReadableStream teeing with byte source: chunks should be cloned for each branch');

promise_test(async () => {

  let pullCount = 0;
  const rs = new ReadableStream({
    type: 'bytes',
    pull(c) {
      ++pullCount;
      if (pullCount === 1) {
        c.byobRequest.view[0] = 0x01;
        c.byobRequest.respond(1);
      }
    }
  });

  const [branch1, branch2] = rs.tee();
  const reader1 = branch1.getReader({ mode: 'byob' });
  const reader2 = branch2.getReader();
  const buffer = new Uint8Array([42, 42, 42]).buffer;

  {
    const result = await reader1.read(new Uint8Array(buffer, 0, 1));
    assert_equals(result.done, false, 'done');

    const view = result.value;
    assert_equals(view.constructor, Uint8Array, 'value.constructor');
    assert_equals(view.buffer.byteLength, 3, 'value.buffer.byteLength');
    assert_array_equals([...new Uint8Array(view.buffer)], [0x01, 42, 42], `value.buffer`);
    assert_equals(view.byteOffset, 0, 'value.byteOffset');
    assert_equals(view.byteLength, 1, 'value.byteLength');
  }

  {
    const result = await reader2.read();
    assert_equals(result.done, false, 'done');

    const view = result.value;
    assert_equals(view.constructor, Uint8Array, 'value.constructor');
    assert_equals(view.buffer.byteLength, 1, 'value.buffer.byteLength');
    assert_array_equals([...new Uint8Array(view.buffer)], [0x01], `value.buffer`);
    assert_equals(view.byteOffset, 0, 'value.byteOffset');
    assert_equals(view.byteLength, 1, 'value.byteLength');
  }

}, 'ReadableStream teeing with byte source: chunks for BYOB requests from branch 1 should be cloned to branch 2');

promise_test(async t => {

  const theError = { name: 'boo!' };
  const rs = new ReadableStream({
    type: 'bytes',
    start(c) {
      c.enqueue(new Uint8Array([0x01]));
      c.enqueue(new Uint8Array([0x02]));
    },
    pull() {
      throw theError;
    }
  });

  const [branch1, branch2] = rs.tee();
  const reader1 = branch1.getReader({ mode: 'byob' });
  const reader2 = branch2.getReader({ mode: 'byob' });

  {
    const result = await reader1.read(new Uint8Array(1));
    assert_equals(result.done, false, 'first read from branch1 should not be done');
    assert_array_equals([...result.value], [0x01], 'first read from branch1 should be correct');
  }

  {
    const result = await reader1.read(new Uint8Array(1));
    assert_equals(result.done, false, 'second read from branch1 should not be done');
    assert_array_equals([...result.value], [0x02], 'second read from branch1 should be correct');
  }

  await promise_rejects_exactly(t, theError, reader1.read(new Uint8Array(1)));
  await promise_rejects_exactly(t, theError, reader2.read(new Uint8Array(1)));

  await Promise.all([
    promise_rejects_exactly(t, theError, reader1.closed),
    promise_rejects_exactly(t, theError, reader2.closed)
  ]);

}, 'ReadableStream teeing with byte source: errors in the source should propagate to both branches');

promise_test(async () => {

  const rs = new ReadableStream({
    type: 'bytes',
    start(c) {
      c.enqueue(new Uint8Array([0x01]));
      c.enqueue(new Uint8Array([0x02]));
      c.close();
    }
  });

  const [branch1, branch2] = rs.tee();
  branch1.cancel();

  const [chunks1, chunks2] = await Promise.all([readableStreamToArray(branch1), readableStreamToArray(branch2)]);
  assert_array_equals(chunks1, [], 'branch1 should have no chunks');
  assert_equals(chunks2.length, 2, 'branch2 should have two chunks');
  assert_array_equals([...chunks2[0]], [0x01], 'first chunk from branch2 should be correct');
  assert_array_equals([...chunks2[1]], [0x02], 'second chunk from branch2 should be correct');

}, 'ReadableStream teeing with byte source: canceling branch1 should not impact branch2');

promise_test(async () => {

  const rs = new ReadableStream({
    type: 'bytes',
    start(c) {
      c.enqueue(new Uint8Array([0x01]));
      c.enqueue(new Uint8Array([0x02]));
      c.close();
    }
  });

  const [branch1, branch2] = rs.tee();
  branch2.cancel();

  const [chunks1, chunks2] = await Promise.all([readableStreamToArray(branch1), readableStreamToArray(branch2)]);
  assert_equals(chunks1.length, 2, 'branch1 should have two chunks');
  assert_array_equals([...chunks1[0]], [0x01], 'first chunk from branch1 should be correct');
  assert_array_equals([...chunks1[1]], [0x02], 'second chunk from branch1 should be correct');
  assert_array_equals(chunks2, [], 'branch2 should have no chunks');

}, 'ReadableStream teeing with byte source: canceling branch2 should not impact branch1');

promise_test(async () => {

  const reason1 = new Error('We\'re wanted men.');
  const reason2 = new Error('I have the death sentence on twelve systems.');

  let resolve;
  const promise = new Promise(r => resolve = r);
  const rs = new ReadableStream({
    type: 'bytes',
    cancel(reason) {
      assert_array_equals(reason, [reason1, reason2],
        'the cancel reason should be an array containing those from the branches');
      resolve();
    }
  });

  const [branch1, branch2] = rs.tee();
  await Promise.all([
    branch1.cancel(reason1),
    branch2.cancel(reason2),
    promise
  ]);

}, 'ReadableStream teeing with byte source: canceling both branches should aggregate the cancel reasons into an array');

promise_test(async () => {

  const reason1 = new Error('This little one\'s not worth the effort.');
  const reason2 = new Error('Come, let me get you something.');

  let resolve;
  const promise = new Promise(r => resolve = r);
  const rs = new ReadableStream({
    type: 'bytes',
    cancel(reason) {
      assert_array_equals(reason, [reason1, reason2],
        'the cancel reason should be an array containing those from the branches');
      resolve();
    }
  });

  const [branch1, branch2] = rs.tee();
  await Promise.all([
    branch2.cancel(reason2),
    branch1.cancel(reason1),
    promise
  ]);

}, 'ReadableStream teeing with byte source: canceling both branches in reverse order should aggregate the cancel reasons into an array');
