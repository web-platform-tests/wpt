'use strict';

// Tests for the use of pipeTo with AbortSignal.
// There is some extra complexity to avoid timeouts in environments where abort is not implemented.

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/recording-streams.js');
}

const error1 = new Error('error1');
error1.name = 'error1';
const error2 = new Error('error2');
error2.name = 'error2';

const errorOnPull = {
  pull(controller) {
    // This will cause the test to error if pipeTo abort is not implemented.
    controller.error('failed to abort');
  }
};

// To stop pull() being called immediately when the stream is created, we need to set highWaterMark to 0.
const hwm0 = { highWaterMark: 0 };

for (const invalidSignal of [null, 'AbortSignal', true, -1, Object.create(AbortSignal.prototype)]) {
  promise_test(t => {
    const rs = new ReadableStream({
      start(controller) {
        controller.close();
      }
    });
    const ws = new WritableStream();
    return promise_rejects(t, new TypeError(), rs.pipeTo(ws, { signal: invalidSignal }), 'pipeTo should reject');
  }, `a signal argument '${invalidSignal}' should cause pipeTo() to reject`);
}

promise_test(t => {
  const rs = recordingReadableStream(errorOnPull, hwm0);
  const ws = new WritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal }), 'pipeTo should reject')
      .then(() => Promise.all([
        rs.getReader().closed,
        promise_rejects(t, 'AbortError', ws.getWriter().closed, 'writer.closed should reject')
      ]))
      .then(() => {
        assert_equals(rs.events.length, 2, 'cancel should have been called');
        assert_equals(rs.events[0], 'cancel', 'first event should be cancel');
        assert_equals(rs.events[1].name, 'AbortError', 'the argument to cancel should be an AbortError');
      });
}, 'an aborted signal should cause the writable stream to reject with an AbortError');

promise_test(() => {
  let error;
  const rs = recordingReadableStream(errorOnPull, hwm0);
  const ws = new WritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return rs.pipeTo(ws, { signal })
      .catch(e => {
        error = e;
      })
      .then(() => Promise.all([
        rs.getReader().closed,
        ws.getWriter().closed.catch(e => {
          assert_equals(e, error, 'the writable should be errored with the same object');
        })
      ]))
  .then(() => {
    assert_equals(rs.events.length, 2, 'cancel should have been called');
    assert_equals(rs.events[0], 'cancel', 'first event should be cancel');
    assert_equals(rs.events[1], error, 'the readable should be canceled with the same object');
  });
}, 'all the AbortError objects should be the same object');

promise_test(t => {
  const rs = recordingReadableStream(errorOnPull, hwm0);
  const ws = new WritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal, preventCancel: true }), 'pipeTo should reject')
      .then(() => assert_equals(rs.events.length, 0, 'cancel should not be called'));
}, 'preventCancel should prevent canceling the readable');

promise_test(t => {
  const rs = new ReadableStream(errorOnPull, hwm0);
  const ws = recordingWritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal, preventAbort: true }), 'pipeTo should reject')
      .then(() => {
        assert_equals(ws.events.length, 0, 'writable should not have been aborted');
        return ws.getWriter().ready;
      });
}, 'preventAbort should prevent aborting the readable');

promise_test(t => {
  const rs = new ReadableStream({
    start(controller) {
      controller.enqueue('a');
      controller.enqueue('b');
      controller.close();
    }
  });
  const abortController = new AbortController();
  const signal = abortController.signal;
  const ws = recordingWritableStream({
    write() {
      abortController.abort();
    }
  });
  return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal }), 'pipeTo should reject')
      .then(() => {
        assert_equals(ws.events.length, 4, 'only chunk "a" should have been written');
        assert_array_equals(ws.events.slice(0, 3), ['write', 'a', 'abort'], 'events should match');
        assert_equals(ws.events[3].name, 'AbortError', 'abort reason should be an AbortError');
      });
}, 'abort should prevent further reads');

promise_test(t => {
  const rs = new ReadableStream({
    pull(controller) {
      controller.error('failed to abort');
    },
    cancel() {
      return Promise.reject(error1);
    }
  }, hwm0);
  const ws = new WritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, error1, rs.pipeTo(ws, { signal }), 'pipeTo should reject');
}, 'a rejection from underlyingSource.cancel() should be returned by pipeTo()');

promise_test(t => {
  const rs = new ReadableStream(errorOnPull, hwm0);
  const ws = new WritableStream({
    abort() {
      return Promise.reject(error1);
    }
  });
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, error1, rs.pipeTo(ws, { signal }), 'pipeTo should reject');
}, 'a rejection from underlyingSink.abort() should be returned by pipeTo()');

promise_test(t => {
  const events = [];
  const rs = new ReadableStream({
    pull(controller) {
      controller.error('failed to abort');
    },
    cancel() {
      events.push('cancel');
      return Promise.reject(error1);
    }
  }, hwm0);
  const ws = new WritableStream({
    abort() {
      events.push('abort');
      return Promise.reject(error2);
    }
  });
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, error2, rs.pipeTo(ws, { signal }), 'pipeTo should reject')
      .then(() => assert_array_equals(events, ['abort', 'cancel'], 'abort() should be called before cancel()'));
}, 'a rejection from underlyingSink.abort() should be preferred to one from underlyingSource.cancel()');

promise_test(t => {
  const rs = new ReadableStream({
    start(controller) {
      controller.close();
    }
  });
  const ws = new WritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal }), 'pipeTo should reject');
}, 'abort signal takes priority over closed readable');

promise_test(t => {
  const rs = new ReadableStream({
    start(controller) {
      controller.error(error1);
    }
  });
  const ws = new WritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal }), 'pipeTo should reject');
}, 'abort signal takes priority over errored readable');

promise_test(t => {
  const rs = new ReadableStream({
    pull(controller) {
      controller.error('failed to abort');
    }
  }, hwm0);
  const ws = new WritableStream();
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  const writer = ws.getWriter();
  return writer.close().then(() => {
    writer.releaseLock();
    return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal }), 'pipeTo should reject');
  });
}, 'abort signal takes priority over closed writable');

promise_test(t => {
  const rs = new ReadableStream({
    pull(controller) {
      controller.error('failed to abort');
    }
  }, hwm0);
  const ws = new WritableStream({
    start(controller) {
      controller.error(error1);
    }
  });
  const abortController = new AbortController();
  const signal = abortController.signal;
  abortController.abort();
  return promise_rejects(t, 'AbortError', rs.pipeTo(ws, { signal }), 'pipeTo should reject');
}, 'abort signal takes priority over errored writable');

done();
