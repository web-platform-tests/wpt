//META: title=Screen wake lock should not be allowed in dedicated worker
importScripts("/resources/testharness.js");

promise_test(async t => {
  await promise_rejects(t, "NotAllowedError", WakeLock.request('screen'));
}, "Screen wake lock should not be allowed in dedicated worker");

done();
