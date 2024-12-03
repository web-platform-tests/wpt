// META: global=window,dedicatedworker,shadowrealm
// META: script=../resources/test-utils.js

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
  const orig = new TransformStream();
  const promise = transfer(t, orig, [orig]);
  assert_true(orig.readable.locked, 'the readable side should be locked');
  assert_true(orig.writable.locked, 'the writable side should be locked');
  return promise.then(transferred => {
    assert_equals(transferred.constructor, TransformStream,
      'transferred should be a TransformStream in this realm');
    assert_true(transferred instanceof TransformStream,
        'instanceof check should pass');

    // Perform a brand-check on |transferred|.
    const readableGetter = Object.getOwnPropertyDescriptor(
    TransformStream.prototype, 'readable').get;
    assert_true(readableGetter.call(transferred) instanceof ReadableStream,
      'brand check should pass and readable stream should result');
    const writableGetter = Object.getOwnPropertyDescriptor(
    TransformStream.prototype, 'writable').get;
    assert_true(writableGetter.call(transferred) instanceof WritableStream,
      'brand check should pass and writable stream should result');
  });
}, `should be able to transfer a TransformStream`);

test(() => {
  const ts = new TransformStream();
  const writer = ts.writable.getWriter();
  assert_throws_dom('DataCloneError', () => failToTransfer(ts),
                    'transferring should throw');
  assert_false(ts.readable.locked, 'readable side should not get locked');
}, 'a TransformStream with a locked writable should not be transferable');

test(() => {
  const ts = new TransformStream();
  const reader = ts.readable.getReader();
  assert_throws_dom('DataCloneError', () => failToTransfer(ts),
                    'transferring should throw');
  assert_false(ts.writable.locked, 'writable side should not get locked');
}, 'a TransformStream with a locked readable should not be transferable');

test(() => {
  const ts = new TransformStream();
  const reader = ts.readable.getReader();
  const writer = ts.writable.getWriter();
  assert_throws_dom('DataCloneError', () => failToTransfer(ts),
                    'transferring should throw');
}, 'a TransformStream with both sides locked should not be transferable');

promise_test(t => {
  const source = new ReadableStream({
    start(controller) {
      controller.enqueue('hello ');
      controller.enqueue('there ');
      controller.close();
    }
  });
  let resolve;
  const ready = new Promise(r => resolve = r);
  let result = '';
  const sink = new WritableStream({
    write(chunk) {
      if (result) {
        resolve();
      }
      result += chunk;
    }
  });
  const transform1 = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk.toUpperCase());
    }
  });
  const transform2 = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk + chunk);
    }
  });
  return transfer(t, {source, sink, transform1, transform2},
    [source, transform1, sink, transform2])
    .then(data => {
      resolve(data.source
        .pipeThrough(data.transform1)
        .pipeThrough(data.transform2)
        .pipeTo(data.sink));
    })
    .then(() => ready)
    .then(() => {
      assert_equals(result, 'HELLO HELLO THERE THERE ',
                    'transforms should have been applied');
    });
}, 'piping through transferred transforms should work');
