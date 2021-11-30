// META: global=window,worker,jsshell
// META: script=../resources/recording-streams.js
'use strict';

promise_test(async () => {
  const rs = new ReadableStream({
    start(c) {
      c.enqueue('a');
      c.enqueue('b');
      c.enqueue('c');
      c.close();
    }
  });

  const ts = new TransformStream();

  const ws = recordingWritableStream();

  await rs.pipeThrough(ts).pipeTo(ws);
  assert_array_equals(ws.events, ['write', 'a', 'write', 'b', 'write', 'c', 'close']);

  const writer = ws.getWriter();
  await writer.closed;
}, 'Piping through an identity transform stream should close the destination when the source closes');

promise_test(async () => {
  const rs = new ReadableStream({
    start(c) {
      c.enqueue('a');
      c.enqueue('b');
      c.enqueue('c');
      c.close();
    }
  });

  const ts = new TransformStream({}, { highWaterMark: 0 });

  const ws = recordingWritableStream();

  await rs.pipeThrough(ts).pipeTo(ws);
  assert_array_equals(ws.events, ['write', 'a', 'write', 'b', 'write', 'c', 'close']);

  const writer = ws.getWriter();
  await writer.closed;
}, 'Piping through an identity transform stream with writable HWM = 0 should work');
