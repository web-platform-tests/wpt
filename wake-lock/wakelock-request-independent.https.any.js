'use strict';

promise_test(async t => {
  const controller1 = new AbortController();
  const controller2 = new AbortController();
  const signal1 = controller1.signal;
  const signal2 = controller2.signal;

  const lock1 = new WakeLock("screen");
  const lock2 = new WakeLock("screen");

  await lock1.request({ signal1 });
  assert_true(lock1.active, "lock1 should be active when it is acquired");
  assert_true(lock2.active, "lock2 should be active as wake lock state is global");

  controller1.abort();

  // aborts request1 should not affect request2's AbortSignal
  assert_true(signal1.aborted, "signal1 is aborted");
  assert_false(signal2.aborted, "signal2 is not aborted");

  // wake lock states are still the same
  assert_false(lock1.active, "lock1 should be inactive");
  assert_false(lock2.active, "lock2 should be inactive");

  await lock2.request({ signal2 });
  assert_true(lock2.active, "lock2 should be active when it is acquired");
  assert_true(lock1.active, "lock1 should be active as wake lock state is global");

  controller2.abort();

  assert_true(signal2.aborted, "signal2 is aborted");
  assert_true(signal1.aborted, "signal1 is already aborted");

  // wake lock states are still the same
  assert_false(lock2.active, "lock2 should be inactive");
  assert_false(lock1.active, "lock1 should be inactive");
}, "Two wake lock requests are created and aborted independently");
