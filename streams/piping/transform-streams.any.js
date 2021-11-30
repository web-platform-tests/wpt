// META: global=window,worker,jsshell
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

  const ws = new WritableStream();

  await rs.pipeThrough(ts).pipeTo(ws);

  const writer = ws.getWriter();
  await writer.closed;
}, 'Piping through an identity transform stream should close the destination when the source closes');
