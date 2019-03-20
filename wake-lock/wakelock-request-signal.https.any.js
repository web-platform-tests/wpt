// META: title=WakeLock.request() AbortSignal Test

'use strict';

promise_test(async t => {
  const invalidSignals = [
    "string",
    123,
    {},
    true,
    Symbol(),
    () => {},
    self
  ];

  const wakeLock = new WakeLock("screen");

  for (let signal of invalidSignals) {
    await promise_rejects(t, new TypeError(), wakeLock.request({ signal: signal }));
  }
}, "'TypeError' is thrown when the signal option is not an AbortSignal");

promise_test(async t => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const wakeLock = new WakeLock("screen");
  await promise_rejects(t, new TypeError(), wakeLock.request({ signal }));
}, "request() with an already aborted signal should be rejected with an 'AbortError'");
