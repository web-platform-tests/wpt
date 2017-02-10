'use strict';

// These tests exercise the pathological case of calling WritableStream* methods from within the strategy.size()
// callback. This is not something any real code should ever do. Implementations are not expected to exhibit sane
// behaviour in this case, but they should have the same behaviour. Failures here indicate subtle deviations from the
// standard that may affect real, non-pathological code.

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/test-utils.js');
  self.importScripts('../resources/recording-streams.js');
}

const error1 = { name: 'error1' };

promise_test(() => {
  let writer;
  const strategy = {
    size(chunk) {
      if (chunk > 0) {
        writer.write(chunk - 1);
      }
      return chunk;
    }
  };

  const ws = recordingWritableStream({}, strategy);
  writer = ws.getWriter();
  return writer.write(2)
      .then(() => Promise.resolve()) // See next test for why this is needed.
      .then(() => {
        assert_array_equals(ws.events, ['write', 0, 'write', 1, 'write', 2], 'writes should appear in order');
      });
}, 'writes should be written in the standard order');

promise_test(() => {
  let writer;
  const events = [];
  const strategy = {
    size(chunk) {
      events.push('size', chunk);
      if (chunk > 0) {
        writer.write(chunk - 1)
            .then(() => events.push('writer.write done', chunk - 1));
      }
      return chunk;
    }
  };
  const ws = new WritableStream({
    write(chunk) {
      events.push('sink.write', chunk);
    }
  }, strategy);
  writer = ws.getWriter();
  return writer.write(2)
      .then(() => events.push('writer.write done', 2))
      .then(() => flushAsyncEvents())
      .then(() => {
        assert_array_equals(events, ['size', 2, 'size', 1, 'size', 0,
                                     'sink.write', 0, 'sink.write', 1, 'writer.write done', 2,
                                     'sink.write', 2, 'writer.write done', 1,
                                     'writer.write done', 0],
                            'events should happen in standard order');
      });
}, 'writer.write() promises should resolve in the standard order');

promise_test(t => {
  let controller;
  const strategy = {
    size() {
      controller.error(error1);
      return 1;
    }
  };
  const ws = recordingWritableStream({
    start(c) {
      controller = c;
    }
  }, strategy);
  const resolved = [];
  const writer = ws.getWriter();
  const readyPromise1 = writer.ready.then(() => resolved.push('ready1'));
  const writePromise = promise_rejects(t, error1, writer.write(),
                                       'write() should reject with error1')
                                           .then(() => resolved.push('write'));
  const readyPromise2 = promise_rejects(t, error1, writer.ready, 'ready should reject with error1')
      .then(() => resolved.push('ready2'));
  const closedPromise = promise_rejects(t, error1, writer.closed, 'closed should reject with error1')
      .then(() => resolved.push('closed'));
  return Promise.all([readyPromise1, writePromise, readyPromise2, closedPromise])
      .then(() => {
        assert_array_equals(resolved, ['ready1', 'write', 'ready2', 'closed'],
                            'promises should resolve in standard order');
        assert_array_equals(ws.events, [], 'underlying sink write should not be called');
      });
}, 'controller.error() should work when called from within strategy.size()');

promise_test(() => {
  let writer;
  const strategy = {
    size() {
      writer.close('C');
      return 1;
    }
  };

  const ws = recordingWritableStream({}, strategy);
  writer = ws.getWriter();
  return writer.write('W')
      .then(() => {
        assert_array_equals(ws.events, ['write', 'W', 'close', 'C'], 'close should happen after write');
      });
}, 'close() should be work when called from within strategy.size()');

done();
