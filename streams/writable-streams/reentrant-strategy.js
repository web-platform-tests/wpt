'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/test-utils.js');
  self.importScripts('../resources/recording-streams.js');
}

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
      .then(() => Promise.resolve())
      .then(() => {
        assert_array_equals(ws.events, ['write', 0, 'write', 1, 'write', 2], 'writes should appear in order');
      });
}, 'writes should be written in the standard order');

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
      .then(() => {
        assert_array_equals(ws.events, ['write', 0, 'write', 1], 'promise should resolve early');
        return writer.close();
      })
      .then(() => {
        assert_array_equals(ws.events, ['write', 0, 'write', 1, 'write', 2, 'close'],
                            'write should happen before close');
      });
}, 'writer.write() promise should resolve too early');

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
                                     'writer.write done', 0]);
      });
}, 'writer.write() promises should resolve in the standard order');

done();
