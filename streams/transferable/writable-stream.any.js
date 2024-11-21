// META: global=window,dedicatedworker,shadowrealm
// META: script=resources/helpers.js
// META: script=../resources/test-utils.js
// META: script=../resources/recording-streams.js

'use strict';

function transfer(t, obj, transfers) {
  if (GLOBAL.isShadowRealm()) {
    const transferred = structuredClone(obj, {transfer: transfers});
    return Promise.resolve(transferred);
  }
  return new Promise(resolve => {
    addEventListener('message', t.step_func(evt => {
      const transferred = evt.data;
      resolve(transferred);
    }), {once: true});
    postMessage(obj, '*', transfers);
  });
}

function failToTransfer(obj) {
  if (GLOBAL.isShadowRealm()) {
    structuredClone(obj, {transfer: [obj]});
  } else {
    postMessage(obj, '*', [obj]);
  }
}

promise_test(t => {
  const orig = new WritableStream();
  const promise = transfer(t, orig, [orig]);
  assert_true(orig.locked, 'the original stream should be locked');
  return promise.then(transferred => {
    assert_equals(transferred.constructor, WritableStream,
      'transferred should be a WritableStream in this realm');
    assert_true(transferred instanceof WritableStream,
      'instanceof check should pass');

    // Perform a brand-check on |transferred|.
    const writer = WritableStream.prototype.getWriter.call(transferred);
  });
}, 'should be able to transfer a WritableStream');

test(() => {
  const ws = new WritableStream();
  const writer = ws.getWriter();
  assert_throws_dom('DataCloneError', () => failToTransfer(ws),
                    'transferring should throw');
}, 'a locked WritableStream should not be transferable');

promise_test(t => {
  const {writable, readable} = new TransformStream();
  const promise = transfer(t, {writable, readable}, [writable, readable]);
  return promise.then(async ({writable, readable}) => {
    const reader = readable.getReader();
    const writer = writable.getWriter();
    const writerPromises = Promise.all([
      writer.write('hi'),
      writer.close(),
    ]);
    const {value, done} = await reader.read();
    assert_false(done, 'we should not be done');
    assert_equals(value, 'hi', 'chunk should have been delivered');
    const readResult = await reader.read();
    assert_true(readResult.done, 'readable should be closed');
    await writerPromises;
  });
}, 'should be able to transfer a {readable, writable} pair');

function transferSimple(stream) {
  if (GLOBAL.isShadowRealm()) {
    const transferred = structuredClone(stream, {transfer: [stream]});
    return Promise.resolve(transferred);
  }
  return new Promise(resolve => {
    addEventListener('message', evt => resolve(evt.data), { once: true });
    postMessage(stream, '*', [stream]);
  });
}

promise_test(async () => {
  const orig = new WritableStream(
    {}, new ByteLengthQueuingStrategy({ highWaterMark: 65536 }));
  const transferred = await transferSimple(orig);
  const writer = transferred.getWriter();
  assert_equals(writer.desiredSize, 1, 'desiredSize should be 1');
}, 'desiredSize for a newly-transferred stream should be 1');

promise_test(async () => {
  const orig = new WritableStream({
    write() {
      return new Promise(() => {});
    }
  });
  const transferred = await transferSimple(orig);
  const writer = transferred.getWriter();
  await writer.write('a');
  assert_equals(writer.desiredSize, 1, 'desiredSize should be 1');
}, 'effective queue size of a transferred writable should be 2');

promise_test(async () => {
  const [writeCalled, resolveWriteCalled] = makePromiseAndResolveFunc();
  let resolveWrite;
  const orig = new WritableStream({
    write() {
      resolveWriteCalled();
      return new Promise(resolve => {
        resolveWrite = resolve;
      });
    }
  });
  const transferred = await transferSimple(orig);
  const writer = transferred.getWriter();
  await writer.write('a');
  let writeDone = false;
  const writePromise = writer.write('b').then(() => {
    writeDone = true;
  });
  await writeCalled;
  assert_false(writeDone, 'second write should not have resolved yet');
  resolveWrite();
  await writePromise; // (makes sure this resolves)
}, 'second write should wait for first underlying write to complete');

async function transferredWritableStreamWithAbortPromise() {
  const [abortCalled, resolveAbortCalled] = makePromiseAndResolveFunc();
  const orig = recordingWritableStream({
    abort() {
      resolveAbortCalled();
    }
  });
  const transferred = await transferSimple(orig);
  return { orig, transferred, abortCalled };
}

promise_test(async t => {
  const { orig, transferred, abortCalled } = await transferredWritableStreamWithAbortPromise();
  transferred.abort('p');
  await abortCalled;
  assert_array_equals(orig.events, ['abort', 'p'],
                      'abort() should have been called');
}, 'abort() should work');

promise_test(async t => {
  const { orig, transferred, abortCalled } = await transferredWritableStreamWithAbortPromise();
  const writer = transferred.getWriter();
  // A WritableStream object cannot be cloned.
  await promise_rejects_dom(t, 'DataCloneError', writer.write(new WritableStream()),
                            'the write should reject');
  await promise_rejects_dom(t, 'DataCloneError', writer.closed,
                            'the stream should be errored');
  await abortCalled;
  assert_equals(orig.events.length, 2, 'abort should have been called');
  assert_equals(orig.events[0], 'abort', 'first event should be abort');
  assert_equals(orig.events[1].name, 'DataCloneError',
                'reason should be a DataCloneError');
}, 'writing a unclonable object should error the stream');
