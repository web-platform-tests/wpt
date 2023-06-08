// META: global=window,worker
// META: script=../resources/test-utils.js
'use strict';

const thrownError = new Error('bad things are happening!');
thrownError.name = 'error1';

promise_test(async t => {
  let cancelled = undefined;
  const ts = new TransformStream({
    cancel(reason) {
      cancelled = reason;
    }
  });
  const res = await ts.readable.cancel(thrownError)
  assert_equals(res, undefined, 'readable.cancel() should return undefined');
  assert_equals(cancelled, thrownError, 'transformer.cancel() should be called with the passed reason');
}, 'cancelling the readable side should call transformer.cancel()');

promise_test(async t => {
  const originalReason = new Error('original reason');
  const ts = new TransformStream({
    cancel(reason) {
      assert_equals(reason, originalReason, 'transformer.cancel() should be called with the passed reason');
      throw thrownError;
    }
  });
  const writer = ts.writable.getWriter();
  const cancelPromise = ts.readable.cancel(originalReason)
  await promise_rejects_exactly(t, thrownError, cancelPromise, 'readable.cancel() should reject with thrownError');
  await promise_rejects_exactly(t, originalReason, writer.closed, 'writer.closed should reject with original reason');
}, 'cancelling the readable side should reject if transformer.cancel() throws');

promise_test(async t => {
  let aborted = undefined;
  const ts = new TransformStream({
    cancel(reason) {
      aborted = reason;
    },
    flush: t.unreached_func('flush should not be called')
  });
  const res = await ts.writable.abort(thrownError)
  assert_equals(res, undefined, 'writable.abort() should return undefined');
  assert_equals(aborted, thrownError, 'transformer.abort() should be called with the passed reason');
}, 'aborting the writable side should call transformer.abort()');

promise_test(async t => {
  const originalReason = new Error('original reason');
  const ts = new TransformStream({
    cancel(reason) {
      assert_equals(reason, originalReason, 'transformer.cancel() should be called with the passed reason');
      throw thrownError;
    },
    flush: t.unreached_func('flush should not be called')
  });
  const reader = ts.readable.getReader();
  const abortPromise = ts.writable.abort(originalReason)
  await promise_rejects_exactly(t, thrownError, abortPromise, 'writable.abort() should reject with thrownError');
  await promise_rejects_exactly(t, originalReason, reader.closed, 'reader.closed should reject with original reason');
}, 'aborting the writable side should reject if transformer.cancel() throws');

promise_test(async t => {
  const originalReason = new Error('original reason');
  const ts = new TransformStream({
    async cancel(reason) {
      assert_equals(reason, originalReason, 'transformer.cancel() should be called with the passed reason');
      throw thrownError;
    },
    flush: t.unreached_func('flush should not be called')
  });
  const cancelPromise = ts.readable.cancel(originalReason);
  const closePromise = ts.writable.close();
  await Promise.all([
    promise_rejects_exactly(t, thrownError, cancelPromise, 'cancelPromise should reject with thrownError'),
    promise_rejects_exactly(t, originalReason, closePromise, 'closePromise should reject with thrownError'),
  ]);
}, 'closing the writable side should reject if a parallel transformer.cancel() throws');

promise_test(async t => {
  let flushed = false;
  const ts = new TransformStream({
    flush() {
      flushed = true;
    },
    cancel: t.unreached_func('cancel should not be called')
  });
  const closePromise = ts.writable.close();
  await delay(0);
  const cancelPromise = ts.readable.cancel(thrownError);
  await Promise.all([closePromise, cancelPromise]);
  assert_equals(flushed, true, 'transformer.flush() should be called');
}, 'closing the writable side should call transformer.flush() and a parallel readable.cancel() should not reject');
