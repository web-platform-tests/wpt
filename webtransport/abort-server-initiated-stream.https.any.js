// META: global=window,worker
// META: script=/common/get-host-info.sub.js
// META: script=resources/webtransport-test-helpers.sub.js

promise_test(async t => {
  const wt =
      new WebTransport(webtransport_url('abort-server-initiated-stream.py'));
  await wt.ready;

  // Need to ensure that the reset has been processed. Unfortunately, there's no
  // reliable way to do this, we just have to wait a second and hope that's long
  // enough.
  await wait(1000);

  const reader = wt.incomingUnidirectionalStreams.getReader();

  // read() should not return, since the stream has been reset. Unfortunately,
  // in order to be sure it won't return we need another delay.
  const result = await Promise.any([reader.read(), wait(1000)]);

  assert_equals(result, undefined, 'read() should not have happened');
}, 'Reset incoming unidirectional stream should not be seen by JavaScript');
