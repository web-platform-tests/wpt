// META: global=window,worker,jsshell
// META: script=../resources/test-utils.js
'use strict';

promise_test(async () => {
  let controller;
  const ws = new WritableStream({
    start(c) {
      controller = c;
    }
  }, { highWaterMark: 0 });
  const writer = ws.getWriter();
  assert_equals(writer.desiredSize, 0, 'desiredSize should be 0');

  let ready1Resolved = false;
  const ready1 = writer.ready;
  ready1.then(() => { ready1Resolved = true });
  await flushAsyncEvents();
  assert_false(ready1Resolved, 'writer.ready should be pending');

  controller.releaseBackpressure();
  await ready1;
  assert_true(ready1Resolved, 'writer.ready should be resolved after releaseBackpressure()');
  assert_equals(writer.desiredSize, 0, 'desiredSize should be 0');

  writer.write('a');
  let ready2Resolved = false;
  const ready2 = writer.ready;
  ready2.then(() => { ready2Resolved = true });
  assert_not_equals(ready1, ready2, 'writer.ready should be a new promise after write()');
  await flushAsyncEvents();
  assert_false(ready2Resolved, 'writer.ready should be pending');
  assert_equals(writer.desiredSize, 0, 'desiredSize should be 0');

  controller.releaseBackpressure();
  await ready2;
  assert_true(ready2Resolved, 'writer.ready should be resolved after releaseBackpressure()');
  assert_equals(writer.desiredSize, 0, 'desiredSize should be 0');
}, 'releaseBackpressure() resolves ready promise on a stream with HWM 0');
