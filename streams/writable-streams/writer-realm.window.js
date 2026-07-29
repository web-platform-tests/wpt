// META: script=../resources/test-utils.js

// Creates and inserts an iframe for the test. Sets the "realmName" on the
// window object of the iframe and this window. Adds a cleanup function to the
// test `t` to remove the iframe at the end of the test. Creates a
// ReadableStreamDefaultWriter for `writableStream` using the iframe's version
// of the constructor.
function GetWriterInOtherFrame(t, writableStream) {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  t.add_cleanup(() => iframe.remove());
  const iframeWindow = iframe.contentWindow;
  iframeWindow.Object.prototype.realmName = 'other';
  Object.prototype.realmName = 'mine';
  return new iframeWindow.WritableStreamDefaultWriter(writableStream);
}

promise_test(async t => {
  const ws = new WritableStream();
  const writer = GetWriterInOtherFrame(t, ws);
  let ready = writer.ready;
  assert_equals(ready.realmName, 'other',
                'ready should be created in the writer realm');
  await ready;
  const writePromise = writer.write('chunk');
  let oldReady = ready;
  ready = writer.ready;
  assert_not_equals(oldReady, ready, 'the promise should have changed');
  assert_equals(ready.realmName, 'other',
                'ready should be re-created in the writer realm');
  await writePromise;
  assert_equals(ready, writer.ready, 'the promise should not have changed');
  const error = new Error();
  writer.abort(error);
  oldReady = ready;
  ready = writer.ready;
  assert_not_equals(oldReady, ready, 'the promise should have changed');
  assert_equals(ready.realmName, 'other',
                'ready should still be in the writer realm');
  await promise_rejects_exactly(t, error, ready, 'ready should be rejected');
}, 'ready promise should be created in the writer realm');

promise_test(async t => {
  let controller;
  const ws = new WritableStream({
    start(c) {
      controller = c;
    }
  });
  const writer = GetWriterInOtherFrame(t, ws);
  await writer.ready;
  const oldReady = writer.ready;
  const error = new Error();
  controller.error(error);
  assert_not_equals(writer.ready, oldReady,
                'the promise should have changed');
  assert_equals(writer.ready.realmName, 'mine',
                'the promise should be created in the stream realm');
  await promise_rejects_exactly(t, error, writer.ready,
                                'ready should be rejected');
}, 'ready promise should be recreated in the stream realm');

promise_test(async t => {
  const error = new Error();
  const ws = new WritableStream({
    start(controller) {
      return Promise.reject(error);
    }
  });
  const writer = new GetWriterInOtherFrame(t, ws);
  const firstReady = writer.ready;
  assert_equals(firstReady.realmName, 'other',
                'the promise should be created in the writer realm');
  await firstReady;
  const secondReady = writer.ready;
  assert_not_equals(firstReady, secondReady,
                    'the promise should have changed');
  assert_equals(secondReady.realmName, 'mine',
                'the rejected promise should be created in the stream realm');
  await promise_rejects_exactly(t, error, secondReady,
                                'ready should be rejected');
}, 'ready promise should be rejected in the stream realm');

promise_test(async t => {
  const ws = new WritableStream();
  const writer = GetWriterInOtherFrame(t, ws);
  const originalClosed = writer.closed;
  assert_equals(originalClosed.realmName, 'other',
                'promise should have been created in the writer realm');
  writer.close();
  await originalClosed;
  assert_equals(originalClosed, writer.closed,
                'promise should not have changed');
}, 'closed promise is created in the writer realm');
